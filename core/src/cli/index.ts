#!/usr/bin/env node
/**
 * Lord of the Components - CLI
 *
 * Command line interface for building and managing components.
 */

import { parseArgs } from 'node:util';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import chalk from 'chalk';
import { build } from '../build.js';
import { validateProject } from './commands/validate.js';
import { generateDocs } from './commands/docs.js';
import { generateRegistry } from './commands/registry.js';
import { generateIdeSupport } from './commands/ide.js';
import { extractTemplate } from './commands/extract.js';
import { generateFixtures } from './commands/fixtures.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Version from package.json
const VERSION = '0.1.0';

interface CliOptions {
  help?: boolean;
  version?: boolean;
  config?: string;
  output?: string;
  input?: string;
  theme?: string;
  watch?: boolean;
  tokens?: boolean;
  verbose?: boolean;
  comments?: boolean;
  css?: string;
}

function printHelp(): void {
  console.log(`
${chalk.bold('Lord of the Components')} - Implementation-agnostic component system

${chalk.bold('Usage:')}
  lotc <command> [options]

${chalk.bold('Commands:')}
  build          Build components and tokens
  validate       Validate component definitions
  docs           Generate documentation site
  registry       Generate component registry for Python
  ide            Generate IDE autocomplete files
  extract        Extract Jinja2 template to RigScript
  test:fixtures  Generate visual test fixtures

${chalk.bold('Options:')}
  -h, --help      Show this help message
  -v, --version   Show version number
  -c, --config    Path to config file (default: lotc.config.kdl)
  -o, --output    Output directory/file (default: dist)
  -i, --input     Input file (for extract command)
  -t, --theme     Theme to use (default: from config)
  -w, --watch     Watch for changes and rebuild
  --tokens        Only build tokens (skip components)
  --comments      Include comments (for extract command)
  --css           CSS file path for fixtures
  --verbose       Enable verbose output

${chalk.bold('Examples:')}
  lotc build                    Build everything
  lotc build --tokens           Build only tokens
  lotc build --theme rvo        Build with RVO theme
  lotc build --watch            Build and watch for changes
  lotc validate                 Validate all definitions
  lotc docs                     Generate documentation
  lotc ide                      Generate IDE autocomplete
  lotc extract -i file.j2       Extract Jinja2 to RigScript
  lotc extract -i file.j2 -o out.rig  Extract with custom output
  lotc test:fixtures            Generate visual test fixtures
  lotc test:fixtures -o ./out   Custom output directory
`);
}

function printVersion(): void {
  console.log(`lotc v${VERSION}`);
}

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    options: {
      help: { type: 'boolean', short: 'h' },
      version: { type: 'boolean', short: 'v' },
      config: { type: 'string', short: 'c' },
      output: { type: 'string', short: 'o' },
      input: { type: 'string', short: 'i' },
      theme: { type: 'string', short: 't' },
      watch: { type: 'boolean', short: 'w' },
      tokens: { type: 'boolean' },
      comments: { type: 'boolean' },
      css: { type: 'string' },
      verbose: { type: 'boolean' },
    },
    allowPositionals: true,
  });

  const options = values as CliOptions;
  const command = positionals[0];

  if (options.help || (!command && !options.version)) {
    printHelp();
    process.exit(0);
  }

  if (options.version) {
    printVersion();
    process.exit(0);
  }

  const configPath = options.config
    ? resolve(process.cwd(), options.config)
    : resolve(process.cwd(), 'lotc.config.kdl');

  try {
    switch (command) {
      case 'build':
        console.log(chalk.blue('Building Lord of the Components...'));
        await build({
          configPath,
          outputDir: options.output,
          theme: options.theme,
          watch: options.watch,
          tokensOnly: options.tokens,
          verbose: options.verbose,
        });
        console.log(chalk.green('Build complete!'));
        break;

      case 'validate':
        console.log(chalk.blue('Validating component definitions...'));
        const valid = await validateProject(configPath, options.verbose);
        if (valid) {
          console.log(chalk.green('All definitions are valid!'));
        } else {
          console.log(chalk.red('Validation failed.'));
          process.exit(1);
        }
        break;

      case 'docs':
        console.log(chalk.blue('Generating documentation...'));
        await generateDocs({
          configPath,
          outputDir: options.output ? resolve(process.cwd(), options.output) : undefined,
          verbose: options.verbose,
        });
        console.log(chalk.green('Documentation generated!'));
        break;

      case 'registry':
        console.log(chalk.blue('Generating component registry...'));
        await generateRegistry({
          configPath,
          outputPath: options.output ? resolve(process.cwd(), options.output) : undefined,
          verbose: options.verbose,
        });
        break;

      case 'ide':
        console.log(chalk.blue('Generating IDE autocomplete...'));
        await generateIdeSupport({
          configPath,
          outputDir: options.output ? resolve(process.cwd(), options.output) : undefined,
          verbose: options.verbose,
        });
        break;

      case 'extract':
        if (!options.input) {
          console.error(chalk.red('Error: --input (-i) option is required for extract command'));
          process.exit(1);
        }
        console.log(chalk.blue('Extracting Jinja2 template to RigScript...'));
        await extractTemplate({
          input: options.input,
          output: options.output,
          includeComments: options.comments,
          verbose: options.verbose,
        });
        console.log(chalk.green('Extraction complete!'));
        break;

      case 'test:fixtures':
        console.log(chalk.blue('Generating visual test fixtures...'));
        await generateFixtures({
          configPath,
          outputDir: options.output ? resolve(process.cwd(), options.output) : undefined,
          cssPath: options.css,
          verbose: options.verbose,
        });
        break;

      default:
        console.error(chalk.red(`Unknown command: ${command}`));
        printHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
    if (options.verbose && error instanceof Error) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();
