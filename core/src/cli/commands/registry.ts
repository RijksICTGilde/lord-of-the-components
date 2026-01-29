/**
 * Lord of the Components - Registry Command
 *
 * Generates a JSON registry file for Python and other integrations.
 */

import { resolve, dirname } from 'node:path';
import chalk from 'chalk';
import { parseKdlFile } from '../../parser/kdl-parser.js';
import { ComponentLoader } from '../../loader/component-loader.js';
import { RegistryGenerator } from '../../generators/registry/index.js';

interface RegistryOptions {
  configPath: string;
  outputPath?: string;
  includeExamples?: boolean;
  includeTokens?: boolean;
  verbose?: boolean;
}

/**
 * Generate component registry
 */
export async function generateRegistry(options: RegistryOptions): Promise<void> {
  const projectRoot = dirname(options.configPath);

  // Load config
  const config = await parseKdlFile(options.configPath);
  const configNode = config.getNode('config');

  // Determine output path
  const defaultOutput = configNode?.getChild('output')?.getString(0) || 'dist';
  const outputPath = options.outputPath || resolve(projectRoot, defaultOutput, 'registry.json');

  // Load components
  const loader = new ComponentLoader(projectRoot);
  const components = await loader.loadAll();

  if (options.verbose) {
    console.log(chalk.gray(`Found ${components.length} components`));
  }

  // Generate registry
  const generator = new RegistryGenerator({
    outputPath,
    includeExamples: options.includeExamples ?? true,
    includeTokens: options.includeTokens ?? true,
  });

  const filePath = await generator.generate(components);

  console.log(chalk.green(`Registry generated: ${filePath}`));

  if (options.verbose) {
    console.log(chalk.gray(`  Components: ${components.length}`));
    console.log(chalk.gray(`  Include examples: ${options.includeExamples ?? true}`));
    console.log(chalk.gray(`  Include tokens: ${options.includeTokens ?? true}`));
  }
}
