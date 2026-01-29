/**
 * Lord of the Components - IDE Autocomplete Command
 *
 * Generates autocomplete data for IDEs (VS Code, IntelliJ/WebStorm).
 */

import { resolve, dirname } from 'node:path';
import chalk from 'chalk';
import { parseKdlFile } from '../../parser/kdl-parser.js';
import { ComponentLoader } from '../../loader/component-loader.js';
import { generateWebTypes } from '../../generators/ide/web-types.js';
import { generateVSCodeCustomData } from '../../generators/ide/vscode-custom-data.js';

interface IdeOptions {
  configPath: string;
  outputDir?: string;
  docBaseUrl?: string;
  format?: 'all' | 'vscode' | 'webstorm';
  verbose?: boolean;
}

/**
 * Generate IDE autocomplete files
 */
export async function generateIdeSupport(options: IdeOptions): Promise<void> {
  const projectRoot = dirname(options.configPath);

  // Load config
  const config = await parseKdlFile(options.configPath);
  const configNode = config.getNode('config');

  // Determine output directory
  const defaultOutput = configNode?.getChild('output')?.getString(0) || 'dist';
  const outputDir = options.outputDir || resolve(projectRoot, defaultOutput, 'ide');

  // Load components
  const loader = new ComponentLoader(projectRoot);
  const components = await loader.loadAll();

  if (options.verbose) {
    console.log(chalk.gray(`Found ${components.length} components`));
  }

  const format = options.format || 'all';
  const generatedFiles: string[] = [];

  // Generate VS Code custom data
  if (format === 'all' || format === 'vscode') {
    const vscodePath = resolve(outputDir, 'lotc.html-data.json');
    await generateVSCodeCustomData(components, {
      outputPath: vscodePath,
      docBaseUrl: options.docBaseUrl,
    });
    generatedFiles.push(vscodePath);

    if (options.verbose) {
      console.log(chalk.gray(`  Generated VS Code custom data: ${vscodePath}`));
    }
  }

  // Generate web-types for WebStorm/IntelliJ
  if (format === 'all' || format === 'webstorm') {
    const webTypesPath = resolve(outputDir, 'web-types.json');
    await generateWebTypes(components, {
      outputPath: webTypesPath,
      docBaseUrl: options.docBaseUrl,
    });
    generatedFiles.push(webTypesPath);

    if (options.verbose) {
      console.log(chalk.gray(`  Generated web-types: ${webTypesPath}`));
    }
  }

  console.log(chalk.green(`IDE support generated: ${generatedFiles.length} files`));

  // Print usage instructions
  console.log(chalk.gray('\nUsage:'));
  if (format === 'all' || format === 'vscode') {
    console.log(chalk.gray(`  VS Code: Add to settings.json:`));
    console.log(chalk.gray(`    "html.customData": ["${resolve(outputDir, 'lotc.html-data.json')}"]`));
  }
  if (format === 'all' || format === 'webstorm') {
    console.log(chalk.gray(`  WebStorm: Add "web-types" to package.json:`));
    console.log(chalk.gray(`    "web-types": "./dist/ide/web-types.json"`));
  }
}
