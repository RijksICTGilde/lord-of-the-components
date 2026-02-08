# Plan v6: Lord of the Components -- Cleanup & Working Usage Example

## Context

Plans v1-v5 are complete. The project has 21 components, 767 e2e tests, 13 visual tests, a recursive Element Tree API, and webpack-bundled RVO/Utrecht CSS. However, two problems remain:

1. **The getting-started example doesn't work** -- `examples/getting-started/app.py` has no route for `/static/` files, so when `<c-page>` renders `<link href="/static/lotc/dist/lotc.css">`, the CSS never loads. Result: unstyled HTML. The template also has redundant CDN links in its `head` prop.
2. **~170 legacy files** from abandoned architectures (KDL definitions, RigScript implementations, old docs, tokens, themes) clutter the repo and confuse contributors.

**Goal:** Make `<c-page>` produce a fully styled RVO page out of the box, clean up all legacy debris, and update documentation to reflect the current architecture.

**Pipeline (unchanged):**
```
definitions/*.def.ts → implementations/*.impl.ts → Jinja2 Generator → .html.j2 templates
                                                          ↓
                                               Python Extension (extension.py)
                                                          ↓
                                                     Final HTML
```

---

## Part A: Fix Getting-Started Example

### T-A1: Add static file serving to `app.py` ✅

**File:** `examples/getting-started/app.py`

Add a `/static/` route handler following the pattern from `tests/visual/serve.py:105-120`. Reuse `get_static_files_path()` from `lord_of_the_components` (`python/src/lord_of_the_components/__init__.py:53`).

Changes:
- Import `mimetypes` and `get_static_files_path`
- Add `STATIC_DIR = Path(get_static_files_path())` constant
- In `Handler.do_GET()`: if `path.startswith("static/")`, call `_serve_static(path)`
- Add `_serve_static()` method (copy pattern from `serve.py`)

**Verify:** Run `python examples/getting-started/app.py --serve`, open `http://localhost:8080`, check browser devtools network tab for 200 on `/static/lotc/dist/lotc.css`.

### T-A2: Remove CDN links from example template ✅

**File:** `examples/getting-started/templates/index.html`

Remove the `head` prop with CDN links from `<c-page>`. The bundled CSS is already injected by `page.html.j2:40-52` automatically. The CDN links are redundant and potentially conflicting.

```
Before: <c-page title="..." theme="rvo" head='<link ...CDN...>'>
After:  <c-page title="My First LOTC Page" theme="rvo">
```

### T-A3: Expand example to showcase all component categories ✅

**File:** `examples/getting-started/templates/index.html`

Expand to demonstrate all 21 components with proper sections:
- **Page structure:** `<c-page>`, `<c-header>`, `<c-hero>`, `<c-footer>`
- **Layout:** `<c-layout-flow>`, `<c-layout-row>`, `<c-layout-column>`, `<c-max-width-layout>`, `<c-grid>`
- **Typography:** `<c-heading>`, `<c-paragraph>`, `<c-link>`, `<c-label>`, `<c-strong>`, `<c-em>`
- **Actions:** `<c-button>` variants (primary, secondary, warning, with icons)
- **Data display:** `<c-card>`, `<c-data-list>`, `<c-icon>`
- **Navigation:** `<c-menu>` + `<c-menu-item>`, `<c-breadcrumbs>` + `<c-breadcrumbs-item>`
- **Feedback:** `<c-alert>` variants (info, warning, error, success)

**Verify:** Run the example server and visually confirm all component categories render with proper RVO styling.

---

## Part B: Remove Legacy Files

All deletions in one commit. Total: ~170 files.

### T-B1: Remove KDL definitions ✅

**Delete:** All `.kdl` files in `definitions/components/` subdirectories (90 files across 9 subdirectories: `actions/`, `data-display/`, `feedback/`, `inputs/`, `layout/`, `navigation/`, `overlay/`, `typography/`, `utility/`) + `definitions/props.kdl`.

These are superseded by the flat `.def.ts` files in `definitions/components/` (e.g., `button.def.ts`, `heading.def.ts`).

### T-B2: Remove `packages/` directory ✅

**Delete:** Entire `packages/` directory (~60 `.rig` + `.kdl` files). These contain the abandoned RigScript implementations from v1/v2, replaced by `.impl.ts` TypeScript implementations.

### T-B3: Remove `tokens/` and `themes/` directories ✅

**Delete:**
- `tokens/` (3 KDL files: colors.kdl, spacing.kdl, schema.kdl)
- `themes/` (theme.kdl + unused page.html.j2)

Replaced by webpack-bundled RVO/Utrecht CSS in `python/src/lord_of_the_components/static/lotc/dist/`.

### T-B4: Remove `docs/`, `lotc.config.kdl`, `specs_old/` ✅

**Delete:**
- `docs/` (11 markdown files describing old RigScript/KDL architecture)
- `lotc.config.kdl` (legacy root config for KDL build pipeline)
- `specs_old/` (plans v1-v3 + implementation-spec, superseded by `specs/planv4.md` and `specs/planv5.md`)

### T-B5: Remove legacy templates ✅

**Delete** from `python/src/lord_of_the_components/templates/components/`:
- `layout.html.j2` -- old `<c-layout>` template, not in registry
- `stack.html.j2` -- old `<c-stack>` template, not in registry
- `page.html.j2.webpack` -- webpack build source template, not needed at runtime

### T-B6: Remove `dist/` at project root ✅

**Delete from disk:** `dist/` directory (old build output: tokens.css, tokens.json, old registry.json). Already in `.gitignore`, so no git tracking changes needed.

---

## Part C: Update Documentation

### T-C1: Rewrite `README.md`

**File:** `README.md`

Current README describes the old KDL/RigScript/token architecture extensively. Rewrite to cover:
- What LOTC is (component system with `<c-*>` tags for Jinja2)
- Quick start (install, Jinja2 setup, run getting-started example)
- Current project structure (`definitions/`, `implementations/`, `python/`, `core/`)
- Full component list (all 21 components)
- How to add a new component (create `.def.ts`, create `.impl.ts`, run generator, add tests)
- Frontend assets (webpack builds RVO CSS, `page.html.j2` auto-injects)

Remove all references to: RigScript, KDL, tokens, themes, old CLI commands (`lotc build`, `lotc validate`, `lotc docs`).

---

## Verification

### V-1: Run e2e tests
```bash
cd python && pytest
```
All 767+ tests must pass (unaffected by legacy file deletions).

### V-2: Run visual tests
```bash
npx playwright test --config tests/visual/playwright.config.ts
```
All 13 visual tests must pass.

### V-3: Verify getting-started example end-to-end
```bash
cd examples/getting-started && python app.py --serve
```
Open `http://localhost:8080` and confirm:
- CSS loads (network tab shows 200 on `/static/lotc/dist/lotc.css` and related files)
- Components have proper RVO styling (correct fonts, colors, icons, spacing)
- All 21 component categories render correctly
- No JavaScript console errors

---

## Scope Exclusions

- **`core/src/rigscript/`, `core/src/parser/`, `core/src/loader/`** -- Legacy TypeScript modules wired into `core/src/cli/index.ts` and `core/src/build.ts`. Removing them requires refactoring the CLI build system. Deferred to a future plan.
- **Visual test fixtures** -- Intentionally use plain HTML with `serve.py` CSS injection rather than `<c-page>`. This isolates component-level testing from page template correctness. No change needed.
- **New components** -- Adding more components beyond the current 21 is out of scope for this cleanup/fix plan.

---

## Commit Strategy

1. **Commit 1:** Part A -- Fix getting-started example (static serving + expanded showcase)
2. **Commit 2:** Part B -- Remove all legacy files (single big deletion commit)
3. **Commit 3:** Part C -- Rewrite README + create planv6.md