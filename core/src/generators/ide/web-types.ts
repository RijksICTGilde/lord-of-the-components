/**
 * Lord of the Components - Web Types Generator
 *
 * Generates web-types.json for IntelliJ/WebStorm autocomplete support.
 * https://github.com/AlisonGao/web-types
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { ComponentDefinition, PropDefinition } from '../../types/components.js';

// =============================================================================
// TYPES
// =============================================================================

interface WebTypes {
  $schema: string;
  framework: string;
  name: string;
  version: string;
  'js-types-syntax': string;
  contributions: {
    html: {
      elements: WebTypesElement[];
    };
  };
}

interface WebTypesElement {
  name: string;
  description: string;
  'doc-url'?: string;
  attributes: WebTypesAttribute[];
  slots?: WebTypesSlot[];
}

interface WebTypesAttribute {
  name: string;
  description?: string;
  required?: boolean;
  default?: string;
  value?: {
    type: string;
    required?: boolean;
  };
}

interface WebTypesSlot {
  name: string;
  description?: string;
}

export interface WebTypesOptions {
  outputPath: string;
  name?: string;
  version?: string;
  docBaseUrl?: string;
}

// =============================================================================
// GENERATOR
// =============================================================================

export class WebTypesGenerator {
  private options: WebTypesOptions;

  constructor(options: WebTypesOptions) {
    this.options = {
      name: 'lord-of-the-components',
      version: '0.1.0',
      ...options,
    };
  }

  /**
   * Generate web-types.json
   */
  async generate(components: ComponentDefinition[]): Promise<string> {
    const webTypes: WebTypes = {
      $schema: 'https://raw.githubusercontent.com/AlisonGao/web-types/master/schema/web-types.json',
      framework: 'html',
      name: this.options.name!,
      version: this.options.version!,
      'js-types-syntax': 'typescript',
      contributions: {
        html: {
          elements: components.map(c => this.generateElement(c)),
        },
      },
    };

    // Ensure output directory exists
    await mkdir(dirname(this.options.outputPath), { recursive: true });

    // Write file
    await writeFile(
      this.options.outputPath,
      JSON.stringify(webTypes, null, 2)
    );

    return this.options.outputPath;
  }

  private generateElement(component: ComponentDefinition): WebTypesElement {
    const element: WebTypesElement = {
      name: `c-${component.name}`,
      description: component.description,
      attributes: component.props.map(p => this.generateAttribute(p)),
    };

    if (this.options.docBaseUrl) {
      element['doc-url'] = `${this.options.docBaseUrl}/components/${component.name}.html`;
    }

    if (component.slots.length > 0) {
      element.slots = component.slots.map(s => ({
        name: s.name,
        description: s.description,
      }));
    }

    return element;
  }

  private generateAttribute(prop: PropDefinition): WebTypesAttribute {
    const attr: WebTypesAttribute = {
      name: prop.name,
      description: prop.description,
      required: prop.required,
    };

    if (prop.default !== undefined) {
      attr.default = String(prop.default);
    }

    attr.value = {
      type: this.mapType(prop),
      required: prop.required,
    };

    return attr;
  }

  private mapType(prop: PropDefinition): string {
    switch (prop.type) {
      case 'boolean':
        return 'boolean';
      case 'number':
        return 'number';
      case 'enum':
        return prop.enumValues?.map(v => `"${v}"`).join(' | ') || 'string';
      case 'generic-size':
        return '"xs" | "sm" | "md" | "lg" | "xl"';
      case 'generic-color':
        return '"primary" | "secondary" | "success" | "warning" | "error" | "info"';
      case 'array':
        return 'array';
      case 'object':
        return 'object';
      default:
        return 'string';
    }
  }
}

/**
 * Generate web-types.json
 */
export async function generateWebTypes(
  components: ComponentDefinition[],
  options: WebTypesOptions
): Promise<string> {
  const generator = new WebTypesGenerator(options);
  return generator.generate(components);
}
