/**
 * Lord of the Components - Fixture Generator
 *
 * Generates standalone HTML fixture files from component examples
 * for use in visual regression testing with Playwright.
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import type { ComponentDefinition, ComponentExample } from '../../types/components.js';

// =============================================================================
// TYPES
// =============================================================================

export interface FixtureGeneratorOptions {
  outputDir: string;
  cssPath?: string;
  includeAllVariants?: boolean;
}

interface FixtureFile {
  componentName: string;
  exampleName: string;
  filePath: string;
  html: string;
}

// =============================================================================
// GENERATOR
// =============================================================================

export class FixtureGenerator {
  private options: FixtureGeneratorOptions;

  constructor(options: FixtureGeneratorOptions) {
    this.options = {
      includeAllVariants: true,
      ...options,
    };
  }

  /**
   * Generate fixture files for all components
   */
  async generate(components: ComponentDefinition[]): Promise<string[]> {
    const fixtures: FixtureFile[] = [];

    for (const component of components) {
      const componentFixtures = this.generateComponentFixtures(component);
      fixtures.push(...componentFixtures);
    }

    // Ensure output directory exists
    await mkdir(this.options.outputDir, { recursive: true });

    // Write all fixture files
    const writtenFiles: string[] = [];
    for (const fixture of fixtures) {
      const filePath = join(this.options.outputDir, fixture.filePath);
      await mkdir(dirname(filePath), { recursive: true });
      await writeFile(filePath, fixture.html);
      writtenFiles.push(filePath);
    }

    return writtenFiles;
  }

  /**
   * Generate fixtures for a single component
   */
  private generateComponentFixtures(component: ComponentDefinition): FixtureFile[] {
    const fixtures: FixtureFile[] = [];

    for (const example of component.examples) {
      const fixture = this.createFixture(component, example);
      fixtures.push(fixture);
    }

    return fixtures;
  }

  /**
   * Create a single fixture file
   */
  private createFixture(
    component: ComponentDefinition,
    example: ComponentExample
  ): FixtureFile {
    const fileName = `${component.name}-${example.name}.html`;
    const filePath = join(component.category, fileName);

    const html = this.generateHtml(component, example);

    return {
      componentName: component.name,
      exampleName: example.name,
      filePath,
      html,
    };
  }

  /**
   * Generate standalone HTML for a fixture
   */
  private generateHtml(
    component: ComponentDefinition,
    example: ComponentExample
  ): string {
    const cssLink = this.options.cssPath
      ? `<link rel="stylesheet" href="${this.options.cssPath}">`
      : '';

    // Clean up the example code (remove leading/trailing whitespace)
    const exampleCode = example.code.trim();

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${component.name} - ${example.title}</title>
    ${cssLink}
    <style>
        body {
            font-family: system-ui, -apple-system, sans-serif;
            padding: 1rem;
            margin: 0;
        }
        .fixture-container {
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
            align-items: flex-start;
        }
    </style>
</head>
<body>
    <div class="fixture-container" data-component="${component.name}" data-example="${example.name}">
${this.indentCode(exampleCode, 8)}
    </div>
</body>
</html>`;
  }

  /**
   * Indent code by a specified number of spaces
   */
  private indentCode(code: string, spaces: number): string {
    const indent = ' '.repeat(spaces);
    return code
      .split('\n')
      .map(line => (line.trim() ? indent + line : line))
      .join('\n');
  }
}

/**
 * Generate fixtures from component definitions
 */
export async function generateFixtures(
  components: ComponentDefinition[],
  options: FixtureGeneratorOptions
): Promise<string[]> {
  const generator = new FixtureGenerator(options);
  return generator.generate(components);
}
