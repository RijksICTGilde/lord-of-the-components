/**
 * Python renderer backend (plan v7 F3 / T3.2).
 *
 * Emits a Python module of renderer functions from the ElementNode IR — the
 * second backend beside the Jinja text generator. Each component becomes a
 * keyword-only function that builds HTML by appending to a `parts` list and
 * returns Markup. Enum→class maps become module-level dicts; prop values are
 * escaped; content is treated as already-safe Markup.
 *
 * Types are declared structurally (like generate-registry.ts) so this module
 * type-checks inside core/src/ without importing across the workspace boundary.
 */

// ── structural IR (compatible with implementations/implementation.ts) ─────────

export interface PropSpec {
  values?: readonly string[];
  default?: string | number | boolean;
  required?: boolean;
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
export interface PropCondition {
  prop: string;
  eq?: string | string[];
}
export type Condition =
  | PropCondition
  | { not: Condition }
  | { and: Condition[] }
  | { or: Condition[] };
export interface DynamicElement {
  prop: string;
  default: string;
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
export interface ComputedVariable {
  name: string;
  condition: Condition;
}
export interface CompImpl {
  component: {
    name: string;
    props: Record<string, PropSpec | null>;
    content?: { allowed: boolean };
  };
  root: ElementNode;
  mixins?: { utilityClasses?: boolean; genericAttributes?: boolean };
  valueMaps?: Record<string, Record<string, string>>;
  computedVars?: ComputedVariable[];
}

export class UnsupportedIR extends Error {}

/** Components on the Python renderer backend. Grows as each is proven byte-identical. */
export const PYTHON_BACKEND = new Set<string>([
  "paragraph",
  "heading",
  "icon",
  "layout-flow",
  "link",
  "button",
]);

// ── helpers ───────────────────────────────────────────────────────────────────

/** snake_case a prop name for use as a Python identifier. */
function pyName(prop: string): string {
  return prop.replace(/-/g, "_");
}

/** A single-quoted Python string literal. */
function pyStr(s: string): string {
  return "'" + s.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, "\\n") + "'";
}

function isPattern(rule: ClassRule): rule is PatternClass {
  return typeof rule === "object" && "pattern" in rule;
}
function isConditional(rule: ClassRule): rule is ConditionalClass {
  return typeof rule === "object" && "class" in rule;
}

// ── condition → Python expression ─────────────────────────────────────────────

function pyCondition(cond: Condition): string {
  if ("not" in cond) return `not (${pyCondition(cond.not)})`;
  if ("and" in cond) return cond.and.map((c) => `(${pyCondition(c)})`).join(" and ");
  if ("or" in cond) return cond.or.map((c) => `(${pyCondition(c)})`).join(" or ");
  const v = pyName(cond.prop);
  if (cond.eq === undefined) return v;
  if (Array.isArray(cond.eq)) {
    return `${v} in (${cond.eq.map(pyStr).join(", ")})`;
  }
  return `${v} == ${pyStr(cond.eq)}`;
}

// ── text expression → Python value expression ─────────────────────────────────

function textTruthy(t: TextExpr): string {
  if ("content" in t) return "content";
  if ("prop" in t) return pyName(t.prop);
  if ("literal" in t) return t.literal ? "True" : "False";
  if ("raw" in t) return t.raw ? "True" : "False";
  return "True";
}
function textValue(t: TextExpr): string {
  if ("content" in t) return "(content or '')";
  if ("prop" in t) return `esc(${pyName(t.prop)})`;
  if ("literal" in t) return pyStr(t.literal);
  if ("raw" in t) return `Markup(${pyStr(t.raw)})`;
  if ("slot" in t) throw new UnsupportedIR("named slots not yet supported in Python backend");
  // coalesce
  const parts = t.coalesce;
  const fold = (i: number): string => {
    if (i === parts.length - 1) return textValue(parts[i]);
    return `(${textValue(parts[i])} if ${textTruthy(parts[i])} else ${fold(i + 1)})`;
  };
  return fold(0);
}

// ── module-level dicts for pattern classes with `when` ────────────────────────

interface DictDef {
  name: string;
  entries: [string, string][]; // [value, className-with-leading-space]
}

// ── the generator ─────────────────────────────────────────────────────────────

export class PythonGenerator {
  private dicts: DictDef[] = [];
  private clsCounter = 0;
  private elCounter = 0;

  /** Generate a full renderers.py module for the given implementations. */
  generateModule(impls: CompImpl[]): string {
    const header = [
      "# ruff: noqa",
      "# mypy: ignore-errors",
      '"""Generated Python renderers — DO NOT EDIT.',
      "",
      "Produced by core/src/generators/python/index.ts from the ElementNode IR.",
      '"""',
      "",
      "from lord_of_the_components.runtime import (",
      "    Markup,",
      "    esc,",
      "    merge_class,",
      "    render_extra,",
      "    render_utility,",
      ")",
      "",
    ];
    const bodies: string[] = [];
    const sorted = [...impls].sort((a, b) => a.component.name.localeCompare(b.component.name));
    for (const impl of sorted) {
      this.dicts = [];
      this.clsCounter = 0;
      this.elCounter = 0;
      const fn = this.generateFunction(impl);
      // Emit this component's dicts before its function.
      for (const d of this.dicts) {
        bodies.push(`${d.name} = {`);
        for (const [k, v] of d.entries) bodies.push(`    ${pyStr(k)}: ${pyStr(v)},`);
        bodies.push("}");
        bodies.push("");
      }
      bodies.push(fn);
      bodies.push("");
    }
    return header.join("\n") + "\n" + bodies.join("\n");
  }

  private generateFunction(impl: CompImpl): string {
    const name = pyName(impl.component.name);
    const lines: string[] = [];
    lines.push(`def ${name}(*, ${this.paramList(impl)}):`);

    // computed vars
    for (const cv of impl.computedVars ?? []) {
      lines.push(`    ${pyName(cv.name)} = ${pyCondition(cv.condition)}`);
    }

    lines.push("    parts = []");
    this.emitNode(impl.root, impl, 1, lines);
    lines.push("    return Markup(''.join(parts))");
    return lines.join("\n");
  }

  private paramList(impl: CompImpl): string {
    const params: string[] = [];
    for (const [prop, spec] of Object.entries(impl.component.props)) {
      // `class` is a Python keyword and is routed via _class, not a kwarg.
      if (prop === "class") continue;
      const n = pyName(prop);
      if (spec === null) {
        params.push(`${n}=False`);
      } else if (spec.values && spec.values.length) {
        params.push(`${n}=${pyStr(String(spec.default ?? ""))}`);
      } else {
        const d = spec.default;
        params.push(`${n}=${d === undefined ? "''" : pyStr(String(d))}`);
      }
    }
    params.push("content=None");
    params.push("_extra=None");
    params.push("_class=''");
    return params.join(", ");
  }

  private append(lines: string[], indent: number, expr: string): void {
    lines.push(`${"    ".repeat(indent)}parts.append(${expr})`);
  }

  private emitNode(node: ElementNode, impl: CompImpl, indent: number, lines: string[]): void {
    if (node.repeat) {
      throw new UnsupportedIR(`repeat not yet supported in Python backend (${impl.component.name})`);
    }
    if (node.styles && node.styles.length) {
      throw new UnsupportedIR(`styles not yet supported in Python backend (${impl.component.name})`);
    }
    if (node.elseChildren && node.elseChildren.length) {
      throw new UnsupportedIR(`elseChildren not yet supported (${impl.component.name})`);
    }
    if (node.rawHtml) {
      throw new UnsupportedIR(`rawHtml not yet supported (${impl.component.name})`);
    }

    let ind = indent;
    if (node.when) {
      lines.push(`${"    ".repeat(indent)}if ${pyCondition(node.when)}:`);
      ind = indent + 1;
    }

    // element tag (static or dynamic)
    let tagExpr: string;
    let tagLiteral: string | null = null;
    const element = node.element!;
    if (typeof element === "string") {
      tagLiteral = element;
      tagExpr = pyStr(element);
    } else {
      const el = `_el${this.elCounter++}`;
      lines.push(
        `${"    ".repeat(ind)}${el} = ${pyName(element.prop)} or ${pyStr(element.default)}`,
      );
      tagExpr = el;
    }

    const needsClass = (node.classes && node.classes.length) || node.isRoot;
    let clsVar: string | null = null;
    if (needsClass) {
      clsVar = `cls${this.clsCounter++}`;
      this.emitClassBuild(node, impl, ind, lines, clsVar);
    }

    // opening tag
    this.append(lines, ind, tagLiteral ? pyStr("<" + tagLiteral) : `'<' + ${tagExpr}`);
    if (clsVar) this.append(lines, ind, `' class="' + ${clsVar} + '"'`);
    if (node.isRoot) {
      this.append(lines, ind, pyStr(` data-lotc-component="${impl.component.name}"`));
    }
    for (const attr of node.attributes ?? []) {
      this.emitAttribute(attr, ind, lines);
    }
    if (node.isRoot && impl.mixins?.genericAttributes) {
      this.append(lines, ind, "render_extra(_extra)");
    }
    this.append(lines, ind, pyStr(">"));

    // inner content
    for (const child of node.children ?? []) {
      this.emitNode(child, impl, ind, lines);
    }
    if (node.text !== undefined) {
      const expr = typeof node.text === "string"
        ? (() => {
            throw new UnsupportedIR(`raw string text not supported in Python backend (${impl.component.name}); use TextExpr`);
          })()
        : textValue(node.text);
      this.append(lines, ind, expr);
    }

    // closing tag
    this.append(lines, ind, tagLiteral ? pyStr(`</${tagLiteral}>`) : `'</' + ${tagExpr} + '>'`);
  }

  private emitClassBuild(
    node: ElementNode,
    impl: CompImpl,
    ind: number,
    lines: string[],
    clsVar: string,
  ): void {
    const rules = node.classes ?? [];
    const statics = rules.filter((r): r is string => typeof r === "string");
    const base = statics.join(" ");
    lines.push(`${"    ".repeat(ind)}${clsVar} = ${pyStr(base)}`);

    for (const rule of rules) {
      if (typeof rule === "string") continue;
      if (isPattern(rule)) {
        if (rule.valueMap || rule.guard) {
          throw new UnsupportedIR(`pattern valueMap/guard not yet supported (${impl.component.name})`);
        }
        const v = pyName(rule.prop);
        if (rule.when && rule.when.length) {
          const dictName = `_${impl.component.name.replace(/-/g, "_").toUpperCase()}_${rule.prop.replace(/-/g, "_").toUpperCase()}`;
          if (!this.dicts.some((d) => d.name === dictName)) {
            this.dicts.push({
              name: dictName,
              entries: rule.when.map((val) => [val, " " + rule.pattern.replace("{value}", val)]),
            });
          }
          lines.push(`${"    ".repeat(ind)}${clsVar} += ${dictName}.get(${v}, '')`);
        } else {
          const [prefix, suffix] = rule.pattern.split("{value}");
          const parts = [pyStr(" " + (prefix ?? "")), v];
          if (suffix) parts.push(pyStr(suffix));
          lines.push(`${"    ".repeat(ind)}if ${v}:`);
          lines.push(`${"    ".repeat(ind + 1)}${clsVar} += ${parts.join(" + ")}`);
        }
      } else if (isConditional(rule)) {
        const v = pyName(rule.prop);
        let cond: string;
        if (rule.eq === undefined) cond = v;
        else if (Array.isArray(rule.eq)) cond = `${v} in (${rule.eq.map(pyStr).join(", ")})`;
        else cond = `${v} == ${pyStr(rule.eq)}`;
        lines.push(`${"    ".repeat(ind)}if ${cond}:`);
        lines.push(`${"    ".repeat(ind + 1)}${clsVar} += ${pyStr(" " + rule.class)}`);
      }
    }

    // root: utility classes (text-style/margin/padding) then user-supplied class.
    if (node.isRoot) {
      if (impl.mixins?.utilityClasses) {
        lines.push(`${"    ".repeat(ind)}${clsVar} = merge_class(${clsVar}, render_utility(_extra))`);
      }
      lines.push(`${"    ".repeat(ind)}${clsVar} = merge_class(${clsVar}, _class)`);
    }
  }

  private emitAttribute(attr: AttributeMapping, ind: number, lines: string[]): void {
    if (attr.type === "static") {
      this.append(lines, ind, pyStr(` ${attr.attr}="${attr.value ?? ""}"`));
      return;
    }
    const v = pyName(attr.prop!);
    if (attr.type === "boolean") {
      lines.push(`${"    ".repeat(ind)}if ${v}:`);
      this.append(lines, ind + 1, pyStr(` ${attr.attr}`));
      return;
    }
    // value — append the pieces separately: ''.join() does not trigger Markup
    // escaping, whereas `plain + esc(v)` would escape the surrounding quotes.
    if (attr.valueMap || attr.filter) {
      throw new UnsupportedIR(`attribute valueMap/filter not yet supported`);
    }
    const vind = attr.conditional ? ind + 1 : ind;
    if (attr.conditional) {
      lines.push(`${"    ".repeat(ind)}if ${v}:`);
    }
    this.append(lines, vind, pyStr(` ${attr.attr}="`));
    this.append(lines, vind, `esc(${v})`);
    this.append(lines, vind, pyStr('"'));
  }
}

export function generatePythonRenderers(impls: CompImpl[]): string {
  return new PythonGenerator().generateModule(impls);
}
