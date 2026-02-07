/**
 * Implementation Definition System — Element Tree API (v2)
 *
 * Provides `defineImplementation()` helper and types for mapping component
 * definitions to concrete HTML/CSS implementations using a recursive
 * ElementNode tree.
 *
 * Key improvement over v1: nested element trees replace the flat
 * element/classes/content structure. This eliminates hand-tuning for
 * complex components (alert, card, header, hero, footer, menu, grid).
 *
 * Each implementation specifies:
 *   - A root ElementNode tree (recursive)
 *   - How props map to CSS classes (static, conditional, pattern-based)
 *   - How props map to HTML attributes
 *   - Conditions for rendering elements and branches
 *   - Value maps for translating prop values (e.g., type → icon name)
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
 *
 * // Pattern with value map translation
 * { prop: "type", pattern: "rvo-icon-{value}", valueMap: "status-icon" }
 */
export interface PatternClass {
  /** The prop name whose value fills the pattern */
  prop: string;
  /** CSS class pattern. `{value}` is replaced with the prop value. */
  pattern: string;
  /** If specified, only generate classes for these values. Otherwise, any truthy value. */
  when?: string[];
  /** Name of a value map to translate the prop value before substitution. */
  valueMap?: string;
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
 * Maps a component prop to an HTML attribute, or emits a static attribute.
 *
 * @example
 * // Boolean attribute (e.g., disabled)
 * { prop: "disabled", attr: "disabled", type: "boolean" }
 *
 * // Value attribute (e.g., type="submit")
 * { prop: "html-type", attr: "type", type: "value" }
 *
 * // Conditional value attribute (only rendered when prop is truthy)
 * { prop: "href", attr: "href", type: "value", conditional: true }
 *
 * // Static attribute (always present with fixed value)
 * { attr: "role", type: "static", value: "img" }
 */
export interface AttributeMapping {
  /** Component prop name (not used when type is "static") */
  prop?: string;
  /** HTML attribute name */
  attr: string;
  /** "boolean" renders as presence/absence, "value" renders with value, "static" always emits a fixed value */
  type: "boolean" | "value" | "static";
  /** Fixed value for static attributes */
  value?: string;
  /** When true for "value" type, only render the attribute when the prop is truthy */
  conditional?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// INLINE STYLE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * An inline CSS style property derived from a prop value.
 *
 * @example
 * // Grid division: style="--division: {value}"
 * { property: "--division", prop: "division" }
 */
export interface StyleMapping {
  /** CSS property name (including custom properties like --division) */
  property: string;
  /** Prop whose value provides the CSS value */
  prop: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONDITIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * A condition for conditional rendering of elements.
 *
 * @example
 * // Prop is truthy
 * { prop: "image" }
 *
 * // Prop equals specific value
 * { prop: "type", eq: "primary" }
 *
 * // Prop equals one of several values
 * { prop: "show-icon", eq: ["before", "after"] }
 *
 * // Negated: prop is NOT truthy
 * { not: { prop: "row" } }
 *
 * // Compound: multiple conditions (AND)
 * { and: [{ prop: "show-link-indicator" }, { prop: "href" }, { prop: "full-card-link" }] }
 *
 * // Compound: any condition (OR)
 * { or: [{ prop: "title" }, { prop: "subtitle" }, { prop: "children" }] }
 */
export type Condition =
  | PropCondition
  | NotCondition
  | AndCondition
  | OrCondition;

/** Check a single prop for truthiness or equality */
export interface PropCondition {
  /** Prop to check */
  prop: string;
  /** Value(s) to match. If omitted, checks truthiness. */
  eq?: string | string[];
}

/** Negate a condition */
export interface NotCondition {
  not: Condition;
}

/** All conditions must be true (AND) */
export interface AndCondition {
  and: Condition[];
}

/** Any condition must be true (OR) */
export interface OrCondition {
  or: Condition[];
}

/** Type guard: is this a PropCondition? */
export function isPropCondition(c: Condition): c is PropCondition {
  return "prop" in c;
}

/** Type guard: is this a NotCondition? */
export function isNotCondition(c: Condition): c is NotCondition {
  return "not" in c;
}

/** Type guard: is this an AndCondition? */
export function isAndCondition(c: Condition): c is AndCondition {
  return "and" in c;
}

/** Type guard: is this an OrCondition? */
export function isOrCondition(c: Condition): c is OrCondition {
  return "or" in c;
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
// ELEMENT NODE — THE TREE API
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * A node in the element tree. This is the core of the v2 API.
 *
 * Each node represents an HTML element with optional classes, attributes,
 * styles, conditions, and children. The tree is recursive — children can
 * themselves have children, enabling any level of nesting.
 *
 * @example
 * // Simple leaf element
 * { element: "span", classes: ["rvo-icon"], text: "{{ icon }}" }
 *
 * // Conditional element with children
 * {
 *   element: "div",
 *   classes: ["rvo-alert__container"],
 *   when: { prop: "type" },
 *   children: [
 *     { element: "span", classes: ["rvo-icon"] },
 *     { element: "div", text: "{{ children | safe }}" },
 *   ],
 * }
 *
 * // If/else branching
 * {
 *   element: "div",
 *   when: { prop: "children" },
 *   children: [...],  // rendered when children is truthy
 *   elseChildren: [   // rendered when children is falsy
 *     { element: "a", ... },
 *   ],
 * }
 */
export interface ElementNode {
  /**
   * HTML element tag name.
   * - string: static tag (e.g., "div", "span", "button")
   * - DynamicElement: tag determined by a prop value
   */
  element: string | DynamicElement;

  /**
   * CSS class rules for this element.
   * Evaluated in order to build the class list.
   */
  classes?: ClassRule[];

  /**
   * HTML attribute mappings for this element.
   */
  attributes?: AttributeMapping[];

  /**
   * Inline style properties derived from props.
   */
  styles?: StyleMapping[];

  /**
   * Condition for rendering this element.
   * If omitted, the element is always rendered.
   * When present, the element (and its children) are only rendered
   * when the condition is met.
   */
  when?: Condition;

  /**
   * Leaf text content (Jinja2 template expression).
   * Mutually exclusive with children — use text for leaf nodes,
   * children for container nodes.
   *
   * @example "{{ children | safe }}"
   * @example "{{ heading }}"
   */
  text?: string;

  /**
   * Child elements (recursive tree).
   * Mutually exclusive with text — use children for container nodes,
   * text for leaf nodes.
   */
  children?: ElementNode[];

  /**
   * Alternative children rendered when the `when` condition is FALSE.
   * Only valid when `when` is also specified. Creates an if/else branch.
   *
   * @example
   * // Menu item: dropdown structure when children exist, link when not
   * {
   *   element: "div",
   *   when: { prop: "children" },
   *   children: [{ element: "button", ... }, { element: "ul", ... }],
   *   elseChildren: [{ element: "a", ... }],
   * }
   */
  elseChildren?: ElementNode[];

  /**
   * Raw HTML string to embed (e.g., SVG markup).
   * Rendered as-is inside the element, before text or children.
   * Use sparingly — only for content that can't be expressed as elements.
   */
  rawHtml?: string;

  /**
   * Data attribute for LOTC component tracking.
   * When true, adds data-lotc-component="{componentName}" to this element.
   * Only the root element of a component should set this.
   */
  isRoot?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPUTED VARIABLE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * A computed variable derived from a condition.
 * Used to create helper variables for complex conditions.
 *
 * @example
 * // Card: has_link_indicator = show_link_indicator AND href AND full_card_link
 * {
 *   name: "has_link_indicator",
 *   condition: { and: [{ prop: "show-link-indicator" }, { prop: "href" }, { prop: "full-card-link" }] },
 * }
 */
export interface ComputedVariable {
  /** Variable name (snake_case, used in templates) */
  name: string;
  /** Condition that determines the variable's boolean value */
  condition: Condition;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT IMPLEMENTATION (v2 — TREE-BASED)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Full implementation mapping for a component.
 *
 * Maps a ComponentDefinition to concrete HTML/CSS output using a recursive
 * element tree. The root ElementNode describes the entire component structure.
 */
export interface ComponentImplementation {
  /** Reference to the component definition being implemented */
  component: ComponentDefinition;

  /**
   * Root element node — the entire component template as a tree.
   */
  root: ElementNode;

  /**
   * Mixins to enable on the root element.
   * - utilityClasses: adds support for text-style, margin, padding utility classes
   * - genericAttributes: adds support for data-*, aria-* passthrough
   */
  mixins?: {
    utilityClasses?: boolean;
    genericAttributes?: boolean;
  };

  /**
   * Value maps for translating prop values.
   * Keys are map names (referenced by PatternClass.valueMap),
   * values are { inputValue: outputValue } mappings.
   *
   * @example
   * // Alert status icon Dutch name mapping
   * valueMaps: {
   *   "status-icon": {
   *     "info": "info",
   *     "warning": "waarschuwing",
   *     "error": "foutmelding",
   *     "success": "bevestiging",
   *   }
   * }
   */
  valueMaps?: Record<string, Record<string, string>>;

  /**
   * Computed variables derived from conditions.
   * Emitted as {% set %} assignments before the element tree.
   */
  computedVars?: ComputedVariable[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONTENT BLOCK (kept for backward compatibility during migration)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @deprecated Use ElementNode children instead. Kept temporarily for migration.
 */
export interface ContentBlock {
  template: string;
  when?: {
    prop: string;
    eq?: string | string[];
    truthy?: boolean;
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
 *   root: {
 *     element: "button",
 *     isRoot: true,
 *     classes: [
 *       "utrecht-button",
 *       { prop: "type", eq: "primary", class: "utrecht-button--primary-action" },
 *     ],
 *     attributes: [
 *       { prop: "disabled", attr: "disabled", type: "boolean" },
 *     ],
 *     children: [
 *       { element: "span", when: { prop: "show-icon", eq: "before" },
 *         classes: ["utrecht-icon", "rvo-icon", { prop: "icon", pattern: "rvo-icon-{value}" }],
 *         attributes: [{ attr: "role", type: "static", value: "img" }] },
 *       { element: "span", text: "{{ children if children else name | safe }}" },
 *     ],
 *   },
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

  if (!implementation.root) {
    throw new Error(
      `Implementation for "${implementation.component.name}" must specify a root ElementNode`,
    );
  }

  if (!implementation.root.element) {
    throw new Error(
      `Root ElementNode for "${implementation.component.name}" must specify an element`,
    );
  }

  // Validate the element tree recursively
  validateElementNode(implementation.root, implementation.component.name, "root");

  // Validate value maps
  if (implementation.valueMaps) {
    for (const [mapName, map] of Object.entries(implementation.valueMaps)) {
      if (typeof map !== "object" || map === null) {
        throw new Error(
          `Value map "${mapName}" in "${implementation.component.name}" must be an object`,
        );
      }
    }
  }

  return Object.freeze(implementation);
}

/**
 * Recursively validate an ElementNode and its children.
 */
function validateElementNode(
  node: ElementNode,
  componentName: string,
  path: string,
): void {
  if (!node.element) {
    throw new Error(
      `ElementNode at "${path}" in "${componentName}" must specify an element`,
    );
  }

  // Validate class rules
  if (node.classes) {
    for (const rule of node.classes) {
      if (typeof rule === "string") continue;
      if (isConditionalClass(rule)) {
        if (!rule.prop) {
          throw new Error(
            `ConditionalClass at "${path}" in "${componentName}" must specify a prop`,
          );
        }
        if (!rule.class) {
          throw new Error(
            `ConditionalClass for prop "${rule.prop}" at "${path}" in "${componentName}" must specify a class`,
          );
        }
      } else if (isPatternClass(rule)) {
        if (!rule.prop) {
          throw new Error(
            `PatternClass at "${path}" in "${componentName}" must specify a prop`,
          );
        }
        if (!rule.pattern || !rule.pattern.includes("{value}")) {
          throw new Error(
            `PatternClass for prop "${rule.prop}" at "${path}" in "${componentName}" must have a pattern containing {value}`,
          );
        }
      }
    }
  }

  // Validate attribute mappings
  if (node.attributes) {
    for (const attr of node.attributes) {
      if (!attr.attr) {
        throw new Error(
          `AttributeMapping at "${path}" in "${componentName}" must specify an attr`,
        );
      }
      if (attr.type === "static") {
        if (attr.value === undefined) {
          throw new Error(
            `Static AttributeMapping for "${attr.attr}" at "${path}" in "${componentName}" must specify a value`,
          );
        }
      } else if (attr.type === "boolean" || attr.type === "value") {
        if (!attr.prop) {
          throw new Error(
            `AttributeMapping for "${attr.attr}" at "${path}" in "${componentName}" must specify a prop`,
          );
        }
      }
    }
  }

  // Validate elseChildren requires when
  if (node.elseChildren && !node.when) {
    throw new Error(
      `ElementNode at "${path}" in "${componentName}" has elseChildren but no when condition`,
    );
  }

  // Recurse into children
  if (node.children) {
    for (let i = 0; i < node.children.length; i++) {
      validateElementNode(node.children[i], componentName, `${path}.children[${i}]`);
    }
  }

  // Recurse into elseChildren
  if (node.elseChildren) {
    for (let i = 0; i < node.elseChildren.length; i++) {
      validateElementNode(node.elseChildren[i], componentName, `${path}.elseChildren[${i}]`);
    }
  }
}
