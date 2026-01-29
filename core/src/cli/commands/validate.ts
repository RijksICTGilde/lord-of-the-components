/**
 * Lord of the Components - Validate Command
 *
 * Validates all component, token, and theme definitions.
 */

import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import chalk from 'chalk';
import { parseKdl } from '../../parser/kdl-parser.js';
import { TokenLoader } from '../../loader/token-loader.js';
import { ComponentLoader } from '../../loader/component-loader.js';
import { ThemeLoader } from '../../loader/theme-loader.js';
import { TokenResolver } from '../../resolver/token-resolver.js';

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

interface ValidationContext {
  projectRoot: string;
  verbose: boolean;
}

/**
 * Validate the entire project
 */
export async function validateProject(
  configPath: string,
  verbose: boolean = false
): Promise<boolean> {
  const projectRoot = dirname(configPath);
  const context: ValidationContext = { projectRoot, verbose };

  const results: ValidationResult[] = [];

  // Load and validate config
  console.log(chalk.gray('Validating configuration...'));
  const configResult = await validateConfig(configPath, context);
  results.push(configResult);

  if (!configResult.valid) {
    printResult('Configuration', configResult);
    return false;
  }

  // Parse config to get paths
  const configContent = await readFile(configPath, 'utf-8');
  const config = parseKdl(configContent);

  // Validate tokens
  console.log(chalk.gray('Validating tokens...'));
  const tokensResult = await validateTokens(context);
  results.push(tokensResult);
  printResult('Tokens', tokensResult);

  // Validate components
  console.log(chalk.gray('Validating components...'));
  const componentsResult = await validateComponents(context);
  results.push(componentsResult);
  printResult('Components', componentsResult);

  // Validate themes
  console.log(chalk.gray('Validating themes...'));
  const themesResult = await validateThemes(context);
  results.push(themesResult);
  printResult('Themes', themesResult);

  // Check for cross-reference issues
  console.log(chalk.gray('Checking cross-references...'));
  const crossRefResult = await validateCrossReferences(context);
  results.push(crossRefResult);
  printResult('Cross-references', crossRefResult);

  // Summary
  const allValid = results.every((r) => r.valid);
  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
  const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);

  console.log('');
  if (allValid) {
    console.log(
      chalk.green(`Validation passed with ${totalWarnings} warning(s)`)
    );
  } else {
    console.log(
      chalk.red(`Validation failed with ${totalErrors} error(s) and ${totalWarnings} warning(s)`)
    );
  }

  return allValid;
}

function printResult(name: string, result: ValidationResult): void {
  if (result.valid && result.warnings.length === 0) {
    console.log(chalk.green(`  ✓ ${name}`));
  } else if (result.valid) {
    console.log(chalk.yellow(`  ⚠ ${name}`));
    result.warnings.forEach((w) => console.log(chalk.yellow(`    - ${w}`)));
  } else {
    console.log(chalk.red(`  ✗ ${name}`));
    result.errors.forEach((e) => console.log(chalk.red(`    - ${e}`)));
    result.warnings.forEach((w) => console.log(chalk.yellow(`    - ${w}`)));
  }
}

async function validateConfig(
  configPath: string,
  context: ValidationContext
): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const content = await readFile(configPath, 'utf-8');
    const config = parseKdl(content);

    // Check required sections using getNode
    if (!config.getNode('config')) {
      errors.push('Missing "config" section');
    }
    if (!config.getNode('tokens')) {
      errors.push('Missing "tokens" section');
    }
    if (!config.getNode('themes')) {
      errors.push('Missing "themes" section');
    }
    if (!config.getNode('packages')) {
      warnings.push('No "packages" section - no components will be built');
    }
  } catch (error) {
    errors.push(`Failed to parse config: ${error instanceof Error ? error.message : error}`);
  }

  return { valid: errors.length === 0, errors, warnings };
}

async function validateTokens(context: ValidationContext): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const loader = new TokenLoader(context.projectRoot);
    await loader.loadAll();

    // Check that primitives exist
    const primitives = loader.getPrimitives();
    if (Object.keys(primitives).length === 0) {
      errors.push('No primitive tokens found');
    }

    // Check that semantic schema exists
    const schema = loader.getSemanticSchema();
    if (Object.keys(schema).length === 0) {
      warnings.push('No semantic schema found');
    }
  } catch (error) {
    errors.push(`Token loading failed: ${error instanceof Error ? error.message : error}`);
  }

  return { valid: errors.length === 0, errors, warnings };
}

async function validateComponents(context: ValidationContext): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const loader = new ComponentLoader(context.projectRoot);
    const components = await loader.loadAll();

    if (components.length === 0) {
      warnings.push('No components found');
    }

    // Validate each component
    for (const component of components) {
      // Check required fields
      if (!component.description) {
        warnings.push(`Component "${component.name}" has no description`);
      }

      // Check for examples
      if (component.examples.length === 0) {
        warnings.push(`Component "${component.name}" has no examples`);
      }

      // Check prop defaults match types
      for (const prop of component.props) {
        if (prop.type === 'enum' && (!prop.enumValues || prop.enumValues.length === 0)) {
          errors.push(
            `Component "${component.name}" prop "${prop.name}" is enum type but has no enum values`
          );
        }
      }
    }
  } catch (error) {
    errors.push(`Component loading failed: ${error instanceof Error ? error.message : error}`);
  }

  return { valid: errors.length === 0, errors, warnings };
}

async function validateThemes(context: ValidationContext): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const loader = new ThemeLoader(context.projectRoot);
    const themes = await loader.loadAll();

    if (themes.length === 0) {
      warnings.push('No themes found');
    }

    for (const theme of themes) {
      // Check for connectors
      if (theme.connectors.length === 0) {
        warnings.push(`Theme "${theme.name}" has no connectors`);
      }
    }
  } catch (error) {
    errors.push(`Theme loading failed: ${error instanceof Error ? error.message : error}`);
  }

  return { valid: errors.length === 0, errors, warnings };
}

async function validateCrossReferences(
  context: ValidationContext
): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const tokenLoader = new TokenLoader(context.projectRoot);
    await tokenLoader.loadAll();

    const themeLoader = new ThemeLoader(context.projectRoot);
    const themes = await themeLoader.loadAll();

    // Check that theme token references are valid
    const resolver = new TokenResolver(tokenLoader.getPrimitives());

    for (const theme of themes) {
      for (const [category, tokens] of Object.entries(theme.tokens)) {
        for (const [name, reference] of Object.entries(tokens)) {
          try {
            resolver.resolve(reference);
          } catch {
            errors.push(
              `Theme "${theme.name}" has invalid token reference: ${category}.${name} -> ${reference}`
            );
          }
        }
      }
    }
  } catch (error) {
    errors.push(
      `Cross-reference validation failed: ${error instanceof Error ? error.message : error}`
    );
  }

  return { valid: errors.length === 0, errors, warnings };
}
