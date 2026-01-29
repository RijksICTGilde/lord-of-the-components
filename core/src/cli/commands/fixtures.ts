/**
 * Lord of the Components - Fixtures Command
 *
 * Generates HTML fixture files for visual regression testing.
 */

import { resolve, dirname } from 'node:path';
import chalk from 'chalk';
import { parseKdlFile } from '../../parser/kdl-parser.js';
import { ComponentLoader } from '../../loader/component-loader.js';
import { FixtureGenerator } from '../../generators/fixtures/index.js';

interface FixturesOptions {
  configPath: string;
  outputDir?: string;
  cssPath?: string;
  verbose?: boolean;
}

/**
 * Generate visual test fixtures
 */
export async function generateFixtures(options: FixturesOptions): Promise<void> {
  const projectRoot = dirname(options.configPath);

  // Load config
  const config = await parseKdlFile(options.configPath);
  const configNode = config.getNode('config');

  // Determine output directory
  const defaultOutput = configNode?.getChild('output')?.getString(0) || 'dist';
  const outputDir = options.outputDir || resolve(projectRoot, 'tests/visual/fixtures');

  // Load components
  const loader = new ComponentLoader(projectRoot);
  const components = await loader.loadAll();

  if (options.verbose) {
    console.log(chalk.gray(`Found ${components.length} components`));
  }

  // Filter to components with examples
  const componentsWithExamples = components.filter(c => c.examples.length > 0);

  if (options.verbose) {
    console.log(chalk.gray(`${componentsWithExamples.length} components have examples`));
  }

  // Generate fixtures
  const generator = new FixtureGenerator({
    outputDir,
    cssPath: options.cssPath,
    includeAllVariants: true,
  });

  const filePaths = await generator.generate(componentsWithExamples);

  console.log(chalk.green(`Generated ${filePaths.length} fixture files`));
  console.log(chalk.gray(`Output: ${outputDir}`));

  if (options.verbose) {
    for (const filePath of filePaths) {
      console.log(chalk.gray(`  ${filePath}`));
    }
  }
}
