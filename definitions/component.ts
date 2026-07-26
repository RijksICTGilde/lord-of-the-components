/**
 * Component Definition System
 *
 * Provides the `defineComponent()` helper and types for defining semantic components.
 * Each component specifies:
 *   - Which props it accepts (and their allowed values)
 *   - Which events it supports (@ bindings)
 *   - Which data bindings it accepts (: bindings)
 *   - Whether it accepts content between tags
 *   - Child components (inline definitions)
 */

import type { PropName } from "./props.js";
import type { EventName } from "./events.js";
import type { BindingType } from "./bindings.js";

// ═══════════════════════════════════════════════════════════════════════════════
// PROP DEFINITION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Definition for a single prop
 */
export interface PropDefinition {
  /**
   * Allowed values for this prop.
   * If omitted, prop accepts any string value.
   */
  values?: readonly string[];

  /**
   * Default value if prop is not provided.
   */
  default?: string | number | boolean;

  /**
   * Whether the prop is required.
   */
  required?: boolean;

  /**
   * Human-readable description for documentation/errors.
   */
  description?: string;
}

/**
 * Props can be defined as:
 * - PropDefinition object (with values, default, required, description)
 * - null (for boolean props where presence = true)
 */
export type PropSpec = PropDefinition | null;

// ═══════════════════════════════════════════════════════════════════════════════
// CONTENT DEFINITION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Configuration for content (between opening and closing tags)
 */
export interface ContentDefinition {
  /**
   * Whether the component accepts content between tags.
   */
  allowed: boolean;

  /**
   * Human-readable description of what content is expected.
   */
  description?: string;

  /**
   * If specified, only these child component names are allowed.
   * Example: ["menu-item"] means only <c-menu-item> is valid inside.
   */
  allowedChildren?: string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHILD COMPONENT DEFINITION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Definition for a child component.
 * Child components:
 *   - Are defined inline within their parent
 *   - Can ONLY be used inside their parent component
 *   - Cannot have their own children (no deep nesting)
 */
export interface ChildComponentDefinition {
  /**
   * Component name (without c- prefix).
   * Will be used as <c-{name}> inside the parent.
   */
  name: string;

  /**
   * Human-readable description.
   */
  description?: string;

  /**
   * Props this child component accepts.
   */
  props: Record<string, PropSpec>;

  /**
   * Events this child component supports.
   */
  events?: readonly EventName[];

  /**
   * Whether the child accepts content.
   */
  content?: ContentDefinition;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT DEFINITION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Full component definition
 */
export interface ComponentDefinition {
  /**
   * Component name (without c- prefix).
   * Will be used as <c-{name}> in templates.
   */
  name: string;

  /**
   * Human-readable description.
   */
  description?: string;

  /**
   * Category for organization (e.g., "actions", "layout", "feedback").
   */
  category?: string;

  /**
   * Props this component accepts.
   * Keys are prop names, values define constraints.
   *
   * Example:
   *   props: {
   *     [PROPS.TYPE]: { values: VALUES.BUTTON_TYPES, default: "primary" },
   *     [PROPS.NAME]: { required: true },
   *     [PROPS.DISABLED]: null,  // boolean prop
   *   }
   */
  props: Record<string, PropSpec>;

  /**
   * Events this component supports (@ bindings).
   *
   * Example:
   *   events: [EVENTS.CLICK, EVENTS.FOCUS, EVENTS.BLUR]
   *   // Allows @click, @focus, @blur on this component
   */
  events?: readonly EventName[];

  /**
   * Data bindings this component accepts (: bindings).
   * Keys are prop names, values are binding type strings.
   *
   * Example:
   *   bindings: {
   *     items: BINDINGS.MENU_ITEMS,  // :items expects MenuItem[]
   *   }
   */
  bindings?: Record<string, BindingType>;

  /**
   * Content configuration (for content between tags).
   */
  content?: ContentDefinition;

  /**
   * Child components that can ONLY be used inside this component.
   * Keys are the child component names (without c- prefix).
   *
   * Example:
   *   children: {
   *     "menu-item": {
   *       name: "menu-item",
   *       props: { name: { required: true }, href: {} },
   *       events: [EVENTS.CLICK],
   *     }
   *   }
   *   // Allows <c-menu-item> ONLY inside <c-menu>
   */
  children?: Record<string, ChildComponentDefinition>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEFINE COMPONENT HELPER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Define a semantic component.
 *
 * This helper:
 *   1. Validates the definition structure
 *   2. Provides TypeScript type inference
 *   3. Returns a frozen definition object
 *
 * @example
 * ```typescript
 * import { defineComponent } from '../component.js';
 * import { PROPS } from '../props.js';
 * import { VALUES } from '../values.js';
 * import { EVENTS } from '../events.js';
 *
 * export const button = defineComponent({
 *   name: "button",
 *   description: "Interactive button for user actions",
 *
 *   props: {
 *     [PROPS.TYPE]: {
 *       values: VALUES.BUTTON_TYPES,
 *       default: "primary",
 *     },
 *     [PROPS.NAME]: { required: true },
 *     [PROPS.DISABLED]: null,  // boolean prop
 *   },
 *
 *   events: [EVENTS.CLICK, EVENTS.FOCUS, EVENTS.BLUR],
 *
 *   content: {
 *     allowed: true,
 *     description: "Button label (overrides name prop)",
 *   },
 * });
 * ```
 */
export function defineComponent<T extends ComponentDefinition>(
  definition: T
): Readonly<T> {
  // Validate required fields
  if (!definition.name) {
    throw new Error("Component definition must have a name");
  }

  if (!definition.props || typeof definition.props !== "object") {
    throw new Error(`Component "${definition.name}" must define props`);
  }

  // Validate children definitions
  if (definition.children) {
    for (const [childName, childDef] of Object.entries(definition.children)) {
      if (!childDef.name) {
        throw new Error(
          `Child component "${childName}" in "${definition.name}" must have a name`
        );
      }
      if (childDef.name !== childName) {
        throw new Error(
          `Child component key "${childName}" must match name "${childDef.name}" in "${definition.name}"`
        );
      }
    }
  }

  // Return frozen definition
  return Object.freeze(definition);
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Extract prop names from a component definition
 */
export type ComponentProps<T extends ComponentDefinition> = keyof T["props"];

/**
 * Extract event names from a component definition
 */
export type ComponentEvents<T extends ComponentDefinition> =
  T["events"] extends readonly (infer E)[] ? E : never;

/**
 * Extract binding names from a component definition
 */
export type ComponentBindings<T extends ComponentDefinition> =
  T["bindings"] extends Record<string, unknown> ? keyof T["bindings"] : never;

/**
 * Check if a component has a specific prop
 */
export function hasComponentProp(
  component: ComponentDefinition,
  propName: string
): boolean {
  return propName in component.props;
}

/**
 * Check if a component supports a specific event
 */
export function hasComponentEvent(
  component: ComponentDefinition,
  eventName: EventName
): boolean {
  return component.events?.includes(eventName) ?? false;
}

/**
 * Get allowed values for a prop (if constrained)
 */
export function getPropValues(
  component: ComponentDefinition,
  propName: string
): readonly string[] | undefined {
  const prop = component.props[propName];
  if (prop && typeof prop === "object" && prop.values) {
    return prop.values;
  }
  return undefined;
}

/**
 * Check if a prop is a boolean prop (null definition)
 */
export function isBooleanProp(
  component: ComponentDefinition,
  propName: string
): boolean {
  return component.props[propName] === null;
}

/**
 * Get the full component tag name (with c- prefix)
 */
export function getComponentTagName(component: ComponentDefinition): string {
  return `c-${component.name}`;
}
