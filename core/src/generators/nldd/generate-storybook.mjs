#!/usr/bin/env node
/**
 * Generate a "component storybook" for the NLDD design system: one page listing
 * every generated c-* component with its attribute table (name / type / allowed
 * enum values / default / description, straight from the lotc-nldd registry
 * fragment) AND a live NLDD rendering of a best-effort example.
 *
 * Leaf components get an auto-built example (enum-aware: it picks a real allowed
 * value instead of a free string); composite/container components that need
 * structured children get a curated example from OVERRIDES.
 *
 * Output: tests/visual/fixtures/nldd-storybook.html (a <c-page> compiled by LOTC).
 * Run:    node core/src/generators/nldd/generate-storybook.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const CEM = JSON.parse(readFileSync(resolve(ROOT, "node_modules/@nldd/design-system/custom-elements.json"), "utf8"));
const FRAG = JSON.parse(readFileSync(resolve(ROOT, "packages/lotc-nldd/src/lotc_nldd/registry.json"), "utf8"));
// Extended components: core components that carry theme-owned extension attrs
// (owner-tagged). They're not in the NLDD fragment, but belong in the storybook
// so the extended-component mechanism is visible with owner badges.
const CORE = JSON.parse(readFileSync(resolve(ROOT, "python/src/lord_of_the_components/registry.json"), "utf8"));
const EXTENDED = CORE.components.filter((c) => (c.attributes || []).some((a) => a.owner));
// Opt-in capability set: chart components (own registry fragment, Chart.js-backed).
const CHARTS = JSON.parse(readFileSync(resolve(ROOT, "packages/lotc-charts/src/lotc_charts/registry.json"), "utf8"));

// index CEM declarations by tag so we can read slots per component
const byTag = {};
for (const mod of CEM.modules || []) for (const d of mod.declarations || []) if (d.customElement && d.tagName) byTag[d.tagName] = d;

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// ── curated examples for composites that need structured children/slots ──
const OVERRIDES = {
  toolbar: `<c-toolbar><template slot="start"><c-button type="secondary" label="Terug"/></template><template slot="center"><c-toolbar-title text="Documenttitel"/></template><template slot="end"><c-button type="primary" label="Opslaan"/></template></c-toolbar>`,
  title: `<c-title><template slot="overline">Sectie</template>Hoofdtitel<template slot="subtitle">Een ondertitel die context geeft</template></c-title>`,
  byline: `<c-byline><template slot="avatars"><c-avatar initials="AS"/></template><template slot="text">Anne Schuth</template><template slot="supporting-text">2 uur geleden</template></c-byline>`,
  banner: `<c-banner text="Let op: dit is een demo-omgeving." variant="warning"><template slot="actions"><c-button type="secondary" label="Sluiten"/></template></c-banner>`,
  collection: `<c-collection><c-card outline padding="md">Item A</c-card><c-card outline padding="md">Item B</c-card><template slot="footer"><c-button type="secondary" label="Meer laden"/></template></c-collection>`,
  "activity-indicator": `<c-activity-indicator text="Bezig met laden…" show-text/>`,
  "document-tab-bar": `<c-document-tab-bar><c-document-tab-bar-item text="Document 1" supporting-text="gewijzigd" selected/><c-document-tab-bar-item text="Document 2"/></c-document-tab-bar>`,
  "simple-section": `<c-simple-section><template slot="header"><c-title>Sectiekop</c-title></template><c-p>De inhoud van de sectie.</c-p><template slot="footer"><c-button type="secondary" label="Actie"/></template></c-simple-section>`,
  "one-half-one-half-section": `<c-one-half-one-half-section><template slot="left"><c-card outline padding="md">Links</c-card></template><template slot="right"><c-card outline padding="md">Rechts</c-card></template></c-one-half-one-half-section>`,
  "two-thirds-one-third-section": `<c-two-thirds-one-third-section><template slot="left"><c-card outline padding="md">Hoofd (2/3)</c-card></template><template slot="right"><c-card outline padding="md">Zij (1/3)</c-card></template></c-two-thirds-one-third-section>`,
  "one-third-two-thirds-section": `<c-one-third-two-thirds-section><template slot="left"><c-card outline padding="md">Zij (1/3)</c-card></template><template slot="right"><c-card outline padding="md">Hoofd (2/3)</c-card></template></c-one-third-two-thirds-section>`,
  list: `<c-list><c-list-item><c-title-cell overline="Regel" text="Eerste item" supporting-text="met toelichting"/></c-list-item><c-list-item><c-text-cell>Tweede item</c-text-cell></c-list-item><c-list-item><c-description-cell><template slot="title">Derde</template><template slot="description">een beschrijving</template></c-description-cell></c-list-item></c-list>`,
  "list-item": `<c-list><c-list-item><c-text-cell>Een lijst-item</c-text-cell></c-list-item></c-list>`,
  "step-indicator": `<c-step-indicator><c-step-indicator-item text="Gegevens" status="past"/><c-step-indicator-item text="Controle" status="current"/><c-step-indicator-item text="Verzenden" status="future"/></c-step-indicator>`,
  "segmented-control": `<c-segmented-control><c-segmented-control-item text="Dag" selected/><c-segmented-control-item text="Week"/><c-segmented-control-item text="Maand"/></c-segmented-control>`,
  "radio-button-group": `<c-radio-button-group><c-radio-button-field label="Optie A"/><c-radio-button-field label="Optie B"/></c-radio-button-group>`,
  "toggle-button-group": `<c-toggle-button-group><c-toggle-button text="Vet"/><c-toggle-button text="Cursief"/></c-toggle-button-group>`,
  "button-bar": `<c-button-bar><c-button type="secondary" label="Annuleren"/><c-button type="primary" label="Bevestigen"/></c-button-bar>`,
  "button-group": `<c-button-group><c-button type="secondary" label="Een"/><c-button type="secondary" label="Twee"/></c-button-group>`,
  "progress-bar": `<c-progress-bar value="60" max="100"/>`,
  "progress-circle": `<c-progress-circle value="40" max="100"/>`,
  "inline-dialog": `<c-inline-dialog text="Weet je het zeker?"><template slot="actions"><c-button type="primary" label="Ja"/><c-button type="secondary" label="Nee"/></template></c-inline-dialog>`,
  "modal-dialog": `<c-modal-dialog text="Bevestigen">Wil je doorgaan?<template slot="actions"><c-button type="primary" label="Doorgaan"/></template></c-modal-dialog>`,
  "side-by-side-split-view": `<div style="height:120px"><c-side-by-side-split-view><template slot="pane-1"><c-card outline padding="md">Pane 1</c-card></template><template slot="pane-2"><c-card outline padding="md">Pane 2</c-card></template></c-side-by-side-split-view></div>`,
  form: `<c-form><c-form-field label="Naam"><c-text-field placeholder="Vul je naam in"/></c-form-field><c-form-field label="E-mail" supporting-label="We delen dit niet"><c-text-field placeholder="naam@voorbeeld.nl"/></c-form-field><c-form-actions><c-button type="primary" label="Versturen"/><c-button type="secondary" label="Annuleren"/></c-form-actions></c-form>`,
  "form-field": `<c-form><c-form-field label="Naam"><c-text-field placeholder="Vul je naam in"/></c-form-field></c-form>`,
  "form-actions": `<c-form-actions><c-button type="primary" label="Versturen"/><c-button type="secondary" label="Annuleren"/></c-form-actions>`,
  image: `<c-image src="data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22100%22><rect width=%22200%22 height=%22100%22 fill=%22%23154273%22/></svg>" alt="Voorbeeldafbeelding" width="200" height="100"><template slot="caption">Een bijschrift</template></c-image>`,
  "code-viewer": `<c-code-viewer language="python">print("Hallo, wereld")</c-code-viewer>`,
  "rich-text": `<c-rich-text><p>Tekst met <strong>vet</strong> en <em>cursief</em>.</p><ul><li>Punt een</li><li>Punt twee</li></ul></c-rich-text>`,
  avatar: `<c-avatar initials="AS" name="Anne Schuth" size="40"/>`,
  box: `<c-box pad="1.25rem" border background="accent">Een box met <code>pad</code> + <code>border</code> (lotc-layout) én <code>background</code> (nldd) — de basis blijft, de thema-eigen extra's komen erbij.</c-box>`,
  "line-chart": `<c-line-chart id="sb-line" title="CPU (millicores)" height="180px" limit="80" request="50" current="Current: 62m / 80m (78%)" :data="{'labels':['09:00','09:05','09:10','09:15','09:20','09:25'],'datasets':[{'label':'CPU','data':[30,45,38,60,54,62],'borderColor':'#39870c','backgroundColor':'rgba(57,135,12,.1)','fill':true}]}"/>`,
  gauge: `<c-gauge id="sb-gauge" value="68" label="CPU" sublabel="2.7 / 4 cores" color="#154273"/>`,
  cell: `<c-list><c-list-item><c-text-cell>Een cel</c-text-cell></c-list-item></c-list>`,
  "text-cell": `<c-list><c-list-item><c-text-cell>Tekst in een cel</c-text-cell></c-list-item></c-list>`,
  "title-cell": `<c-list><c-list-item><c-title-cell overline="Regel" text="Titel" supporting-text="toelichting"/></c-list-item></c-list>`,
  "description-cell": `<c-list><c-list-item><c-description-cell><template slot="title">Titel</template><template slot="description">beschrijving</template></c-description-cell></c-list-item></c-list>`,
};

// value picked for a plain string attribute, by name
function stringValue(n) {
  if (/^(text|label|name|title|heading|summary|caption|message)$/.test(n)) return "Voorbeeld";
  if (/^(supporting-?text|supporting-?label|overline|subtitle|byline)$/.test(n)) return "Toelichting";
  if (/^(max)$/.test(n)) return "100";
  if (/^(placeholder)$/.test(n)) return "Typ hier…";
  if (/(src|srcset|href|url|action)/.test(n)) return "#";
  if (n === "icon") return "info";
  if (n === "initials") return "AS";
  if (n === "language") return "python";
  return null; // unknown string attr → leave out of the demo
}

// Build a best-effort example for a leaf component from its fragment attrs + CEM slots.
function autoExample(comp) {
  if (OVERRIDES[comp.name]) return OVERRIDES[comp.name];
  const el = byTag["nldd-" + comp.name];
  const parts = [];
  for (const a of comp.attributes || []) {
    if (a.type === "boolean") continue; // booleans often hide/disable — skip in demo
    if (a.type === "enum") {
      const v = (a.enum_values || []).find((x) => x && x !== "inherit" && x !== "default") || (a.enum_values || [])[0];
      if (v) parts.push(`${a.name}="${v}"`);
      continue;
    }
    const v = stringValue(a.name);
    if (v != null) parts.push(`${a.name}="${v}"`);
  }
  const attrStr = parts.length ? " " + parts.slice(0, 5).join(" ") : "";
  const hasDefaultSlot = el && (el.slots || []).some((s) => !s.name);
  const inner = hasDefaultSlot ? "Voorbeeld" : "";
  return `<c-${comp.name}${attrStr}>${inner}</c-${comp.name}>`;
}

// ── attribute table ──
function typeCell(a) {
  if (a.type === "enum") {
    const vals = (a.enum_values || []).map((v) => `<code>${esc(v === "" ? "''" : v)}</code>`).join(" ");
    return `<span class="t enum">enum</span> ${vals}`;
  }
  return `<span class="t">${esc(a.type || "string")}</span>`;
}
function attrTable(comp) {
  if (!(comp.attributes || []).length) return `<p class="noattr">Geen attributen.</p>`;
  const rows = comp.attributes
    .map(
      (a) =>
        `<tr><td><code>${esc(a.name)}</code>${a.owner ? ` <span class="own">${esc(a.owner)}</span>` : ""}</td><td>${typeCell(a)}</td><td>${a.default != null ? `<code>${esc(a.default)}</code>` : "—"}</td><td>${esc(a.description || "")}</td></tr>`
    )
    .join("");
  return `<table class="attrs"><thead><tr><th>Attribuut</th><th>Type / waarden</th><th>Default</th><th>Omschrijving</th></tr></thead><tbody>${rows}</tbody></table>`;
}

// ── assemble ──
const CAT_LABEL = {
  actions: "Acties",
  content: "Content",
  forms: "Formulieren",
  layout: "Layout",
  "data-display": "Data-weergave",
  navigation: "Navigatie",
  feedback: "Feedback",
};
const groups = {};
for (const c of FRAG.components) (groups[c.category] = groups[c.category] || []).push(c);
const cats = Object.keys(groups).sort();

let nav = "";
let body = "";
for (const cat of cats) {
  const comps = groups[cat].sort((a, b) => a.name.localeCompare(b.name));
  const label = CAT_LABEL[cat] || cat;
  nav += `<div class="navcat">${esc(label)} <span>${comps.length}</span></div>`;
  nav += comps.map((c) => `<a href="#c-${c.name}">c-${esc(c.name)}</a>`).join("");
  body += `<h2 id="cat-${esc(cat)}">${esc(label)} <span>${comps.length}</span></h2>`;
  for (const c of comps) {
    const example = autoExample(c);
    body +=
      `<section class="story" id="c-${esc(c.name)}">` +
      `<div class="story-head"><h3>&lt;c-${esc(c.name)}&gt;</h3><code class="tag">nldd-${esc(c.name)}</code></div>` +
      (c.description ? `<p class="desc">${esc(c.description)}</p>` : "") +
      `<div class="canvas">${example}</div>` +
      `<pre class="code">${esc(example)}</pre>` +
      attrTable(c) +
      `</section>`;
  }
}

// ── extended components (shared base + theme-owned extension attributes) ──
if (EXTENDED.length) {
  nav += `<div class="navcat">Extended <span>${EXTENDED.length}</span></div>`;
  nav += EXTENDED.map((c) => `<a href="#c-${c.name}">c-${esc(c.name)}</a>`).join("");
  body += `<h2 id="cat-extended">Extended — thema-eigen attributen <span>${EXTENDED.length}</span></h2>`;
  body += `<p class="desc" style="margin:0 0 1rem">Componenten met een gedeelde basis + extra attributen die bij één design system horen (de <span class="own">owner</span>-badge). Zo'n attribuut is alleen geldig als dat thema actief is.</p>`;
  for (const c of EXTENDED) {
    const owners = [...new Set((c.attributes || []).map((a) => a.owner).filter(Boolean))];
    const example = autoExample(c);
    body +=
      `<section class="story" id="c-${esc(c.name)}">` +
      `<div class="story-head"><h3>&lt;c-${esc(c.name)}&gt;</h3>${owners.map((o) => `<span class="own">${esc(o)}</span>`).join(" ")}</div>` +
      (c.description ? `<p class="desc">${esc(c.description)}</p>` : "") +
      `<div class="canvas">${example}</div>` +
      `<pre class="code">${esc(example)}</pre>` +
      attrTable(c) +
      `</section>`;
  }
}

// ── charts (opt-in capability set — Chart.js-backed) ──
if (CHARTS.components && CHARTS.components.length) {
  const comps = CHARTS.components;
  nav += `<div class="navcat">Charts <span>${comps.length}</span></div>`;
  nav += comps.map((c) => `<a href="#c-${c.name}">c-${esc(c.name)}</a>`).join("");
  body += `<h2 id="cat-charts">Charts — opt-in set <span>${comps.length}</span></h2>`;
  body += `<p class="desc" style="margin:0 0 1rem">Een activatbare capability-set (Chart.js, NLDD-gestyled): <code>design_systems=["…","lotc-charts"]</code>. Buiten die set bestaan deze componenten niet.</p>`;
  for (const c of comps) {
    const example = autoExample(c);
    body +=
      `<section class="story" id="c-${esc(c.name)}">` +
      `<div class="story-head"><h3>&lt;c-${esc(c.name)}&gt;</h3><span class="own">lotc-charts</span></div>` +
      (c.description ? `<p class="desc">${esc(c.description)}</p>` : "") +
      `<div class="canvas">${example}</div>` +
      `<pre class="code">${esc(example)}</pre>` +
      attrTable(c) +
      `</section>`;
  }
}

const STYLE = `
  *{box-sizing:border-box}
  body{font-family:system-ui,-apple-system,sans-serif;margin:0;color:#1a1a1a;background:#fafafa}
  .wrap{display:grid;grid-template-columns:240px 1fr;gap:0;align-items:start}
  nav.index{position:sticky;top:0;align-self:start;height:100vh;overflow:auto;padding:1rem .75rem;border-right:1px solid #e5e5e5;background:#fff;font-size:.8rem}
  nav.index .navcat{margin:.9rem 0 .3rem;font-weight:700;color:#154273;text-transform:uppercase;font-size:.68rem;letter-spacing:.04em}
  nav.index .navcat span{color:#aaa;font-weight:400}
  nav.index a{display:block;color:#444;text-decoration:none;padding:.12rem .3rem;border-radius:4px;font-family:ui-monospace,monospace;font-size:.74rem}
  nav.index a:hover{background:#eef2f8;color:#154273}
  main{padding:3rem 2rem 1.5rem;max-width:900px}
  nav.index{padding-top:2.75rem}
  .story,h2{scroll-margin-top:3rem}
  h1{color:#154273;margin:0 0 .25rem}
  .lead{color:#666;margin:0 0 2rem}
  h2{margin:2.5rem 0 1rem;color:#154273;font-size:1.1rem;border-bottom:2px solid #154273;padding-bottom:.35rem}
  h2 span{color:#bbb;font-size:.8rem;font-weight:400}
  .story{border:1px solid #e5e5e5;border-radius:10px;margin:0 0 1.5rem;background:#fff;overflow:hidden}
  .story-head{display:flex;align-items:baseline;gap:.6rem;padding:.7rem 1rem;background:#f6f8fb;border-bottom:1px solid #eee}
  .story-head h3{margin:0;font-family:ui-monospace,monospace;font-size:.95rem;color:#154273}
  .story-head .tag{font-size:.72rem;color:#999}
  .desc{margin:.7rem 1rem 0;color:#555;font-size:.85rem}
  .canvas{margin:1rem;padding:1.25rem;border:1px dashed #d5d5d5;border-radius:8px;background:repeating-linear-gradient(45deg,#fcfcfc,#fcfcfc 10px,#f7f7f7 10px,#f7f7f7 20px)}
  pre.code{margin:0 1rem 1rem;padding:.7rem .9rem;background:#0f1b2d;color:#d6e2f0;border-radius:8px;font-size:.72rem;overflow:auto;white-space:pre-wrap;word-break:break-word}
  table.attrs{width:calc(100% - 2rem);margin:0 1rem 1rem;border-collapse:collapse;font-size:.78rem}
  table.attrs th{text-align:left;padding:.35rem .5rem;border-bottom:2px solid #e5e5e5;color:#154273;font-size:.7rem;text-transform:uppercase;letter-spacing:.03em}
  table.attrs td{padding:.35rem .5rem;border-bottom:1px solid #f0f0f0;vertical-align:top}
  table.attrs code{background:#f2f4f7;padding:.05rem .3rem;border-radius:3px;font-size:.72rem}
  .t{color:#7a5}.t.enum{color:#a56}
  .noattr{margin:0 1rem 1rem;color:#999;font-size:.8rem;font-style:italic}
  .own{display:inline-block;background:#eef4fb;color:#154273;border:1px solid #cdddf0;border-radius:4px;padding:0 .32rem;font-size:.62rem;font-weight:700;letter-spacing:.02em;vertical-align:middle;font-family:ui-monospace,monospace}
`;

const html = `<c-page title="NLDD component storybook" theme="nldd" design-systems="lotc-layout nldd lotc-charts">
<style>${STYLE}</style>
<div class="wrap">
<nav class="index"><strong style="color:#154273">Storybook</strong>${nav}</nav>
<main>
<h1>NLDD component-storybook</h1>
<p class="lead">Alle ${FRAG.components.length} gegenereerde <code>c-*</code>-componenten${EXTENDED.length ? ` + ${EXTENDED.length} extended component${EXTENDED.length > 1 ? "s" : ""}` : ""} — hun attributen (met toegestane enum-waarden en <span class="own">owner</span>-badges voor thema-eigen extensies) en een live rendering.</p>
${body}
</main>
</div>
</c-page>`;

writeFileSync(resolve(ROOT, "tests/visual/fixtures/nldd-storybook.html"), html);
console.log("wrote nldd-storybook.html:", FRAG.components.length, "components,", cats.length, "categorieën");
