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
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync, statSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const CEM = JSON.parse(readFileSync(resolve(ROOT, "node_modules/@nldd/design-system/custom-elements.json"), "utf8"));
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

let genCount = 0;
const fragment = [];
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
  const slots = (el.slots || []).map((s) => s.name).filter(Boolean); // named slots
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
  if (hasDefaultSlot || slots.length === 0) L.push("{{ _component_context.get('content', '') | safe }}");
  L.push(`</${el.tagName}>`);
  L.push("{% endmacro %}");
  writeFileSync(resolve(NLDD_TPL_DIR, `${cname}.html.j2`), L.join("\n") + "\n", "utf8");

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
  });
  genCount++;
}

mkdirSync(dirname(FRAGMENT), { recursive: true });
writeFileSync(FRAGMENT, JSON.stringify({ components: fragment }, null, 1) + "\n", "utf8");
console.log(`Generated ${genCount} NLDD components -> lotc-nldd templates + registry fragment`);
console.log("Names:", fragment.map((c) => c.name).join(", "));
