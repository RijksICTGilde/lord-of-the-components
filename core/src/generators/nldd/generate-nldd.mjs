#!/usr/bin/env node
/**
 * Generate c-* bindings for every NLDD web component from its Custom Elements
 * Manifest (custom-elements.json). Emits, for each NLDD-specific element we do
 * not already cover, a hand-off Jinja template (c-X -> nldd-X with attribute +
 * event/hx/data passthrough) plus a registry-fragment entry, owned by lotc-nldd.
 *
 * Skips: components core already defines (button, card, tag, …), components we
 * cover semantically under a different name (tabs/menu/header/site-footer), and
 * any component that already has a hand-authored lotc-nldd template.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync, rmSync, statSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const CEM = JSON.parse(readFileSync(resolve(ROOT, "node_modules/@nldd/design-system/custom-elements.json"), "utf8"));
// Provenance: the exact NLDD version this fragment is generated from.
const NLDD_VERSION = JSON.parse(readFileSync(resolve(ROOT, "node_modules/@nldd/design-system/package.json"), "utf8")).version;
const CORE_REG = JSON.parse(readFileSync(resolve(ROOT, "python/src/lord_of_the_components/registry.json"), "utf8"));
// Resolve NLDD union-type aliases (AvatarSize = '' | 'md' | …) from the .d.ts so enum
// attributes get validated values, not free strings.
function buildEnums() {
  const walk = (dir, acc = []) => { for (const f of readdirSync(dir)) { const p = resolve(dir, f); const st = statSync(p); if (st.isDirectory()) walk(p, acc); else if (f.endsWith(".d.ts")) acc.push(p); } return acc; };
  const map = {};
  const re = /(?:export )?(?:declare )?type ([A-Z][A-Za-z0-9]+) = ((?:'[^']*' ?\| ?)*'[^']*');/g;
  for (const f of walk(resolve(ROOT, "node_modules/@nldd/design-system/dist"))) {
    const src = readFileSync(f, "utf8"); let m;
    while ((m = re.exec(src))) { const vals = m[2].split("|").map((v) => v.trim().replace(/^'|'$/g, "")).filter((v) => v !== ""); if (vals.length) map[m[1]] = [...new Set([...(map[m[1]] || []), ...vals])]; }
  }
  return map;
}
const ENUMS = buildEnums();

const NLDD_TPL_DIR = resolve(ROOT, "packages/lotc-nldd/src/lotc_nldd/templates/components");
const FRAGMENT = resolve(ROOT, "packages/lotc-nldd/src/lotc_nldd/registry.json");

// core component names (the list may be an array or an object)
const coreComps = Array.isArray(CORE_REG.components) ? CORE_REG.components : Object.values(CORE_REG.components);
const coreNames = new Set(coreComps.map((c) => c.name));

// NLDD tags we already cover under a different (semantic) c- name.
const SEMANTIC_DUPES = new Set([
  "tab-bar", "tab-bar-item", "menu-bar", "menu-bar-item", "top-navigation-bar",
  // page-footer maps to c-footer; its legal-bar sub-elements have no semantic
  // equivalent, so they are generated as their own c-* bindings.
  "page-footer",
  // Labelled field GROUPS are provided by the opt-in lotc-forms set (as
  // <c-radio-button-field>/<c-checkbox-field> composing primitives with full
  // ARIA wiring), so we don't also expose NLDD's raw single-control bindings
  // under the same names — that would shadow lotc-forms.
  "radio-button-field", "checkbox-field",
]);
// existing hand-authored lotc-nldd templates (don't overwrite)
const AUTOMARK = "Auto-generated from the NLDD custom-elements manifest";
const existingTpl = new Set(
  (existsSync(NLDD_TPL_DIR) ? readdirSync(NLDD_TPL_DIR).filter((f) => f.endsWith(".html.j2")) : [])
    .filter((f) => !readFileSync(resolve(NLDD_TPL_DIR, f), "utf8").includes(AUTOMARK))
    .map((f) => f.replace(".html.j2", "")),
);

// collect elements with their owning module group (for a category)
const els = [];
for (const mod of CEM.modules || []) {
  const group = (mod.path || "").split("/").filter((s) => s && s !== "src" && s !== "components")[0] || "content";
  for (const d of mod.declarations || []) {
    if (d.customElement && d.tagName) els.push({ ...d, _group: group });
  }
}

const CAT = { actions: "actions", content: "content", forms: "forms", inputs: "forms", layout: "layout",
  "lists-and-tables": "data-display", navigation: "navigation", "status-and-feedback": "feedback" };

// Build the fragment (with provenance meta) + templates in memory, so the same
// logic backs both writing (default) and --check (compare, don't touch disk).
export function buildOutputs() {
const fragment = [];
const templates = new Map();
for (const el of els) {
  const cname = el.tagName.replace(/^nldd-/, "");
  if (coreNames.has(cname) || SEMANTIC_DUPES.has(cname) || existingTpl.has(cname)) continue;

  const attrs = (el.attributes || []).map((a) => {
    const tt = (a.type?.text || "").trim();
    return {
      name: a.name,
      boolean: tt === "boolean",
      enumValues: ENUMS[tt] || null,
      default: a.default != null ? String(a.default).replace(/^['"]|['"]$/g, "") : undefined,
      description: (a.description || "").split("\n")[0].slice(0, 120),
    };
  });
  // `*` is not a slot NAME — bar-split-view documents it as "any other unique
  // slot name creates a bar panel", i.e. a wildcard. Emitting <div slot="*">
  // for it put children in a slot that does not exist.
  // Public methods that are NOT reachable declaratively. Standard plumbing is
  // dropped: focus/blur are DOM, and the form-associated callbacks are how a
  // custom element joins a <form>. What is left is behaviour an author can only
  // trigger from JavaScript — and `show` on nldd-sheet is the one that costs an
  // hour, because it looks like an attribute and is not (RIG-Cluster, RC-151:
  // setting it does nothing, `el.show = true` does nothing, `el.show()` opens).
  const PLUMBING = /^(focus|blur|commitFormValue|formValue|formState|form[A-Z]\w*Callback|handleSlotChange|getUpdateComplete)$/;
  const attrNames = new Set(attrs.map((a) => a.name));
  const methods = (el.members || [])
    .filter((m) => m.kind === "method" && (m.privacy || "public") === "public")
    .map((m) => m.name)
    .filter((n) => !n.startsWith("_") && !PLUMBING.test(n) && !attrNames.has(n))
    .sort();

  const slots = (el.slots || []).map((s) => s.name).filter((n) => n && n !== "*");
  const hasDefaultSlot = (el.slots || []).some((s) => !s.name);

  // ── template ──
  const L = [];
  L.push("{% import 'components/_generic_attributes.j2' as attrs %}");
  L.push("{# Auto-generated from the NLDD custom-elements manifest. Do not edit by hand. #}");
  L.push("{% macro lotc_render(_component_context) %}");
  let open = `<${el.tagName}`;
  for (const a of attrs) {
    const v = `_component_context.get('${a.name}')`;
    open += a.boolean
      ? `{% if ${v} %} ${a.name}{% endif %}`
      : `{% if ${v} %} ${a.name}="{{ ${v} }}"{% endif %}`;
  }
  open += ` data-lotc-component="${cname}" {{ attrs.render_extra_attributes(_component_context) }}>`;
  L.push(open);
  for (const s of slots) L.push(`{% if _component_context.get('slots', {}).get('${s}') %}<div slot="${s}">{{ _component_context['slots']['${s}'] | safe }}</div>{% endif %}`);
  // ALWAYS render the content, named slots or not. A component that only
  // emitted its named slots swallowed its children without a word: fifteen of
  // them did, and six make up the application shell, so a page rendered as an
  // empty <nldd-bar-split-view> with every gate green (reported by RIG-Cluster,
  // RC-151). It also keeps a child's own `slot=` intact, which a
  // <template slot="…"> cannot: that wraps in a <div>, and a split view wants
  // its panels as DIRECT children.
  L.push("{{ _component_context.get('content', '') | safe }}");
  L.push(`</${el.tagName}>`);
  L.push("{% endmacro %}");
  templates.set(cname, L.join("\n") + "\n");

  // ── registry entry ──
  fragment.push({
    name: cname,
    attributes: attrs.map((a) => a.enumValues
      ? { name: a.name, type: "enum", enum_values: a.enumValues, ...(a.default ? { default: a.default } : {}), description: a.description }
      : { name: a.name, type: a.boolean ? "boolean" : "string", description: a.description }),
    description: (el.summary || el.description || `NLDD ${cname}`).split("\n")[0].slice(0, 140),
    category: CAT[el._group] || "content",
    backend: "jinja",
    content: { allowed: true },
    ...(methods.length ? { methods } : {}),
  });
}
  return {
    fragment: { meta: { nldd_version: NLDD_VERSION, components: fragment.length }, components: fragment },
    templates,
  };
}

export { NLDD_VERSION, FRAGMENT, NLDD_TPL_DIR };

/** Auto-generated templates on disk that this run no longer produces.
 *
 * A component that disappears upstream leaves its template behind: it renders a
 * tag the bundle no longer defines, while being unreachable through the
 * registry. It happened twice unnoticed — `list-item-action`, removed in
 * 0.8.83, and `byline`, gone rounds earlier — so the run cleans up after
 * itself. Only files carrying the generated marker: a hand-authored template is
 * never ours to delete.
 */
function staleTemplates(templates) {
  if (!existsSync(NLDD_TPL_DIR)) return [];
  return readdirSync(NLDD_TPL_DIR)
    .filter((f) => f.endsWith(".html.j2") && !f.startsWith("_"))
    .filter((f) => !templates.has(f.slice(0, -8)))
    .filter((f) => readFileSync(resolve(NLDD_TPL_DIR, f), "utf8").includes("Auto-generated"));
}

function main() {
  const check = process.argv.includes("--check");
  const { fragment, templates } = buildOutputs();
  const fragmentJson = JSON.stringify(fragment, null, 1) + "\n";
  if (check) {
    const stale = [];
    if (!existsSync(FRAGMENT) || readFileSync(FRAGMENT, "utf8") !== fragmentJson) stale.push("registry.json");
    for (const [name, content] of templates) {
      const p = resolve(NLDD_TPL_DIR, `${name}.html.j2`);
      if (!existsSync(p) || readFileSync(p, "utf8") !== content) stale.push(`${name}.html.j2`);
    }
    for (const f of staleTemplates(templates)) stale.push(`${f} (component no longer exists)`);
    if (stale.length) {
      console.error(`✗ lotc-nldd is stale vs NLDD ${NLDD_VERSION} — run \`npm run gen:nldd\`.`);
      console.error(`  outdated (${stale.length}): ${stale.slice(0, 12).join(", ")}${stale.length > 12 ? " …" : ""}`);
      process.exit(1);
    }
    console.log(`✓ lotc-nldd fragment + ${templates.size} templates match NLDD ${NLDD_VERSION}`);
    return;
  }
  mkdirSync(dirname(FRAGMENT), { recursive: true });
  for (const [name, content] of templates) writeFileSync(resolve(NLDD_TPL_DIR, `${name}.html.j2`), content, "utf8");
  const removed = staleTemplates(templates);
  for (const f of removed) rmSync(resolve(NLDD_TPL_DIR, f));
  writeFileSync(FRAGMENT, fragmentJson, "utf8");
  console.log(`Generated ${templates.size} NLDD components (NLDD ${NLDD_VERSION}) -> lotc-nldd fragment + templates`);
  if (removed.length) console.log(`  removed ${removed.length} template(s) for components that no longer exist: ${removed.join(", ")}`);
}

// Run only when invoked directly (not when imported by nldd-diff).
if (import.meta.url === `file://${process.argv[1]}`) main();
