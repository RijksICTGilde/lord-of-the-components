/**
 * Lord of the Components - VS Code Custom Data Generator
 *
 * Generates VS Code custom data JSON for HTML autocomplete support.
 * https://code.visualstudio.com/api/extension-guides/custom-data-extension
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { ComponentDefinition, PropDefinition } from '../../types/components.js';

// =============================================================================
// TYPES
// =============================================================================

interface VSCodeCustomData {
  version: 1.1;
  tags: VSCodeTag[];
  globalAttributes?: VSCodeAttribute[];
}

interface VSCodeTag {
  name: string;
  description: {
    kind: 'markdown';
    value: string;
  };
  attributes: VSCodeAttribute[];
  references?: VSCodeReference[];
}

interface VSCodeAttribute {
  name: string;
  description?: {
    kind: 'markdown';
    value: string;
  };
  values?: VSCodeAttributeValue[];
}

interface VSCodeAttributeValue {
  name: string;
  description?: string;
}

interface VSCodeReference {
  name: string;
  url: string;
}

export interface VSCodeCustomDataOptions {
  outputPath: string;
  docBaseUrl?: string;
}

// =============================================================================
// GENERATOR
// =============================================================================

export class VSCodeCustomDataGenerator {
  private options: VSCodeCustomDataOptions;

  constructor(options: VSCodeCustomDataOptions) {
    this.options = options;
  }

  /**
   * Generate VS Code custom data JSON
   */
  async generate(components: ComponentDefinition[]): Promise<string> {
    const customData: VSCodeCustomData = {
      version: 1.1,
      tags: components.map(c => this.generateTag(c)),
      globalAttributes: this.generateGlobalAttributes(),
    };

    // Ensure output directory exists
    await mkdir(dirname(this.options.outputPath), { recursive: true });

    // Write file
    await writeFile(
      this.options.outputPath,
      JSON.stringify(customData, null, 2)
    );

    return this.options.outputPath;
  }

  private generateTag(component: ComponentDefinition): VSCodeTag {
    const tag: VSCodeTag = {
      name: `c-${component.name}`,
      description: {
        kind: 'markdown',
        value: this.generateDescription(component),
      },
      attributes: component.props.map(p => this.generateAttribute(p)),
    };

    if (this.options.docBaseUrl) {
      tag.references = [{
        name: 'Documentation',
        url: `${this.options.docBaseUrl}/components/${component.name}.html`,
      }];
    }

    return tag;
  }

  private generateDescription(component: ComponentDefinition): string {
    const lines: string[] = [
      component.description,
      '',
      `**Category:** ${component.category}`,
      `**Status:** ${component.status}`,
    ];

    if (component.slots.length > 0) {
      lines.push('', '**Slots:**');
      for (const slot of component.slots) {
        const required = slot.required ? ' (required)' : '';
        lines.push(`- \`${slot.name}\`${required}: ${slot.description || ''}`);
      }
    }

    if (component.dependsOn && component.dependsOn.length > 0) {
      lines.push('', `**Depends on:** ${component.dependsOn.map(d => `\`c-${d}\``).join(', ')}`);
    }

    return lines.join('\n');
  }

  private generateAttribute(prop: PropDefinition): VSCodeAttribute {
    const attr: VSCodeAttribute = {
      name: prop.name,
    };

    const descLines: string[] = [];
    if (prop.description) {
      descLines.push(prop.description);
    }

    descLines.push('', `**Type:** \`${prop.type}\``);

    if (prop.required) {
      descLines.push('**Required**');
    }

    if (prop.default !== undefined) {
      descLines.push(`**Default:** \`${prop.default}\``);
    }

    attr.description = {
      kind: 'markdown',
      value: descLines.join('\n'),
    };

    // Add value options for enums
    const values = this.getAttributeValues(prop);
    if (values.length > 0) {
      attr.values = values;
    }

    return attr;
  }

  private getAttributeValues(prop: PropDefinition): VSCodeAttributeValue[] {
    switch (prop.type) {
      case 'boolean':
        return [
          { name: 'true', description: 'Enable' },
          { name: 'false', description: 'Disable' },
        ];

      case 'enum':
        return (prop.enumValues || []).map(v => ({ name: v }));

      case 'generic-size':
        return [
          { name: 'xs', description: 'Extra small' },
          { name: 'sm', description: 'Small' },
          { name: 'md', description: 'Medium (default)' },
          { name: 'lg', description: 'Large' },
          { name: 'xl', description: 'Extra large' },
        ];

      case 'generic-color':
        return [
          { name: 'primary', description: 'Primary brand color' },
          { name: 'secondary', description: 'Secondary color' },
          { name: 'success', description: 'Success/positive color' },
          { name: 'warning', description: 'Warning/caution color' },
          { name: 'error', description: 'Error/danger color' },
          { name: 'info', description: 'Informational color' },
        ];

      default:
        return [];
    }
  }

  private generateGlobalAttributes(): VSCodeAttribute[] {
    return [
      {
        name: 'class',
        description: {
          kind: 'markdown',
          value: 'CSS class names to apply to the component',
        },
      },
      {
        name: 'id',
        description: {
          kind: 'markdown',
          value: 'Unique identifier for the element',
        },
      },
      {
        name: 'style',
        description: {
          kind: 'markdown',
          value: 'Inline CSS styles',
        },
      },
    ];
  }
}

/**
 * Generate VS Code custom data JSON
 */
export async function generateVSCodeCustomData(
  components: ComponentDefinition[],
  options: VSCodeCustomDataOptions
): Promise<string> {
  const generator = new VSCodeCustomDataGenerator(options);
  return generator.generate(components);
}
