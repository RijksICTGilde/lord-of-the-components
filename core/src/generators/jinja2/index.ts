/**
 * Jinja2 Template Generator — Tree-Based (v2)
 *
 * Generates `.html.j2` templates from tree-based ComponentImplementation
 * definitions (ElementNode trees). Replaces the flat v1 generator.
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

export interface PropSpec {
  values?: readonly string[];
  default?: string | number | boolean;
  required?: boolean;
  description?: string;
}

export interface ConditionalClass {
  prop: string;
  eq?: string | string[];
  class: string;
}

export interface PatternClass {
  prop: string;
  pattern: string;
  when?: string[];
  valueMap?: string;
  guard?: Condition;
}

export type ClassRule = string | ConditionalClass | PatternClass;

export interface AttributeMapping {
  prop?: string;
  attr: string;
  type: "boolean" | "value" | "static";
  value?: string;
  conditional?: boolean;
  valueMap?: string;
  filter?: string;
}

export interface StyleMapping {
  property: string;
  prop: string;
}

export interface DynamicElement {
  prop: string;
  default: string;
}

// Conditions
export interface PropCondition {
  prop: string;
  eq?: string | string[];
}

export interface NotCondition {
  not: Condition;
}

export interface AndCondition {
  and: Condition[];
}

export interface OrCondition {
  or: Condition[];
}

export type Condition = PropCondition | NotCondition | AndCondition | OrCondition;

export interface ComputedVariable {
  name: string;
  condition: Condition;
}

export type TextExpr =
  | { literal: string }
  | { prop: string }
  | { content: true }
  | { slot: string }
  | { coalesce: TextExpr[] }
  | { raw: string };

export interface ElementNode {
  element?: string | DynamicElement;
  repeat?: { binding: string; as: string };
  classes?: ClassRule[];
  attributes?: AttributeMapping[];
  styles?: StyleMapping[];
  when?: Condition;
  text?: string | TextExpr;
  children?: ElementNode[];
  elseChildren?: ElementNode[];
  rawHtml?: string;
  isRoot?: boolean;
}

/**
 * Convert leaf text (string or TextExpr) to the Jinja2 expression the Jinja
 * backend emits. Reproduces the pre-TextExpr strings exactly so regenerated
 * templates stay byte-identical.
 */
export function textToJinjaString(text: string | TextExpr): string {
  if (typeof text === "string") return text;
  if ("literal" in text) return text.literal;
  if ("raw" in text) return text.raw;
  if ("content" in text) return "{{ children | safe }}";
  if ("slot" in text) return `{{ slots.get('${text.slot}', '') | safe }}`;
  if ("prop" in text) return `{{ ${text.prop} | safe }}`;
  // coalesce: content-then-prop is the only shape used today.
  const parts = text.coalesce;
  if (
    parts.length === 2 &&
    "content" in parts[0] &&
    "prop" in parts[1]
  ) {
    return `{{ children if children else ${(parts[1] as { prop: string }).prop} | safe }}`;
  }
  // Generic fallback: nested ternary of the parts.
  const exprs = parts.map((p) => {
    if ("content" in p) return "children";
    if ("prop" in p) return (p as { prop: string }).prop;
    if ("literal" in p) return JSON.stringify((p as { literal: string }).literal);
    if ("raw" in p) return JSON.stringify((p as { raw: string }).raw);
    return "''";
  });
  let expr = exprs[exprs.length - 1];
  for (let i = exprs.length - 2; i >= 0; i--) {
    expr = `${exprs[i]} if ${exprs[i]} else ${expr}`;
  }
  return `{{ ${expr} | safe }}`;
}

export interface ComponentImplementation {
  component: {
    name: string;
    props: Record<string, PropSpec | null>;
    content?: { allowed: boolean };
    [key: string]: unknown;
  };
  root: ElementNode;
  mixins?: {
    utilityClasses?: boolean;
    genericAttributes?: boolean;
  };
  valueMaps?: Record<string, Record<string, string>>;
  computedVars?: ComputedVariable[];
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

function isPropCondition(c: Condition): c is PropCondition {
  return "prop" in c;
}

function isNotCondition(c: Condition): c is NotCondition {
  return "not" in c;
}

function isAndCondition(c: Condition): c is AndCondition {
  return "and" in c;
}

function isOrCondition(c: Condition): c is OrCondition {
  return "or" in c;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/** HTML void elements never get a closing tag. */
const VOID_ELEMENTS = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input",
  "link", "meta", "param", "source", "track", "wbr",
]);

/**
 * Convert a kebab-case prop name to a valid Jinja2/Python variable name.
 */
function propToVar(prop: string): string {
  return prop.replace(/-/g, "_");
}

/**
 * Format a default value for use in Jinja2 `_component_context.get()`.
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

/**
 * Generate indentation string.
 */
function indent(level: number): string {
  return "    ".repeat(level);
}

// ═══════════════════════════════════════════════════════════════════════════════
// GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Jinja2 template generator — tree-based (v2).
 *
 * Produces `.html.j2` templates from tree-based implementation definitions
 * by recursively walking the ElementNode tree.
 */
export class Jinja2Generator {
  /**
   * Generate a complete Jinja2 template for a component implementation.
   */
  generateTemplate(impl: ComponentImplementation): string {
    const lines: string[] = [];

    // ── Imports ────────────────────────────────────────────────────────────
    if (impl.mixins?.genericAttributes) {
      lines.push("{% import 'components/_generic_attributes.j2' as attrs %}");
    }
    if (impl.mixins?.utilityClasses) {
      lines.push("{% import 'components/_attribute_mixin.j2' as attributes %}");
    }

    // ── Prop variables ────────────────────────────────────────────────────
    lines.push(...this.emitPropVariables(impl));

    // ── Computed variables ────────────────────────────────────────────────
    if (impl.computedVars) {
      for (const cv of impl.computedVars) {
        const cond = this.renderCondition(cv.condition);
        lines.push(`{% set ${cv.name} = ${cond} %}`);
      }
    }

    // ── Value maps ────────────────────────────────────────────────────────
    if (impl.valueMaps) {
      for (const [mapName, map] of Object.entries(impl.valueMaps)) {
        const varName = propToVar(mapName);
        const entries = Object.entries(map)
          .map(([k, v]) => `'${k}': '${v}'`)
          .join(", ");
        lines.push(`{% set ${varName}_map = {${entries}} %}`);
      }
    }

    // ── Element tree ──────────────────────────────────────────────────────
    lines.push(...this.emitElementNode(impl.root, impl, 0));

    return lines.join("\n") + "\n";
  }

  /**
   * Emit `{% set var = _component_context.get('prop', default) %}` for each prop.
   */
  private emitPropVariables(impl: ComponentImplementation): string[] {
    const lines: string[] = [];
    const props = impl.component.props;

    // Emit 'children' if the component accepts content
    const hasContent = impl.component.content?.allowed !== false;
    if (hasContent) {
      lines.push(
        `{% set children = _component_context.get('content', '') %}`,
      );
    }

    // Named slots are always available (empty dict if none supplied).
    lines.push("{% set slots = _component_context.get('slots', {}) %}");

    const propNames = Object.keys(props).sort();
    for (const propName of propNames) {
      if (propName === "class") continue;

      const spec = props[propName];
      const varName = propToVar(propName);
      const defaultVal = spec && typeof spec === "object" ? spec.default : undefined;
      const formattedDefault =
        spec === null ? "false" : formatDefault(defaultVal);

      lines.push(
        `{% set ${varName} = _component_context.get('${propName}', ${formattedDefault}) %}`,
      );
    }

    return lines;
  }

  /**
   * Recursively emit Jinja2 for an ElementNode.
   */
  private emitElementNode(
    node: ElementNode,
    impl: ComponentImplementation,
    indentLevel: number,
  ): string[] {
    const lines: string[] = [];
    const ind = indent(indentLevel);

    // ── Repeat: loop the children over a bound list ───────────────────────
    if (node.repeat) {
      const { binding, as } = node.repeat;
      lines.push(`${ind}{% for ${as} in _component_context.get('${binding}', []) %}`);
      for (const child of node.children ?? []) {
        lines.push(...this.emitElementNode(child, impl, indentLevel + 1));
      }
      lines.push(`${ind}{% endfor %}`);
      return lines;
    }

    // ── Wrap in condition if `when` is specified ──────────────────────────
    if (node.when) {
      const cond = this.renderCondition(node.when);
      lines.push(`${ind}{% if ${cond} %}`);
      lines.push(...this.emitElementNodeInner(node, impl, indentLevel));
      if (node.elseChildren) {
        lines.push(`${ind}{% else %}`);
        for (const child of node.elseChildren) {
          lines.push(...this.emitElementNode(child, impl, indentLevel));
        }
      }
      lines.push(`${ind}{% endif %}`);
    } else {
      lines.push(...this.emitElementNodeInner(node, impl, indentLevel));
    }

    return lines;
  }

  /**
   * Emit the inner content of an ElementNode (the element itself, without condition wrapper).
   */
  private emitElementNodeInner(
    node: ElementNode,
    impl: ComponentImplementation,
    indentLevel: number,
  ): string[] {
    const lines: string[] = [];
    const ind = indent(indentLevel);
    const componentName = impl.component.name;

    // ── CSS classes ───────────────────────────────────────────────────────
    const hasClasses = node.classes && node.classes.length > 0;
    const isRootNode = node.isRoot;
    const needsClassList = hasClasses || isRootNode;
    const hasAttributes = node.attributes && node.attributes.length > 0;
    const hasStyles = node.styles && node.styles.length > 0;

    // ── Inline element shortcut ──────────────────────────────────────────
    // Elements with only text content and no classes/attributes/styles
    // render on a single line: <tag>text</tag>
    const isInlineElement = node.text && !hasClasses && !isRootNode
      && !hasAttributes && !hasStyles && !node.rawHtml && !node.children;

    if (isInlineElement) {
      const tagName = this.resolveTagName(node.element!);
      lines.push(`${ind}<${tagName}>${textToJinjaString(node.text!)}</${tagName}>`);
      return lines;
    }

    // Use a unique css_classes variable for non-root nodes to avoid collisions
    const classVar = isRootNode ? "css_classes" : `css_classes`;

    if (needsClassList) {
      lines.push(...this.emitClassList(node.classes || [], classVar, ind));

      // Utility classes mixin (root only)
      if (isRootNode && impl.mixins?.utilityClasses) {
        lines.push(
          `${ind}{% set utility_classes = attributes.render_utility_classes(_component_context) %}`,
          `${ind}{% if utility_classes %}`,
          `${ind}    {% set ${classVar} = ${classVar} + utility_classes.split() %}`,
          `${ind}{% endif %}`,
        );
      }

      // Custom class attribute (root only)
      if (isRootNode) {
        lines.push(
          `${ind}{% if _component_context.get('class') %}`,
          `${ind}    {% set ${classVar} = ${classVar} + _component_context['class'].split() %}`,
          `${ind}{% endif %}`,
        );
      }
    }

    // ── Build opening tag ─────────────────────────────────────────────────
    const tagName = this.resolveTagName(node.element!);
    const tagParts: string[] = [];
    tagParts.push(`${ind}<${tagName}`);

    // For non-root elements, render explicit attributes before class
    // (matches hand-written template conventions where href, src, etc. precede class)
    if (!isRootNode && node.attributes) {
      for (const attr of node.attributes) {
        tagParts.push(...this.emitAttribute(attr, `${ind}    `));
      }
    }

    if (needsClassList) {
      tagParts.push(`${ind}    class="{{ ${classVar} | join(' ') }}"`);
    }

    if (isRootNode) {
      tagParts.push(`${ind}    data-lotc-component="${componentName}"`);
    }

    // For root elements, render attributes after class
    if (isRootNode && node.attributes) {
      for (const attr of node.attributes) {
        tagParts.push(...this.emitAttribute(attr, `${ind}    `));
      }
    }

    // Styles
    if (node.styles && node.styles.length > 0) {
      tagParts.push(...this.emitStyles(node.styles, `${ind}    `));
    }

    // Generic attributes mixin (root only)
    if (isRootNode && impl.mixins?.genericAttributes) {
      tagParts.push(
        `${ind}    {{ attrs.render_extra_attributes(_component_context) }}`,
      );
    }

    // Close opening tag
    const openingTag = tagParts.join("\n") + ">";
    lines.push(openingTag);

    // ── Inner content ─────────────────────────────────────────────────────
    if (node.rawHtml) {
      // Raw HTML (e.g. embedded SVG) — emit as-is, indented
      const rawLines = node.rawHtml.split("\n");
      for (const rawLine of rawLines) {
        lines.push(`${ind}    ${rawLine}`);
      }
    }

    if (node.children) {
      for (const child of node.children) {
        lines.push(...this.emitElementNode(child, impl, indentLevel + 1));
      }
    }

    if (node.text) {
      lines.push(`${ind}    ${textToJinjaString(node.text)}`);
    }

    // ── Closing tag (void elements have none) ─────────────────────────────
    const closeTagName = this.resolveTagName(node.element!);
    if (!VOID_ELEMENTS.has(closeTagName)) {
      lines.push(`${ind}</${closeTagName}>`);
    }

    return lines;
  }

  /**
   * Resolve element tag name (static or dynamic).
   */
  private resolveTagName(element: string | DynamicElement): string {
    if (typeof element === "string") {
      return element;
    }
    const varName = propToVar(element.prop);
    return `{{ ${varName} }}`;
  }

  /**
   * Emit CSS class list construction for a node.
   */
  private emitClassList(
    classes: ClassRule[],
    classVar: string,
    ind: string,
  ): string[] {
    const lines: string[] = [];
    const staticClasses: string[] = [];
    const dynamicRules: (ConditionalClass | PatternClass)[] = [];

    for (const rule of classes) {
      if (typeof rule === "string") {
        staticClasses.push(rule);
      } else {
        dynamicRules.push(rule);
      }
    }

    const baseList = staticClasses.map((c) => `'${c}'`).join(", ");
    lines.push(`${ind}{% set ${classVar} = [${baseList}] %}`);

    for (const rule of dynamicRules) {
      if (isConditionalClass(rule)) {
        lines.push(...this.emitConditionalClass(rule, classVar, ind));
      } else if (isPatternClass(rule)) {
        lines.push(...this.emitPatternClass(rule, classVar, ind));
      }
    }

    return lines;
  }

  /**
   * Emit a conditional class rule.
   */
  private emitConditionalClass(
    rule: ConditionalClass,
    classVar: string,
    ind: string,
  ): string[] {
    const varName = propToVar(rule.prop);
    let condition: string;

    if (rule.eq === undefined) {
      condition = varName;
    } else if (Array.isArray(rule.eq)) {
      condition = rule.eq
        .map((v) => `${varName} == '${v}'`)
        .join(" or ");
    } else {
      condition = `${varName} == '${rule.eq}'`;
    }

    return [
      `${ind}{% if ${condition} %}{% set ${classVar} = ${classVar} + ['${rule.class}'] %}{% endif %}`,
    ];
  }

  /**
   * Emit a pattern class rule (with optional valueMap support).
   */
  private emitPatternClass(
    rule: PatternClass,
    classVar: string,
    ind: string,
  ): string[] {
    const varName = propToVar(rule.prop);

    // Resolve the value expression (with or without valueMap)
    const valueExpr = rule.valueMap
      ? `${propToVar(rule.valueMap)}_map[${varName}]`
      : varName;

    // Build guard prefix/suffix if guard condition is present
    const guardPrefix = rule.guard ? `${this.renderCondition(rule.guard)} and ` : "";

    if (rule.when) {
      return rule.when.map((value) => {
        // For valueMap patterns, we need to look up the mapped value
        let resolvedClass: string;
        if (rule.valueMap) {
          resolvedClass = rule.pattern.replace("{value}", `{{ ${propToVar(rule.valueMap)}_map['${value}'] }}`);
          return `${ind}{% if ${guardPrefix}${varName} == '${value}' %}{% set ${classVar} = ${classVar} + ['${resolvedClass}'] %}{% endif %}`;
        } else {
          resolvedClass = rule.pattern.replace("{value}", value);
          return `${ind}{% if ${guardPrefix}${varName} == '${value}' %}{% set ${classVar} = ${classVar} + ['${resolvedClass}'] %}{% endif %}`;
        }
      });
    }

    // No `when` — use Jinja2 string concatenation
    const parts = rule.pattern.split("{value}");
    let jinjaExpr: string;
    if (parts.length === 2) {
      const segments = [`'${parts[0]}'`, valueExpr];
      if (parts[1]) segments.push(`'${parts[1]}'`);
      jinjaExpr = segments.join(" ~ ");
    } else {
      jinjaExpr = `'${rule.pattern}'`;
    }

    const condition = guardPrefix ? `${guardPrefix}${varName}` : varName;
    return [
      `${ind}{% if ${condition} %}{% set ${classVar} = ${classVar} + [${jinjaExpr}] %}{% endif %}`,
    ];
  }

  /**
   * Emit an HTML attribute.
   */
  private emitAttribute(attr: AttributeMapping, ind: string): string[] {
    if (attr.type === "static") {
      return [`${ind}${attr.attr}="${attr.value}"`];
    }

    const varName = propToVar(attr.prop!);

    if (attr.type === "boolean") {
      return [`${ind}{% if ${varName} %}${attr.attr}{% endif %}`];
    }

    // Value attribute — resolve value expression with optional valueMap and filter
    let valueExpr = varName;
    if (attr.valueMap) {
      valueExpr = `${propToVar(attr.valueMap)}_map[${varName}]`;
    }
    if (attr.filter) {
      valueExpr = `${valueExpr} | ${attr.filter}`;
    }

    if (attr.conditional) {
      return [`${ind}{% if ${varName} %}${attr.attr}="{{ ${valueExpr} }}"{% endif %}`];
    }
    return [`${ind}${attr.attr}="{{ ${valueExpr} }}"`];
  }

  /**
   * Emit inline style properties.
   */
  private emitStyles(styles: StyleMapping[], ind: string): string[] {
    // Build a conditional style string
    // {% if division %}style="--division: {{ division }};"{% endif %}
    const parts: string[] = [];
    const conditions: string[] = [];

    for (const style of styles) {
      const varName = propToVar(style.prop);
      parts.push(`${style.property}: {{ ${varName} }};`);
      conditions.push(varName);
    }

    const condStr = conditions.join(" or ");
    const styleStr = parts.join(" ");

    return [`${ind}{% if ${condStr} %}style="${styleStr}"{% endif %}`];
  }

  /**
   * Render a Condition to a Jinja2 expression string.
   */
  private renderCondition(condition: Condition): string {
    if (isPropCondition(condition)) {
      const varName = propToVar(condition.prop);
      if (condition.eq === undefined) {
        return varName;
      }
      if (Array.isArray(condition.eq)) {
        return condition.eq
          .map((v) => `${varName} == '${v}'`)
          .join(" or ");
      }
      return `${varName} == '${condition.eq}'`;
    }

    if (isNotCondition(condition)) {
      const inner = this.renderCondition(condition.not);
      return `not (${inner})`;
    }

    if (isAndCondition(condition)) {
      const parts = condition.and.map((c) => {
        const rendered = this.renderCondition(c);
        // Wrap OR expressions in parens for correct precedence
        if (isOrCondition(c)) return `(${rendered})`;
        return rendered;
      });
      return parts.join(" and ");
    }

    if (isOrCondition(condition)) {
      const parts = condition.or.map((c) => this.renderCondition(c));
      return parts.join(" or ");
    }

    return "true";
  }
}
