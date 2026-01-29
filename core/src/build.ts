/**
 * Lord of the Components - Build System
 *
 * Orchestrates the build process for tokens and components.
 */

import { mkdir, writeFile, watch } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { parseKdlFile } from './parser/kdl-parser.js';
import { TokenLoader } from './loader/token-loader.js';
import { ComponentLoader } from './loader/component-loader.js';
import { ThemeLoader } from './loader/theme-loader.js';
import { TokenResolver } from './resolver/token-resolver.js';

export interface BuildOptions {
  configPath: string;
  outputDir?: string;
  theme?: string;
  watch?: boolean;
  tokensOnly?: boolean;
  verbose?: boolean;
}

export interface BuildResult {
  success: boolean;
  outputDir: string;
  files: string[];
  errors: string[];
}

/**
 * Main build function
 */
export async function build(options: BuildOptions): Promise<BuildResult> {
  const projectRoot = dirname(options.configPath);
  const files: string[] = [];
  const errors: string[] = [];

  // Load config
  const config = await parseKdlFile(options.configPath);
  const configNode = config.getNode('config');
  const outputDir = options.outputDir ||
    configNode?.getChild('output')?.getString(0) ||
    'dist';
  const outputPath = resolve(projectRoot, outputDir);

  // Create output directories
  await mkdir(join(outputPath, 'tokens'), { recursive: true });

  // Load tokens
  const tokenLoader = new TokenLoader(projectRoot);
  await tokenLoader.loadAll();

  // Load theme
  const themeLoader = new ThemeLoader(projectRoot);
  await themeLoader.loadAll();

  const themeName = options.theme ||
    configNode?.getChild('default-theme')?.getString(0) ||
    'default';
  const theme = themeLoader.getTheme(themeName);

  if (!theme) {
    errors.push(`Theme "${themeName}" not found`);
    return { success: false, outputDir: outputPath, files, errors };
  }

  // Resolve tokens
  const resolver = new TokenResolver(tokenLoader.getPrimitives());

  try {
    const resolvedTokens = resolver.resolveAll(theme.tokens);

    // Generate CSS tokens
    const css = resolver.toCss(resolvedTokens);
    const cssPath = join(outputPath, 'tokens', 'tokens.css');
    await writeFile(cssPath, css);
    files.push(cssPath);

    if (options.verbose) {
      console.log(`  Generated: ${cssPath}`);
    }

    // Generate JSON tokens
    const json = resolver.toJson(resolvedTokens);
    const jsonPath = join(outputPath, 'tokens', 'tokens.json');
    await writeFile(jsonPath, json);
    files.push(jsonPath);

    if (options.verbose) {
      console.log(`  Generated: ${jsonPath}`);
    }
  } catch (error) {
    errors.push(`Token resolution failed: ${error instanceof Error ? error.message : error}`);
  }

  // Build components (unless tokensOnly)
  if (!options.tokensOnly) {
    const componentLoader = new ComponentLoader(projectRoot);
    await componentLoader.loadAll();

    // Generate component registry (for Python/Jinja2)
    const components = componentLoader.getComponentsInOrder();
    const registry = generateRegistry(components);
    const registryPath = join(outputPath, 'registry.json');
    await writeFile(registryPath, JSON.stringify(registry, null, 2));
    files.push(registryPath);

    if (options.verbose) {
      console.log(`  Generated: ${registryPath}`);
      console.log(`  Components: ${components.map((c) => c.name).join(', ')}`);
    }
  }

  // Watch mode
  if (options.watch) {
    console.log('\nWatching for changes...');
    console.log('Press Ctrl+C to stop\n');

    const watchDirs = [
      join(projectRoot, 'tokens'),
      join(projectRoot, 'themes'),
      join(projectRoot, 'packages'),
      join(projectRoot, 'components'),
    ];

    let debounceTimer: NodeJS.Timeout | null = null;

    const rebuild = async () => {
      console.log('\nRebuilding...');
      try {
        await build({ ...options, watch: false });
        console.log('Build complete!');
      } catch (error) {
        console.error('Build failed:', error);
      }
    };

    for (const dir of watchDirs) {
      try {
        const watcher = watch(dir, { recursive: true });
        (async () => {
          for await (const event of watcher) {
            if (event.filename?.endsWith('.kdl') || event.filename?.endsWith('.rig')) {
              // Debounce rapid file changes
              if (debounceTimer) {
                clearTimeout(debounceTimer);
              }
              debounceTimer = setTimeout(rebuild, 100);
            }
          }
        })().catch(() => {
          // Directory doesn't exist, skip
        });
      } catch {
        // Directory doesn't exist, skip
      }
    }

    // Keep the process running
    await new Promise(() => {});
  }

  return {
    success: errors.length === 0,
    outputDir: outputPath,
    files,
    errors,
  };
}

/**
 * Generate a component registry for runtime use
 */
function generateRegistry(components: any[]): object {
  const registry: Record<string, any> = {};

  for (const component of components) {
    registry[component.name] = {
      name: component.name,
      description: component.description,
      category: component.category,
      status: component.status,
      props: component.props.map((p: any) => ({
        name: p.name,
        type: p.type,
        required: p.required,
        default: p.default,
        enumValues: p.enumValues,
      })),
      slots: component.slots.map((s: any) => ({
        name: s.name,
        required: s.required,
      })),
      dependsOn: component.dependsOn,
    };
  }

  return {
    version: '0.1.0',
    components: registry,
  };
}
