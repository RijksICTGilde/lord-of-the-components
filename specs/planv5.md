# Plan v5: Lord of the Components -- Element Tree API + CSS Bundling

## Context

Two fundamental problems emerged after v4 implementation:

1. **The implementation API is too flat.** It can only describe one element with CSS classes. Real components (alert, card, header) have nested element trees. This forced hand-tuning 10+ templates after generation, defeating the purpose of a declarative, multi-target implementation layer.

2. **No CSS bundling.** Components render HTML with CSS classes but no CSS is loaded. Users have no way to get styles working without manually hunting for CDN links.

**Goal:** Redesign the implementation layer as an element tree (portable to Jinja2/React/Django), add a frontend build pipeline (npm → webpack → bundled CSS in Python package, copied from jinja-roos), and re-generate all templates purely from the new API with zero hand-tuning.

---

## Part A: Element Tree API Redesign

### Problem

Current flat API can't express: nested divs, conditional wrappers, embedded SVG, value mappings, mutually exclusive classes. 10 of 19 templates required hand-tuning.

### Solution: Recursive ElementNode tree

```typescript
interface ElementNode {
  element: string | DynamicElement;       // tag name or { prop, default }
  classes?: ClassRule[];                   // same as before
  attributes?: AttributeMapping[];        // same as before
  when?: Condition;                       // only render when condition met
  text?: string;                          // leaf content (template expression)
  children?: ElementNode[];               // nested elements (recursive)
}

interface ComponentImplementation {
  component: ComponentDefinition;
  root: ElementNode;                      // element TREE, not flat
  mixins?: { utilityClasses?: boolean; genericAttributes?: boolean };
  valueMaps?: Record<string, Record<string, string>>;  // type → icon name, etc.
}
```

**Example: Alert** (currently needs heavy hand-tuning → fully declarative with tree):

```typescript
defineImplementation({
  component: alert,
  valueMaps: {
    "status-icon": { info: "info", warning: "waarschuwing", error: "foutmelding", success: "bevestiging" }
  },
  root: {
    element: "div",
    classes: ["rvo-alert", { prop: "type", pattern: "rvo-alert--{value}" }],
    children: [
      {
        element: "div",
        classes: ["rvo-alert__container"],
        children: [
          { element: "span", classes: ["rvo-icon", { prop: "type", pattern: "rvo-icon-{value}", valueMap: "status-icon" }] },
          { element: "div", classes: ["rvo-alert-text"], children: [
            { element: "strong", when: { prop: "heading" }, text: "{{ heading }}" },
            { element: "div", text: "{{ children | safe }}" },
          ]},
          { when: { prop: "closable" }, element: "button", classes: ["utrecht-button--subtle"], children: [
            { element: "span", classes: ["rvo-icon-kruis"] },
          ]},
        ],
      },
    ],
  },
});
```

### Steps

1. Rewrite `implementations/implementation.ts` — `ElementNode` tree interface
2. Rewrite `core/src/generators/jinja2/index.ts` — recursive tree walker
3. Rewrite ALL `*.impl.ts` files using the tree API
4. Re-generate ALL templates — zero hand-tuning
5. Run all 681+ e2e tests to verify identical output

---

## Part B: Frontend Asset Build Pipeline (from jinja-roos)

### Problem

No CSS. `_get_component_assets()` returns only `tokens.css`. Visual test server uses hard-coded CDN links.

### Solution: Copy jinja-roos webpack pipeline

The jinja-roos-components project bundles all RVO CSS into the Python package via webpack:

```
npm packages (@nl-rvo/assets, design-tokens, component-library-css, css-button)
    ↓ webpack
Output: python/src/lord_of_the_components/static/lotc/dist/
├── lotc.js + lotc.css
└── @nl-rvo/
    ├── assets/ (fonts/, icons/, images/)
    ├── design-tokens/index.css
    ├── component-library-css/index.css
    └── css-button/index.css
    ↓
Python package includes static/ in distribution → self-contained, no CDN
```

### Steps

1. **package.json** — add npm deps: `@nl-rvo/assets`, `@nl-rvo/design-tokens`, `@nl-rvo/component-library-css`, `@nl-rvo/css-button`, `@utrecht/component-library-css`, webpack + loaders + plugins
2. **webpack.config.js** — copy from jinja-roos, adapt paths:
   - Entry: `fe_src/ts/lotc.ts`
   - Output: `python/src/lord_of_the_components/static/lotc/dist/`
   - HtmlWebpackDeployPlugin: copy @nl-rvo from node_modules
   - ReplaceInFileWebpackPlugin: rewrite icon CSS URLs
3. **fe_src/ts/lotc.ts** — minimal JS entry (component registry)
4. **fe_src/scss/lotc.scss** — imports reset-css + RVO button CSS
5. **Update page.html.j2** — auto-include CSS/JS links to bundled assets
6. **Update `_get_component_assets()`** — return all bundled CSS/JS file paths
7. **Update `__init__.py`** — add `get_static_files_path()` helper
8. **Update pyproject.toml** — ensure static/ included in distribution
9. **`npm run build`** — verify assets produced

### Key files to copy from jinja-roos

| jinja-roos file | Copy to |
|-----------------|---------|
| `package.json` (deps section) | `package.json` |
| `webpack.config.js` | `webpack.config.js` (adapt paths) |
| `fe_src/ts/roos.ts` | `fe_src/ts/lotc.ts` (simplify) |
| `fe_src/scss/roos.scss` | `fe_src/scss/lotc.scss` |
| `tsconfig.json` (fe_src) | `tsconfig.fe.json` |

---

## Part C: Re-generate & Verify

1. Re-generate ALL templates from tree-based implementations
2. Run all 681+ e2e tests — HTML output must match
3. Run visual tests with bundled CSS (no more CDN links in serve.py)
4. Remove all "IMPORTANT: restore from git" warnings from MEMORY.md

### Hello-world test

```python
from lord_of_the_components import setup_components
env = Environment(loader=FileSystemLoader('templates'))
setup_components(env)
# CSS bundled, components work — that's it
```

---

## Todolist

### Part A: Element Tree API

| Task | Description | Depends on |
|------|-------------|------------|
| T-A1 | ✅ Redesign `implementation.ts` — ElementNode tree API | - |
| T-A2 | Redesign Jinja2 generator — recursive tree walker | T-A1 |
| T-A3 | Rewrite `button.impl.ts` using tree API (reference pattern) | T-A1 |
| T-A4 | Rewrite all remaining `*.impl.ts` using tree API | T-A3 |
| T-A5 | Re-generate all templates — verify zero hand-tuning needed | T-A2, T-A4 |
| T-A6 | Run full test suite — all 681+ tests pass | T-A5 |

### Part B: Frontend Asset Build Pipeline

| Task | Description | Depends on |
|------|-------------|------------|
| T-B1 | Set up `package.json` with RVO npm deps + webpack | - |
| T-B2 | Create `webpack.config.js` (adapted from jinja-roos) | T-B1 |
| T-B3 | Create `fe_src/` — lotc.ts + lotc.scss entry points | T-B1 |
| T-B4 | Run npm build — verify assets in `static/lotc/dist/` | T-B2, T-B3 |
| T-B5 | Update `page.html.j2` — include bundled CSS/JS | T-B4 |
| T-B6 | Update `extension.py` — fix `_get_component_assets()` | T-B4 |
| T-B7 | Update `__init__.py` + `pyproject.toml` — static file helpers + packaging | T-B4 |
| T-B8 | Update `serve.py` — use bundled assets instead of CDN | T-B4 |
| T-B9 | Run visual tests — verify CSS loads from bundle | T-B8 |

---

## Critical Files

| File | Action | Purpose |
|------|--------|---------|
| `implementations/implementation.ts` | **Rewrite** | ElementNode tree API |
| `core/src/generators/jinja2/index.ts` | **Rewrite** | Recursive tree walker |
| `implementations/components/*.impl.ts` | **Rewrite all** | Tree-based implementations |
| `package.json` | **Update** | npm deps + webpack scripts |
| `webpack.config.js` | **Create** | Asset build pipeline |
| `fe_src/ts/lotc.ts` | **Create** | JS entry point |
| `fe_src/scss/lotc.scss` | **Create** | CSS entry point |
| `python/.../page.html.j2` | **Update** | Include bundled CSS/JS |
| `python/.../extension.py` | **Update** | Fix `_get_component_assets()` |
| `python/.../__init__.py` | **Update** | `get_static_files_path()` |

## Reference Files (from jinja-roos, to copy/adapt)

| File | Purpose |
|------|---------|
| `jinja-roos-components/package.json` | npm deps to copy |
| `jinja-roos-components/webpack.config.js` | Webpack config to adapt |
| `jinja-roos-components/fe_src/` | Frontend source structure |
| `jinja-roos-components/src/.../static/roos/dist/` | Output structure |