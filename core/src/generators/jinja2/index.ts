/**
 * Jinja2 Template Generator
 *
 * Generates `.html.j2` templates from ComponentImplementation definitions.
 * Output matches the jinja-roos-components template pattern so the forked
 * parser can render them identically.
 *
 * Types are defined locally (structurally compatible with implementations/)
 * so this module compiles cleanly within core/src/ without cross-boundary
 * imports. TypeScript's structural typing ensures implementations/*.impl.ts
 * objects are directly assignable to these interfaces.
 *
 * Pipeline:
 *   ComponentImplementation → Jinja2Generator.generateTemplate() → .html.j2 string
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES (structurally compatible with implementations/implementation.ts)
// ═══════════════════════════════════════════════════════════════════════════════

/** Prop definition from a component definition. */
export interface PropSpec {
  values?: readonly string[];
  default?: string | number | boolean;
  required?: boolean;
  description?: string;
}

/** Conditional CSS class based on a prop value. */
export interface ConditionalClass {
  prop: string;
  eq?: string | string[];
  class: string;
}

/** Pattern-based CSS class using the prop value. */
export interface PatternClass {
  prop: string;
  pattern: string;
  when?: string[];
}

/** Union of all class rule types. */
export type ClassRule = string | ConditionalClass | PatternClass;

/** Maps a component prop to an HTML attribute, or emits a static attribute. */
export interface AttributeMapping {
  prop?: string;
  attr: string;
  type: "boolean" | "value" | "static";
  value?: string;
}

/** A block of inner HTML content, optionally conditional. */
export interface ContentBlock {
  template: string;
  when?: {
    prop: string;
    eq?: string | string[];
    truthy?: boolean;
  };
}

/** Dynamic HTML element selection based on a prop value. */
export interface DynamicElement {
  prop: string;
  default: string;
}

/** Full implementation mapping for a component. */
export interface ComponentImplementation {
  component: {
    name: string;
    props: Record<string, PropSpec | null>;
    [key: string]: unknown;
  };
  element: string | DynamicElement;
  classes: ClassRule[];
  attributes?: AttributeMapping[];
  content?: string | ContentBlock[];
  mixins?: {
    utilityClasses?: boolean;
    genericAttributes?: boolean;
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE GUARDS
// ═══════════════════════════════════════════════════════════════════════════════

function isConditionalClass(rule: ClassRule): rule is ConditionalClass {
  return typeof rule === "object" && "class" in rule;
}

function isPatternClass(rule: ClassRule): rule is PatternClass {
  return typeof rule === "object" && "pattern" in rule;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Convert a kebab-case prop name to a valid Jinja2/Python variable name.
 * Replaces hyphens with underscores: "show-icon" → "show_icon"
 */
function propToVar(prop: string): string {
  return prop.replace(/-/g, "_");
}

/**
 * Format a default value for use in Jinja2 `_component_context.get()`.
 * - string → 'string'
 * - boolean → true/false (Jinja2 recognizes lowercase true/false)
 * - number → number
 * - undefined → '' (empty string)
 */
function formatDefault(value: string | number | boolean | undefined): string {
  if (value === undefined) {
    return "''";
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (typeof value === "number") {
    return String(value);
  }
  return `'${value}'`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Jinja2 template generator.
 *
 * Produces `.html.j2` templates from implementation definitions that are
 * compatible with the LOTC Jinja2 extension (forked from jinja-roos).
 */
export class Jinja2Generator {
  /**
   * Generate a complete Jinja2 template for a component implementation.
   */
  generateTemplate(impl: ComponentImplementation): string {
    const lines: string[] = [];
    const componentName = impl.component.name;

    // ── Imports ────────────────────────────────────────────────────────────
    if (impl.mixins?.genericAttributes) {
      lines.push("{% import 'components/_generic_attributes.j2' as attrs %}");
    }
    if (impl.mixins?.utilityClasses) {
      lines.push("{% import 'components/_attribute_mixin.j2' as attributes %}");
    }

    // ── Prop variables ────────────────────────────────────────────────────
    const propVars = this.emitPropVariables(impl);
    if (propVars.length > 0) {
      lines.push(...propVars);
    }

    // ── CSS class list ────────────────────────────────────────────────────
    lines.push(...this.emitClassList(impl));

    // ── Utility classes mixin ─────────────────────────────────────────────
    if (impl.mixins?.utilityClasses) {
      lines.push(
        "{% set utility_classes = attributes.render_utility_classes(_component_context) %}",
        "{% if utility_classes %}",
        "    {% set css_classes = css_classes + utility_classes.split() %}",
        "{% endif %}",
      );
    }

    // ── Custom class attribute ────────────────────────────────────────────
    lines.push(
      "{% if _component_context.get('class') %}",
      "    {% set css_classes = css_classes + _component_context['class'].split() %}",
      "{% endif %}",
    );

    // ── HTML element ──────────────────────────────────────────────────────
    lines.push(...this.emitElement(impl));

    return lines.join("\n") + "\n";
  }

  /**
   * Emit `{% set var = _component_context.get('prop', default) %}` for each
   * prop used in the implementation.
   */
  private emitPropVariables(impl: ComponentImplementation): string[] {
    const lines: string[] = [];
    const props = impl.component.props;

    // Always emit 'children' for content
    if (impl.content) {
      lines.push(
        `{% set children = _component_context.get('content', '') %}`,
      );
    }

    // Emit {% set %} for ALL component props so content templates can
    // reference any prop variable (e.g. icon, name, color in icon spans).
    const propNames = Object.keys(props).sort();
    for (const propName of propNames) {
      // Skip 'class' — handled separately via _component_context.get('class')
      if (propName === "class") continue;

      const spec = props[propName];
      const varName = propToVar(propName);
      const defaultVal = spec && typeof spec === "object" ? spec.default : undefined;

      // For boolean props (null spec), default to false
      const formattedDefault =
        spec === null ? "false" : formatDefault(defaultVal);

      lines.push(
        `{% set ${varName} = _component_context.get('${propName}', ${formattedDefault}) %}`,
      );
    }

    return lines;
  }

  /**
   * Emit the CSS class list construction:
   * - Base static classes
   * - Conditional class additions
   * - Pattern-based class additions
   */
  private emitClassList(impl: ComponentImplementation): string[] {
    const lines: string[] = [];
    const staticClasses: string[] = [];
    const dynamicRules: (ConditionalClass | PatternClass)[] = [];

    // Separate static from dynamic rules
    for (const rule of impl.classes) {
      if (typeof rule === "string") {
        staticClasses.push(rule);
      } else {
        dynamicRules.push(rule);
      }
    }

    // Base class list
    const baseList = staticClasses.map((c) => `'${c}'`).join(", ");
    lines.push(`{% set css_classes = [${baseList}] %}`);

    // Dynamic class rules
    for (const rule of dynamicRules) {
      if (isConditionalClass(rule)) {
        lines.push(...this.emitConditionalClass(rule));
      } else if (isPatternClass(rule)) {
        lines.push(...this.emitPatternClass(rule));
      }
    }

    return lines;
  }

  /**
   * Emit a conditional class rule.
   *
   * Boolean (no eq):
   *   {% if prop %}{% set css_classes = css_classes + ['class'] %}{% endif %}
   *
   * Single eq:
   *   {% if prop == 'value' %}{% set css_classes = css_classes + ['class'] %}{% endif %}
   *
   * Array eq:
   *   {% if prop == 'v1' or prop == 'v2' %}{% set css_classes = css_classes + ['class'] %}{% endif %}
   */
  private emitConditionalClass(rule: ConditionalClass): string[] {
    const varName = propToVar(rule.prop);
    let condition: string;

    if (rule.eq === undefined) {
      // Boolean check
      condition = varName;
    } else if (Array.isArray(rule.eq)) {
      // Multiple values
      condition = rule.eq
        .map((v) => `${varName} == '${v}'`)
        .join(" or ");
    } else {
      // Single value
      condition = `${varName} == '${rule.eq}'`;
    }

    return [
      `{% if ${condition} %}{% set css_classes = css_classes + ['${rule.class}'] %}{% endif %}`,
    ];
  }

  /**
   * Emit a pattern class rule.
   *
   * With `when` values — emit one conditional per value:
   *   {% if size == 'xs' %}{% set css_classes = css_classes + ['utrecht-button--rvo-xs'] %}{% endif %}
   *   {% if size == 'sm' %}{% set css_classes = css_classes + ['utrecht-button--rvo-sm'] %}{% endif %}
   *
   * Without `when` — emit pattern with variable interpolation:
   *   {% if icon %}{% set css_classes = css_classes + ['rvo-icon-' ~ icon] %}{% endif %}
   */
  private emitPatternClass(rule: PatternClass): string[] {
    const varName = propToVar(rule.prop);

    if (rule.when) {
      return rule.when.map((value) => {
        const resolvedClass = rule.pattern.replace("{value}", value);
        return `{% if ${varName} == '${value}' %}{% set css_classes = css_classes + ['${resolvedClass}'] %}{% endif %}`;
      });
    }

    // No `when` — use Jinja2 string concatenation for the pattern
    const parts = rule.pattern.split("{value}");
    let jinjaExpr: string;
    if (parts.length === 2) {
      const segments = [`'${parts[0]}'`, varName];
      if (parts[1]) segments.push(`'${parts[1]}'`);
      jinjaExpr = segments.join(" ~ ");
    } else {
      jinjaExpr = `'${rule.pattern}'`;
    }

    return [
      `{% if ${varName} %}{% set css_classes = css_classes + [${jinjaExpr}] %}{% endif %}`,
    ];
  }

  /**
   * Emit the HTML element with class, attributes, and content.
   */
  private emitElement(impl: ComponentImplementation): string[] {
    const lines: string[] = [];
    const componentName = impl.component.name;

    // Determine tag name
    let openTag: string;
    let closeTag: string;
    if (typeof impl.element === "string") {
      openTag = impl.element;
      closeTag = impl.element;
    } else {
      // Dynamic element — use variable
      const dynEl = impl.element as DynamicElement;
      const varName = propToVar(dynEl.prop);
      openTag = `{{ ${varName} }}`;
      closeTag = `{{ ${varName} }}`;
    }

    // Build opening tag
    const tagParts: string[] = [];
    tagParts.push(`<${openTag}`);
    tagParts.push(`    class="{{ css_classes | join(' ') }}"`);
    tagParts.push(`    data-lotc-component="${componentName}"`);

    // Attributes
    if (impl.attributes) {
      for (const attr of impl.attributes) {
        tagParts.push(...this.emitAttribute(attr));
      }
    }

    // Generic attributes mixin
    if (impl.mixins?.genericAttributes) {
      tagParts.push(`    {{ attrs.render_extra_attributes(_component_context) }}`);
    }

    // Combine into multi-line opening tag
    const openingTag = tagParts.join("\n") + ">";

    lines.push(openingTag);

    // Content
    if (impl.content) {
      lines.push(...this.emitContent(impl.content));
    }

    // Closing tag
    lines.push(`</${closeTag}>`);

    return lines;
  }

  /**
   * Emit an HTML attribute from an AttributeMapping.
   *
   * Boolean: {% if disabled %}disabled{% endif %}
   * Value:   type="{{ html_type }}"
   */
  private emitAttribute(attr: AttributeMapping): string[] {
    if (attr.type === "static") {
      return [`    ${attr.attr}="${attr.value}"`];
    }

    const varName = propToVar(attr.prop!);

    if (attr.type === "boolean") {
      return [`    {% if ${varName} %}${attr.attr}{% endif %}`];
    }

    // Value attribute
    return [`    ${attr.attr}="{{ ${varName} }}"`];
  }

  /**
   * Emit content blocks.
   *
   * All blocks are joined on a single line to avoid unwanted whitespace
   * in the rendered output (matching the jinja-roos template pattern).
   */
  private emitContent(content: string | ContentBlock[]): string[] {
    if (typeof content === "string") {
      return [`    ${content}`];
    }

    const parts: string[] = [];
    for (const block of content) {
      if (block.when) {
        const condition = this.buildContentCondition(block);
        parts.push(`{% if ${condition} %}${block.template}{% endif %}`);
      } else {
        parts.push(block.template);
      }
    }
    // Join all content parts on a single line, indented once
    return [`    ${parts.join("")}`];
  }

  /**
   * Build a Jinja2 condition string from a ContentBlock's `when` clause.
   */
  private buildContentCondition(block: ContentBlock): string {
    const when = block.when!;
    const varName = propToVar(when.prop);

    if (when.truthy) {
      return varName;
    }

    if (when.eq !== undefined) {
      if (Array.isArray(when.eq)) {
        return when.eq.map((v) => `${varName} == '${v}'`).join(" or ");
      }
      return `${varName} == '${when.eq}'`;
    }

    // Default: truthiness check
    return varName;
  }
}
