/**
 * Definition-to-JSON Registry Exporter
 *
 * Reads component definitions and exports them to a JSON registry format
 * that the Python-side registry.py can load for component validation and
 * template resolution.
 *
 * Types are defined locally (structurally compatible with definitions/)
 * so this module compiles cleanly within core/src/ without cross-boundary
 * imports.
 *
 * Pipeline:
 *   ComponentDefinition[] → generateRegistry() → RegistryJSON
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES (structurally compatible with definitions/component.ts)
// ═══════════════════════════════════════════════════════════════════════════════

/** Prop definition from a component definition. */
export interface PropSpec {
  values?: readonly string[];
  default?: string | number | boolean;
  required?: boolean;
  description?: string;
}

/** Content definition from a component definition. */
export interface ContentDefinition {
  allowed: boolean;
  description?: string;
  allowedChildren?: string[];
}

/** Component definition (structural subset used by the exporter). */
export interface ComponentDefinition {
  name: string;
  description?: string;
  category?: string;
  props: Record<string, PropSpec | null>;
  events?: readonly string[];
  content?: ContentDefinition;
}

// ═══════════════════════════════════════════════════════════════════════════════
// REGISTRY JSON TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/** Attribute type in the registry JSON. */
export type RegistryAttributeType = "boolean" | "enum" | "string";

/** A single attribute in the registry JSON. */
export interface RegistryAttribute {
  name: string;
  type: RegistryAttributeType;
  default?: string | number | boolean;
  required?: boolean;
  description?: string;
  enum_values?: readonly string[];
}

/** A single component in the registry JSON. */
export interface RegistryComponent {
  name: string;
  description?: string;
  category?: string;
  attributes: RegistryAttribute[];
  events?: string[];
  content?: {
    allowed: boolean;
    description?: string;
    allowed_children?: string[];
  };
}

/** The top-level registry JSON structure. */
export interface RegistryJSON {
  components: RegistryComponent[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONVERSION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Convert a PropSpec to a registry attribute type.
 *
 * Mapping:
 *   - `null` → "boolean"
 *   - `{ values: [...] }` → "enum" with enum_values
 *   - `{ description }` or other → "string"
 */
function propSpecToAttribute(
  name: string,
  spec: PropSpec | null,
): RegistryAttribute {
  // Boolean prop (null spec)
  if (spec === null) {
    return {
      name,
      type: "boolean",
      default: false,
    };
  }

  // Enum prop (has values array)
  if (spec.values && spec.values.length > 0) {
    const attr: RegistryAttribute = {
      name,
      type: "enum",
      enum_values: spec.values,
    };
    if (spec.default !== undefined) attr.default = spec.default;
    if (spec.required) attr.required = true;
    if (spec.description) attr.description = spec.description;
    return attr;
  }

  // String prop (everything else)
  const attr: RegistryAttribute = {
    name,
    type: "string",
  };
  if (spec.default !== undefined) attr.default = spec.default;
  if (spec.required) attr.required = true;
  if (spec.description) attr.description = spec.description;
  return attr;
}

/**
 * Convert a ComponentDefinition to a RegistryComponent.
 */
function componentToRegistryEntry(
  component: ComponentDefinition,
): RegistryComponent {
  const attributes: RegistryAttribute[] = [];

  for (const [propName, propSpec] of Object.entries(component.props)) {
    attributes.push(propSpecToAttribute(propName, propSpec));
  }

  const entry: RegistryComponent = {
    name: component.name,
    attributes,
  };

  if (component.description) entry.description = component.description;
  if (component.category) entry.category = component.category;

  if (component.events && component.events.length > 0) {
    entry.events = [...component.events];
  }

  if (component.content) {
    entry.content = {
      allowed: component.content.allowed,
    };
    if (component.content.description) {
      entry.content.description = component.content.description;
    }
    if (component.content.allowedChildren) {
      entry.content.allowed_children = component.content.allowedChildren;
    }
  }

  return entry;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate a registry JSON object from an array of component definitions.
 *
 * @param components - Array of component definitions to export
 * @returns Registry JSON structure ready to be serialized
 *
 * @example
 * ```typescript
 * import { button } from '../../../../definitions/components/button.def.js';
 * import { generateRegistry } from './generate-registry.js';
 *
 * const registry = generateRegistry([button]);
 * const json = JSON.stringify(registry, null, 2);
 * ```
 */
export function generateRegistry(
  components: ComponentDefinition[],
): RegistryJSON {
  return {
    components: components.map(componentToRegistryEntry),
  };
}

/**
 * Generate a registry JSON string from an array of component definitions.
 *
 * @param components - Array of component definitions to export
 * @returns Formatted JSON string
 */
export function generateRegistryJSON(
  components: ComponentDefinition[],
): string {
  return JSON.stringify(generateRegistry(components), null, 2) + "\n";
}
