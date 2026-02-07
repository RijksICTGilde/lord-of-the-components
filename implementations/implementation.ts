/**
 * Implementation Definition System
 *
 * Provides `defineImplementation()` helper and types for mapping component
 * definitions to concrete HTML/CSS implementations.
 *
 * Each implementation specifies:
 *   - Which HTML element to render (static or dynamic)
 *   - How props map to CSS classes (static, conditional, pattern-based)
 *   - How props map to HTML attributes
 *   - What content/inner HTML to render
 *   - Which mixins to enable (utility classes, generic attributes)
 */

import type { ComponentDefinition } from "../definitions/component.js";

// ═══════════════════════════════════════════════════════════════════════════════
// CLASS RULES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * A static CSS class that is always applied.
 *
 * @example "utrecht-button"
 */
export type StaticClass = string;

/**
 * A CSS class conditionally applied based on a prop value.
 *
 * @example
 * // Boolean prop: add class when prop is truthy
 * { prop: "disabled", class: "utrecht-button--disabled" }
 *
 * // Enum prop: add class when prop equals specific value
 * { prop: "type", eq: "primary", class: "utrecht-button--primary-action" }
 *
 * // Enum prop: add class when prop equals any of several values
 * { prop: "type", eq: ["warning", "warning-subtle"], class: "utrecht-button--warning" }
 */
export interface ConditionalClass {
  /** The prop name to check */
  prop: string;
  /** Value(s) to match. If omitted, checks for truthiness (boolean prop). */
  eq?: string | string[];
  /** CSS class to add when condition is met */
  class: string;
}

/**
 * A CSS class generated from a pattern using the prop value.
 *
 * @example
 * // Pattern with specific allowed values
 * { prop: "size", pattern: "utrecht-button--rvo-{value}", when: ["xs", "sm", "md"] }
 *
 * // Pattern applied for any truthy value
 * { prop: "icon", pattern: "rvo-icon-{value}" }
 */
export interface PatternClass {
  /** The prop name whose value fills the pattern */
  prop: string;
  /** CSS class pattern. `{value}` is replaced with the prop value. */
  pattern: string;
  /** If specified, only generate classes for these values. Otherwise, any truthy value. */
  when?: string[];
}

/**
 * Union of all class rule types.
 * - string: static class, always applied
 * - ConditionalClass: class applied when prop matches condition
 * - PatternClass: class generated from a pattern
 */
export type ClassRule = StaticClass | ConditionalClass | PatternClass;

/**
 * Type guard: is this a ConditionalClass?
 */
export function isConditionalClass(rule: ClassRule): rule is ConditionalClass {
  return typeof rule === "object" && "class" in rule;
}

/**
 * Type guard: is this a PatternClass?
 */
export function isPatternClass(rule: ClassRule): rule is PatternClass {
  return typeof rule === "object" && "pattern" in rule;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ATTRIBUTE MAPPING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Maps a component prop to an HTML attribute.
 *
 * @example
 * // Boolean attribute (e.g., disabled)
 * { prop: "disabled", attr: "disabled", type: "boolean" }
 *
 * // Value attribute (e.g., type="submit")
 * { prop: "html-type", attr: "type", type: "value" }
 *
 * // Passthrough (prop name = attr name)
 * { prop: "aria-label", attr: "aria-label", type: "value" }
 */
export interface AttributeMapping {
  /** Component prop name */
  prop: string;
  /** HTML attribute name */
  attr: string;
  /** "boolean" renders as presence/absence, "value" renders with value */
  type: "boolean" | "value";
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONTENT BLOCKS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * A block of inner HTML content, optionally conditional.
 *
 * @example
 * // Unconditional content
 * { template: "{{ children if children else name | safe }}" }
 *
 * // Conditional content (show icon before label)
 * {
 *   template: '<span class="utrecht-button__icon"><span class="rvo-icon rvo-icon-{{ icon }} rvo-icon--md"></span></span>',
 *   when: { prop: "show-icon", eq: "before" }
 * }
 */
export interface ContentBlock {
  /** Jinja2 template string for this content block */
  template: string;
  /** Condition for rendering this block */
  when?: {
    /** Prop to check */
    prop: string;
    /** Value(s) to match. If omitted, checks truthiness. */
    eq?: string | string[];
    /** Check for truthiness of the prop */
    truthy?: boolean;
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// DYNAMIC ELEMENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Dynamic HTML element selection based on a prop value.
 *
 * @example
 * // Heading: element is determined by type prop (h1, h2, ...)
 * { prop: "type", default: "h1" }
 */
export interface DynamicElement {
  /** Prop that determines the HTML element tag */
  prop: string;
  /** Default element tag if prop is not set */
  default: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Full implementation mapping for a component.
 *
 * Maps a ComponentDefinition to concrete HTML/CSS output by specifying
 * the element, classes, attributes, and content.
 */
export interface ComponentImplementation {
  /** Reference to the component definition being implemented */
  component: ComponentDefinition;

  /**
   * HTML element to render.
   * - string: static element (e.g., "button", "div", "span")
   * - DynamicElement: element determined by a prop value
   */
  element: string | DynamicElement;

  /**
   * CSS class rules.
   * Evaluated in order to build the class list.
   */
  classes: ClassRule[];

  /**
   * Prop-to-attribute mappings.
   * Maps component props to HTML attributes.
   */
  attributes?: AttributeMapping[];

  /**
   * Inner HTML content.
   * - string: simple template string
   * - ContentBlock[]: ordered list of conditional/unconditional blocks
   */
  content?: string | ContentBlock[];

  /**
   * Mixins to enable.
   * - utilityClasses: adds support for text-style, margin, padding utility classes
   * - genericAttributes: adds support for data-*, aria-* passthrough
   */
  mixins?: {
    utilityClasses?: boolean;
    genericAttributes?: boolean;
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEFINE IMPLEMENTATION HELPER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Define a component implementation.
 *
 * Validates the implementation and returns a frozen object.
 *
 * @example
 * ```typescript
 * import { defineImplementation } from '../implementation.js';
 * import { button } from '../../definitions/components/button.def.js';
 *
 * export const buttonImpl = defineImplementation({
 *   component: button,
 *   element: "button",
 *   classes: [
 *     "utrecht-button",
 *     { prop: "type", eq: "primary", class: "utrecht-button--primary-action" },
 *     { prop: "size", pattern: "utrecht-button--rvo-{value}", when: ["xs", "sm", "md"] },
 *   ],
 *   attributes: [
 *     { prop: "disabled", attr: "disabled", type: "boolean" },
 *     { prop: "html-type", attr: "type", type: "value" },
 *   ],
 *   content: "{{ children if children else name | safe }}",
 *   mixins: { utilityClasses: true, genericAttributes: true },
 * });
 * ```
 */
export function defineImplementation<T extends ComponentImplementation>(
  implementation: T,
): Readonly<T> {
  // Validate required fields
  if (!implementation.component) {
    throw new Error("Implementation must reference a component definition");
  }

  if (!implementation.component.name) {
    throw new Error("Referenced component definition must have a name");
  }

  if (!implementation.element) {
    throw new Error(
      `Implementation for "${implementation.component.name}" must specify an element`,
    );
  }

  if (!implementation.classes || !Array.isArray(implementation.classes)) {
    throw new Error(
      `Implementation for "${implementation.component.name}" must specify classes array`,
    );
  }

  // Validate class rules
  for (const rule of implementation.classes) {
    if (typeof rule === "string") {
      continue; // Static class, always valid
    }
    if (isConditionalClass(rule)) {
      if (!rule.prop) {
        throw new Error(
          `ConditionalClass in "${implementation.component.name}" must specify a prop`,
        );
      }
      if (!rule.class) {
        throw new Error(
          `ConditionalClass for prop "${rule.prop}" in "${implementation.component.name}" must specify a class`,
        );
      }
    } else if (isPatternClass(rule)) {
      if (!rule.prop) {
        throw new Error(
          `PatternClass in "${implementation.component.name}" must specify a prop`,
        );
      }
      if (!rule.pattern) {
        throw new Error(
          `PatternClass for prop "${rule.prop}" in "${implementation.component.name}" must specify a pattern`,
        );
      }
      if (!rule.pattern.includes("{value}")) {
        throw new Error(
          `PatternClass pattern "${rule.pattern}" in "${implementation.component.name}" must contain {value} placeholder`,
        );
      }
    }
  }

  // Validate attribute mappings
  if (implementation.attributes) {
    for (const attr of implementation.attributes) {
      if (!attr.prop) {
        throw new Error(
          `AttributeMapping in "${implementation.component.name}" must specify a prop`,
        );
      }
      if (!attr.attr) {
        throw new Error(
          `AttributeMapping for prop "${attr.prop}" in "${implementation.component.name}" must specify an attr`,
        );
      }
      if (attr.type !== "boolean" && attr.type !== "value") {
        throw new Error(
          `AttributeMapping for prop "${attr.prop}" in "${implementation.component.name}" must have type "boolean" or "value"`,
        );
      }
    }
  }

  return Object.freeze(implementation);
}
