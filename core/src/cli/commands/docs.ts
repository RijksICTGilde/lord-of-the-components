/**
 * Lord of the Components - Docs Command
 *
 * Generates documentation site with live component examples.
 */

import { resolve, dirname } from 'node:path';
import chalk from 'chalk';
import { parseKdlFile } from '../../parser/kdl-parser.js';
import { ComponentLoader } from '../../loader/component-loader.js';
import { DocsGenerator } from '../../generators/docs/index.js';

interface DocsOptions {
  configPath: string;
  outputDir?: string;
  verbose?: boolean;
}

/**
 * Generate documentation site
 */
export async function generateDocs(options: DocsOptions): Promise<void> {
  const projectRoot = dirname(options.configPath);

  // Load config
  const config = await parseKdlFile(options.configPath);
  const configNode = config.getNode('config');

  // Determine output directory
  const defaultOutput = configNode?.getChild('output')?.getString(0) || 'dist';
  const outputDir = options.outputDir || resolve(projectRoot, defaultOutput, 'docs');

  // Get title from config
  const title = configNode?.getChild('name')?.getString(0) || 'Lord of the Components';

  // Load components
  const loader = new ComponentLoader(projectRoot);
  const components = await loader.loadAll();

  if (options.verbose) {
    console.log(chalk.gray(`Found ${components.length} components`));
  }

  // Generate documentation
  const generator = new DocsGenerator({
    outputDir,
    title,
    description: 'Implementation-agnostic component system',
    includePlayground: true,
    includeSearch: true,
    tokensPath: 'tokens/tokens.css',
  });

  const generatedFiles = await generator.generate(components);

  if (options.verbose) {
    for (const file of generatedFiles) {
      console.log(chalk.gray(`  Generated: ${file}`));
    }
  }

  console.log(chalk.gray(`Documentation generated at: ${outputDir}`));
}
