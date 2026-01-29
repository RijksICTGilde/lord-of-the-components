/**
 * Lord of the Components - Extract Command
 *
 * Extracts Jinja2 templates to RigScript format.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname, basename, extname } from 'node:path';
import chalk from 'chalk';
import { jinja2ToRigScript, type GeneratorOptions } from '../../extractors/rigscript-generator.js';

export interface ExtractOptions {
  /** Input Jinja2 template file */
  input: string;
  /** Output .rig file path */
  output?: string;
  /** Include comments from source template */
  includeComments?: boolean;
  /** Verbose output */
  verbose?: boolean;
}

/**
 * Extract a Jinja2 template to RigScript
 */
export async function extractTemplate(options: ExtractOptions): Promise<void> {
  const inputPath = resolve(process.cwd(), options.input);

  // Determine output path
  let outputPath: string;
  if (options.output) {
    outputPath = resolve(process.cwd(), options.output);
  } else {
    // Default: same directory, same name with .rig extension
    const dir = dirname(inputPath);
    const name = basename(inputPath, extname(inputPath));
    // Remove .html if present (e.g., button.html.j2 -> button.rig)
    const cleanName = name.replace(/\.html$/, '');
    outputPath = resolve(dir, `${cleanName}.rig`);
  }

  if (options.verbose) {
    console.log(chalk.gray(`Reading: ${inputPath}`));
  }

  // Read input file
  const source = await readFile(inputPath, 'utf-8');

  // Derive component name from filename
  const componentName = basename(outputPath, '.rig')
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

  // Generator options
  const generatorOptions: GeneratorOptions = {
    componentName,
    includeComments: options.includeComments ?? true,
    mapCtxToProps: true,
    mapContentToSlot: true,
  };

  if (options.verbose) {
    console.log(chalk.gray(`Converting with options: ${JSON.stringify(generatorOptions)}`));
  }

  // Convert to RigScript
  const rigScript = jinja2ToRigScript(source, generatorOptions);

  // Ensure output directory exists
  const outputDir = dirname(outputPath);
  await mkdir(outputDir, { recursive: true });

  // Write output file
  await writeFile(outputPath, rigScript, 'utf-8');

  console.log(chalk.green(`Extracted: ${inputPath}`));
  console.log(chalk.green(`       To: ${outputPath}`));

  if (options.verbose) {
    console.log(chalk.gray('\nGenerated RigScript:'));
    console.log(chalk.gray('---'));
    console.log(rigScript);
    console.log(chalk.gray('---'));
  }
}
