/**
 * Variant Matrix (plan v7 T1.0)
 *
 * One enumerator, four consumers. Reads component definitions + their
 * implementations (the ElementNode IR) and produces one canonical list of
 * *cases*. Those cases are the single source for:
 *   - goldens              (python/tools/gen_goldens.py)
 *   - Playwright fixtures   (F7)
 *   - the component overview (COMPONENTS.md, F1.0b)
 *   - the coverage report   (COVERAGE.md, F1.0c)
 *
 * Types are declared structurally here (like generate-registry.ts) so this
 * module type-checks inside core/src/ without importing across the workspace
 * boundary. The runner (generate-matrix.ts) passes the real implementations in.
 */

// ═══════════════════════════════════════════════════════════════════════════════
// STRUCTURAL TYPES (compatible with definitions/ and implementations/)
// ═══════════════════════════════════════════════════════════════════════════════

export interface PropSpec {
  values?: readonly string[];
  default?: string | number | boolean;
  required?: boolean;
  description?: string;
}

export interface ContentDef {
  allowed: boolean;
  description?: string;
  allowedChildren?: string[];
}

export interface ChildDef {
  name: string;
  props: Record<string, PropSpec | null>;
}

export interface CompDef {
  name: string;
  category?: string;
  description?: string;
  props: Record<string, PropSpec | null>;
  events?: readonly string[];
  bindings?: Record<string, string>;
  content?: ContentDef;
  children?: Record<string, ChildDef>;
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
}

export type ClassRule = string | ConditionalClass | PatternClass;

export interface PropCondition {
  prop: string;
  eq?: string | string[];
}
export type Condition =
  | PropCondition
  | { not: Condition }
  | { and: Condition[] }
  | { or: Condition[] };

export interface AttrMapping {
  prop?: string;
  attr: string;
  type: string;
}

export interface ElementNode {
  element?: string | { prop: string; default: string };
  repeat?: { binding: string; as: string };
  classes?: ClassRule[];
  attributes?: AttrMapping[];
  when?: Condition;
  text?: string;
  children?: ElementNode[];
  elseChildren?: ElementNode[];
  styles?: { property: string; prop: string }[];
}

export interface CompImpl {
  component: CompDef;
  root: ElementNode;
}

// ═══════════════════════════════════════════════════════════════════════════════
// OUTPUT
// ═══════════════════════════════════════════════════════════════════════════════

export interface MatrixCase {
  /** Component name (without c- prefix). */
  component: string;
  /** Stable id, unique within (component, theme). Also used as a golden filename. */
  case_id: string;
  /** Theme this case renders under. */
  theme: string;
  /** The `<c-...>` markup to render. */
  markup: string;
  /** Props set on the tag (excludes content). */
  props: Record<string, string | boolean>;
  /** Content between tags, or null for a self-contained tag. */
  content: string | null;
  /** prop=value pairs this case is specifically exercising (for the coverage report). */
  covers: string[];
}

export interface Matrix {
  theme: string;
  cases: MatrixCase[];
}

// Representative / edge-case values reused across components.
const REP_TEXT = "Voorbeeld";
const EDGE_AMP = "Tom & Jerry";
const EDGE_SCRIPT = "<script>alert(1)</script>";
const NESTED_CONTENT = "<c-strong>genest</c-strong>";

// ═══════════════════════════════════════════════════════════════════════════════
// IR WALKING
// ═══════════════════════════════════════════════════════════════════════════════

function eqValues(eq: string | string[] | undefined): string[] {
  if (eq === undefined) return [];
  return Array.isArray(eq) ? eq : [eq];
}

/** Collect prop names referenced anywhere in the IR (classes, attrs, styles, text, conditions). */
function collectUsedProps(node: ElementNode, used: Set<string>): void {
  for (const rule of node.classes ?? []) {
    if (typeof rule !== "string") used.add(rule.prop);
  }
  for (const attr of node.attributes ?? []) {
    if (attr.prop) used.add(attr.prop);
  }
  for (const style of node.styles ?? []) {
    used.add(style.prop);
  }
  if (node.element && typeof node.element !== "string") used.add(node.element.prop);
  if (node.when) collectConditionProps(node.when, used);
  for (const child of node.children ?? []) collectUsedProps(child, used);
  for (const child of node.elseChildren ?? []) collectUsedProps(child, used);
}

function collectConditionProps(cond: Condition, used: Set<string>): void {
  if ("prop" in cond) used.add(cond.prop);
  else if ("not" in cond) collectConditionProps(cond.not, used);
  else if ("and" in cond) cond.and.forEach((c) => collectConditionProps(c, used));
  else if ("or" in cond) cond.or.forEach((c) => collectConditionProps(c, used));
}

/** Collect `prop=value` pairs the IR distinguishes (ClassRule eq/when, Condition eq). */
function collectDistinguished(node: ElementNode, out: Set<string>): void {
  for (const rule of node.classes ?? []) {
    if (typeof rule === "string") continue;
    if ("eq" in rule) {
      for (const v of eqValues(rule.eq)) out.add(`${rule.prop}=${v}`);
    }
    if ("when" in rule && rule.when) {
      for (const v of rule.when) out.add(`${rule.prop}=${v}`);
    }
  }
  if (node.when) collectConditionEq(node.when, out);
  for (const child of node.children ?? []) collectDistinguished(child, out);
  for (const child of node.elseChildren ?? []) collectDistinguished(child, out);
}

function collectConditionEq(cond: Condition, out: Set<string>): void {
  if ("prop" in cond) {
    for (const v of eqValues(cond.eq)) out.add(`${cond.prop}=${v}`);
  } else if ("not" in cond) {
    collectConditionEq(cond.not, out);
  } else if ("and" in cond) {
    cond.and.forEach((c) => collectConditionEq(c, out));
  } else if ("or" in cond) {
    cond.or.forEach((c) => collectConditionEq(c, out));
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CASE ENUMERATION
// ═══════════════════════════════════════════════════════════════════════════════

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "empty";
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function buildMarkup(
  name: string,
  props: Record<string, string | boolean>,
  content: string | null,
): string {
  const attrs = Object.entries(props)
    .map(([k, v]) => (v === true ? ` ${k}` : ` ${k}="${escapeAttr(String(v))}"`))
    .join("");
  // Always use an explicit closing tag: html.parser does not treat unknown
  // self-closing custom tags as void, so <c-x/> would swallow following siblings.
  return `<c-${name}${attrs}>${content ?? ""}</c-${name}>`;
}

/** The prop that carries visible label text, if any (name today, label after the rename). */
function labelProp(def: CompDef): string | null {
  for (const candidate of ["label", "name", "text"]) {
    if (candidate in def.props) return candidate;
  }
  return null;
}

export function buildComponentCases(impl: CompImpl, theme: string): MatrixCase[] {
  const def = impl.component;
  const cases: MatrixCase[] = [];
  const seen = new Set<string>();

  const used = new Set<string>();
  collectUsedProps(impl.root, used);

  const contentAllowed = def.content?.allowed ?? false;
  const baseContent = contentAllowed ? REP_TEXT : null;
  const label = labelProp(def);

  const add = (
    caseId: string,
    props: Record<string, string | boolean>,
    content: string | null,
    covers: string[],
  ): void => {
    let id = caseId;
    let n = 2;
    while (seen.has(id)) id = `${caseId}-${n++}`;
    seen.add(id);
    cases.push({
      component: def.name,
      case_id: id,
      theme,
      markup: buildMarkup(def.name, props, content),
      props,
      content,
      covers,
    });
  };

  // Base props: fill required text props so cases render meaningfully.
  const baseProps: Record<string, string | boolean> = {};
  for (const [prop, spec] of Object.entries(def.props)) {
    if (spec && spec.required && !spec.values) baseProps[prop] = REP_TEXT;
  }

  // 1. Default — all defaults, representative content/label.
  const defaultCovers: string[] = [];
  for (const [prop, spec] of Object.entries(def.props)) {
    if (spec && spec.values && spec.default !== undefined) {
      defaultCovers.push(`${prop}=${spec.default}`);
    }
  }
  add("default", { ...baseProps }, baseContent, defaultCovers);

  // 2. Enum props — one case per value.
  for (const [prop, spec] of Object.entries(def.props)) {
    if (!spec || !spec.values) continue;
    for (const value of spec.values) {
      add(
        `${slug(prop)}--${slug(value)}`,
        { ...baseProps, [prop]: value },
        baseContent,
        [`${prop}=${value}`],
      );
    }
  }

  // 3. Boolean props — presence.
  for (const [prop, spec] of Object.entries(def.props)) {
    if (spec !== null) continue;
    add(slug(prop), { ...baseProps, [prop]: true }, baseContent, [`${prop}=true`]);
  }

  // 4. Free-text props that actually affect output — representative value.
  for (const [prop, spec] of Object.entries(def.props)) {
    if (spec === null || (spec && spec.values)) continue; // skip boolean + enum
    if (!used.has(prop)) continue; // only props the IR reads
    if (prop === label) continue; // label handled below with edge cases
    add(`${slug(prop)}--text`, { ...baseProps, [prop]: REP_TEXT }, baseContent, [`${prop}=set`]);
  }

  // 5. Label + content edge cases (these feed the T1.4 escaping/void-tag bugs).
  if (label) {
    add(`${slug(label)}--amp`, { ...baseProps, [label]: EDGE_AMP }, null, [`${label}=set`]);
    add(`${slug(label)}--script`, { ...baseProps, [label]: EDGE_SCRIPT }, null, [`${label}=set`]);
  }
  if (contentAllowed) {
    add("content--amp", { ...baseProps }, EDGE_AMP, ["content=set"]);
    add("content--script", { ...baseProps }, EDGE_SCRIPT, ["content=set"]);
    add("content--empty", { ...baseProps }, "", ["content=empty"]);
    add("content--nested", { ...baseProps }, NESTED_CONTENT, ["content=nested"]);
  }

  return cases;
}

/**
 * Verify every enum value, boolean prop and IR-distinguished value has at least
 * one covering case. Returns the list of uncovered `prop=value` keys.
 */
export function findUncovered(impl: CompImpl): string[] {
  const def = impl.component;
  const required = new Set<string>();
  for (const [prop, spec] of Object.entries(def.props)) {
    if (spec === null) required.add(`${prop}=true`);
    else if (spec.values) for (const v of spec.values) required.add(`${prop}=${v}`);
  }
  collectDistinguished(impl.root, required);

  const covered = new Set<string>();
  for (const c of buildComponentCases(impl, "rvo")) {
    for (const cover of c.covers) covered.add(cover);
    // A case that sets an enum prop to a value also covers that pair.
    for (const [prop, value] of Object.entries(c.props)) {
      covered.add(`${prop}=${value === true ? "true" : value}`);
    }
  }

  return [...required].filter((key) => !covered.has(key)).sort();
}

export function buildMatrix(impls: CompImpl[], theme = "rvo"): Matrix {
  const cases: MatrixCase[] = [];
  for (const impl of impls) {
    cases.push(...buildComponentCases(impl, theme));
  }
  return { theme, cases };
}

// ═══════════════════════════════════════════════════════════════════════════════
// DOCS (T1.0b COMPONENTS.md, T1.0c COVERAGE.md)
// ═══════════════════════════════════════════════════════════════════════════════

function propType(spec: PropSpec | null): string {
  if (spec === null) return "boolean";
  if (spec.values && spec.values.length) return "enum";
  return "string";
}

/** GENERATED component overview (COMPONENTS.md). */
export function renderComponentsMarkdown(impls: CompImpl[], theme = "rvo"): string {
  const sorted = [...impls].sort((a, b) => a.component.name.localeCompare(b.component.name));
  const lines: string[] = [];
  lines.push("# Components");
  lines.push("");
  lines.push("> Generated by `core/src/matrix/generate-matrix.ts`. Do not edit by hand.");
  lines.push("");
  lines.push("| component | category | props | events | bindings | rvo | nldd |");
  lines.push("|---|---|---|---|---|---|---|");
  for (const impl of sorted) {
    const d = impl.component;
    const nProps = Object.keys(d.props).length;
    const nEvents = d.events?.length ?? 0;
    const nBindings = d.bindings ? Object.keys(d.bindings).length : 0;
    lines.push(
      `| ${d.name} | ${d.category ?? ""} | ${nProps} | ${nEvents} | ${nBindings} | ` +
        `${theme === "rvo" ? "✅" : "—"} | — |`,
    );
  }
  lines.push("");

  for (const impl of sorted) {
    const d = impl.component;
    lines.push(`## ${d.name}  (${d.category ?? "—"})`);
    lines.push("");
    if (d.description) {
      lines.push(d.description);
      lines.push("");
    }
    lines.push("| prop | type | values | default | required |");
    lines.push("|---|---|---|---|---|");
    for (const [prop, spec] of Object.entries(d.props)) {
      const type = propType(spec);
      const values = spec && spec.values ? spec.values.join(" ") : "—";
      const def = spec && spec.default !== undefined ? String(spec.default) : "";
      const req = spec && spec.required ? "✓" : "";
      lines.push(`| ${prop} | ${type} | ${values} | ${def} | ${req} |`);
    }
    lines.push("");
    const events = d.events && d.events.length ? d.events.map((e) => `@${e}`).join(" ") : "—";
    const bindings = d.bindings && Object.keys(d.bindings).length
      ? Object.keys(d.bindings).map((b) => `:${b}`).join(" ")
      : "—";
    lines.push(`events: ${events}    bindings: ${bindings}`);
    lines.push(`content: ${d.content?.allowed ? "yes" : "no"}`);
    lines.push("");
  }

  return lines.join("\n");
}

/** GENERATED coverage report (COVERAGE.md). */
export function renderCoverageMarkdown(impls: CompImpl[], theme = "rvo"): string {
  const sorted = [...impls].sort((a, b) => a.component.name.localeCompare(b.component.name));
  const lines: string[] = [];
  lines.push("# Coverage");
  lines.push("");
  lines.push("> Generated by `core/src/matrix/generate-matrix.ts`. Do not edit by hand.");
  lines.push(
    "> `cases` = variant-matrix cases (each has a golden). Playwright snapshots are " +
      "added per component in F7; until then the snapshot column is `pending`.",
  );
  lines.push("");
  lines.push("| component | theme | cases | golden | snapshot | uncovered |");
  lines.push("|---|---|---|---|---|---|");
  let totalUncovered = 0;
  for (const impl of sorted) {
    const cases = buildComponentCases(impl, theme);
    const uncovered = findUncovered(impl);
    totalUncovered += uncovered.length;
    lines.push(
      `| ${impl.component.name} | ${theme} | ${cases.length} | ✅ | pending | ` +
        `${uncovered.length ? uncovered.join(", ") : "—"} |`,
    );
  }
  lines.push("");
  lines.push(
    totalUncovered === 0
      ? "**All enum values, booleans and IR-distinguished values are covered by a case.**"
      : `**${totalUncovered} uncovered value(s) — build gate fails (see check_coverage.py).**`,
  );
  lines.push("");
  return lines.join("\n");
}
