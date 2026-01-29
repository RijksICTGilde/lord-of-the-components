/**
 * Lord of the Components - Visual Test Command
 *
 * CLI wrapper for running Playwright visual regression tests.
 */

import { spawn } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { existsSync } from 'node:fs';
import chalk from 'chalk';

interface TestVisualOptions {
  configPath: string;
  updateSnapshots?: boolean;
  component?: string;
  verbose?: boolean;
  ui?: boolean;
}

/**
 * Run Playwright visual tests
 */
export async function runVisualTests(options: TestVisualOptions): Promise<boolean> {
  const projectRoot = dirname(options.configPath);
  const visualTestDir = resolve(projectRoot, 'tests/visual');
  const playwrightConfig = resolve(visualTestDir, 'playwright.config.ts');

  // Check that Playwright config exists
  if (!existsSync(playwrightConfig)) {
    console.error(chalk.red('Playwright config not found at:'), playwrightConfig);
    console.error(chalk.gray('Run "npm install" and ensure @playwright/test is installed.'));
    return false;
  }

  // Build command arguments
  const args: string[] = ['playwright', 'test'];

  // Add config path
  args.push('--config', playwrightConfig);

  // Update snapshots if requested
  if (options.updateSnapshots) {
    args.push('--update-snapshots');
    console.log(chalk.yellow('Updating baseline snapshots...'));
  }

  // Filter by component if specified
  if (options.component) {
    args.push('--grep', options.component);
    console.log(chalk.gray(`Filtering tests for component: ${options.component}`));
  }

  // Open UI mode if requested
  if (options.ui) {
    args.push('--ui');
    console.log(chalk.gray('Opening Playwright UI...'));
  }

  if (options.verbose) {
    console.log(chalk.gray(`Running: npx ${args.join(' ')}`));
  }

  return new Promise((resolvePromise) => {
    const child = spawn('npx', args, {
      cwd: projectRoot,
      stdio: 'inherit',
      shell: true,
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(chalk.green('Visual tests passed!'));
        resolvePromise(true);
      } else {
        console.log(chalk.red(`Visual tests failed with exit code ${code}`));
        resolvePromise(false);
      }
    });

    child.on('error', (error) => {
      console.error(chalk.red('Failed to run Playwright:'), error.message);
      resolvePromise(false);
    });
  });
}
