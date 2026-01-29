/**
 * Lord of the Components - Registry Generator
 *
 * Generates a JSON registry file from component definitions for use
 * by the Python integration and other consumers.
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import type { ComponentDefinition } from '../../types/components.js';

// =============================================================================
// TYPES
// =============================================================================

export interface RegistryGeneratorOptions {
  outputPath: string;
  includeExamples?: boolean;
  includeTokens?: boolean;
}

interface RegistryOutput {
  version: string;
  generatedAt: string;
  components: Record<string, RegistryComponent>;
}

interface RegistryComponent {
  name: string;
  description: string;
  category: string;
  status: string;
  props: RegistryProp[];
  slots: RegistrySlot[];
  dependsOn?: string[];
  tokens?: Record<string, string>;
  examples?: RegistryExample[];
}

interface RegistryProp {
  name: string;
  type: string;
  required: boolean;
  default?: unknown;
  description?: string;
  enumValues?: string[];
}

interface RegistrySlot {
  name: string;
  required: boolean;
  description?: string;
}

interface RegistryExample {
  name: string;
  title: string;
  description?: string;
  code: string;
}

// =============================================================================
// GENERATOR
// =============================================================================

export class RegistryGenerator {
  private options: RegistryGeneratorOptions;

  constructor(options: RegistryGeneratorOptions) {
    this.options = {
      includeExamples: true,
      includeTokens: true,
      ...options,
    };
  }

  /**
   * Generate the registry JSON file
   */
  async generate(components: ComponentDefinition[]): Promise<string> {
    const registry: RegistryOutput = {
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      components: {},
    };

    for (const component of components) {
      registry.components[component.name] = this.transformComponent(component);
    }

    // Ensure output directory exists
    await mkdir(dirname(this.options.outputPath), { recursive: true });

    // Write registry file
    const json = JSON.stringify(registry, null, 2);
    await writeFile(this.options.outputPath, json);

    return this.options.outputPath;
  }

  /**
   * Transform component definition to registry format
   */
  private transformComponent(component: ComponentDefinition): RegistryComponent {
    const result: RegistryComponent = {
      name: component.name,
      description: component.description,
      category: component.category,
      status: component.status,
      props: component.props.map(prop => ({
        name: prop.name,
        type: prop.type,
        required: prop.required,
        default: prop.default,
        description: prop.description,
        enumValues: prop.enumValues,
      })),
      slots: component.slots.map(slot => ({
        name: slot.name,
        required: slot.required,
        description: slot.description,
      })),
    };

    if (component.dependsOn && component.dependsOn.length > 0) {
      result.dependsOn = component.dependsOn;
    }

    if (this.options.includeTokens && Object.keys(component.tokens).length > 0) {
      result.tokens = component.tokens;
    }

    if (this.options.includeExamples && component.examples.length > 0) {
      result.examples = component.examples.map(example => ({
        name: example.name,
        title: example.title,
        description: example.description,
        code: example.code,
      }));
    }

    return result;
  }
}

/**
 * Generate registry from component definitions
 */
export async function generateRegistry(
  components: ComponentDefinition[],
  options: RegistryGeneratorOptions
): Promise<string> {
  const generator = new RegistryGenerator(options);
  return generator.generate(components);
}
