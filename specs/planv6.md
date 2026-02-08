# Plan v6: Lord of the Components -- Fix CSS Theming & Cleanup

## Context

Plans v1-v5 are complete. The project has 21 components, 767 e2e tests, 13 visual tests, a recursive Element Tree API, and webpack-bundled RVO/Utrecht CSS. However, **all components render without any styling** because of a critical theme class mismatch, plus legacy file debris.

### Root Cause: Wrong theme class on `<body>`

The design tokens CSS (`@nl-rvo/design-tokens/index.css`) defines ALL CSS custom properties inside `.rvo-theme { }`. Every component's colors, spacing, fonts, etc. depend on these tokens. But `page.html.j2` generated `class="theme-rvo"` instead of `class="rvo-theme"`:

| Source | Body class | Works? |
|--------|-----------|--------|
| jinja-roos (reference) | `class="rvo-theme"` | Yes |
| LOTC page.html.j2 (before fix) | `class="theme-rvo"` | **No** |
| Design tokens CSS expects | `.rvo-theme { ... }` | -- |

**Result:** None of the ~500 CSS custom properties activated, so every component rendered unstyled.

**Goal:** Fix the theme class, fix the visual test server, clean up legacy debris, and update documentation.

**Pipeline (unchanged):**
```
definitions/*.def.ts → implementations/*.impl.ts → Jinja2 Generator → .html.j2 templates
                                                          ↓
                                               Python Extension (extension.py)
                                                          ↓
                                                     Final HTML
```

---

## Part A: Fix Theme Class (CRITICAL)

### T-A0: Fix body class in `page.html.j2` ✅🔍

**File:** `python/src/lord_of_the_components/templates/components/page.html.j2`

Changed `'theme-' ~ theme` to `theme ~ '-theme'` so that `theme="rvo"` produces `class="rvo-theme"`, matching what the design tokens CSS expects.

### T-A0b: Add `rvo-theme` class in visual test server ✅🔍

**File:** `tests/visual/serve.py`

The visual test server injects CSS but never added the `rvo-theme` class to the body. Added body class injection so visual tests also render with proper theming.

---

## Part B: Fix Getting-Started Example

### T-A1: Add static file serving to `app.py` ✅🔍

**File:** `examples/getting-started/app.py`

Add a `/static/` route handler following the pattern from `tests/visual/serve.py:105-120`. Reuse `get_static_files_path()` from `lord_of_the_components` (`python/src/lord_of_the_components/__init__.py:53`).

Changes:
- Import `mimetypes` and `get_static_files_path`
- Add `STATIC_DIR = Path(get_static_files_path())` constant
- In `Handler.do_GET()`: if `path.startswith("static/")`, call `_serve_static(path)`
- Add `_serve_static()` method (copy pattern from `serve.py`)

**Verify:** Run `python examples/getting-started/app.py --serve`, open `http://localhost:8080`, check browser devtools network tab for 200 on `/static/lotc/dist/lotc.css`.

### T-A2: Remove CDN links from example template ✅🔍

**File:** `examples/getting-started/templates/index.html`

Remove the `head` prop with CDN links from `<c-page>`. The bundled CSS is already injected by `page.html.j2:40-52` automatically. The CDN links are redundant and potentially conflicting.

```
Before: <c-page title="..." theme="rvo" head='<link ...CDN...>'>
After:  <c-page title="My First LOTC Page" theme="rvo">
```

### T-A3: Expand example to showcase all component categories ✅🔍

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

## Part C: Remove Legacy Files

All deletions in one commit. Total: ~170 files.

### T-B1: Remove KDL definitions ✅🔍

**Delete:** All `.kdl` files in `definitions/components/` subdirectories (90 files across 9 subdirectories: `actions/`, `data-display/`, `feedback/`, `inputs/`, `layout/`, `navigation/`, `overlay/`, `typography/`, `utility/`) + `definitions/props.kdl`.

These are superseded by the flat `.def.ts` files in `definitions/components/` (e.g., `button.def.ts`, `heading.def.ts`).

### T-B2: Remove `packages/` directory ✅🔍

**Delete:** Entire `packages/` directory (~60 `.rig` + `.kdl` files). These contain the abandoned RigScript implementations from v1/v2, replaced by `.impl.ts` TypeScript implementations.

### T-B3: Remove `tokens/` and `themes/` directories ✅🔍

**Delete:**
- `tokens/` (3 KDL files: colors.kdl, spacing.kdl, schema.kdl)
- `themes/` (theme.kdl + unused page.html.j2)

Replaced by webpack-bundled RVO/Utrecht CSS in `python/src/lord_of_the_components/static/lotc/dist/`.

### T-B4: Remove `docs/`, `lotc.config.kdl`, `specs_old/` ✅🔍

**Delete:**
- `docs/` (11 markdown files describing old RigScript/KDL architecture)
- `lotc.config.kdl` (legacy root config for KDL build pipeline)
- `specs_old/` (plans v1-v3 + implementation-spec, superseded by `specs/planv4.md` and `specs/planv5.md`)

### T-B5: Remove legacy templates ✅🔍

**Delete** from `python/src/lord_of_the_components/templates/components/`:
- `layout.html.j2` -- old `<c-layout>` template, not in registry
- `stack.html.j2` -- old `<c-stack>` template, not in registry
- `page.html.j2.webpack` -- webpack build source template, not needed at runtime

### T-B6: Remove `dist/` at project root ✅🔍

**Delete from disk:** `dist/` directory (old build output: tokens.css, tokens.json, old registry.json). Already in `.gitignore`, so no git tracking changes needed.

---

## Part D: Update Documentation

### T-C1: Rewrite `README.md` ✅🔍

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

1. **Commit 1:** Part A -- Fix theme class in page.html.j2 + visual test server
2. **Commit 2:** Parts B-D -- Getting-started example, legacy cleanup, README (already done in previous sessions)

BUILD_COMPLETE_MARKER
VERIFY_COMPLETE_MARKER

## Enhancements

### E-1: Add TypeScript build artifacts to `.gitignore` ✅

Added gitignore rules for ~120 TypeScript compilation outputs (`.js`, `.d.ts`, `.js.map`, `.d.ts.map`) in `definitions/`, `implementations/`, `core/src/generators/jinja2/`, and `tests/visual/`. Also ignores the duplicate `tests/visual/snapshots/components.spec.js/` snapshot directory. Prevents accidental commits of build artifacts while keeping all source `.ts` files tracked.

### E-2: Add unit tests for `registry.py` ✅

Added `python/tests/test_registry.py` with 31 tests covering `ComponentRegistry`, `ComponentDefinition`, `AttributeDefinition`, and `SlotDefinition`. Previously had zero test coverage despite being critical infrastructure. Tests cover:
- All `AttributeType` enum values and the enum-without-values validation
- `ComponentDefinition.get_attribute()` / `has_attribute()` lookup
- Default registry (built-in components loaded on init)
- JSON loading: array format, dict format, `props` key fallback, `enumValues` camelCase fallback
- Edge cases: unknown attribute types fall back to STRING, empty component lists, nameless components skipped, `dependsOn` mapping
- Error paths: missing file raises `FileNotFoundError`, malformed JSON raises `JSONDecodeError`
- Integration smoke test against the real `registry.json` (≥20 components load correctly)

Total test count: 767 → 798.

### E-3: Fix TypeScript build by excluding `generate-showcase.ts` from tsc ✅

The `tsc` build in `core/` was broken with 10 errors because `generate-showcase.ts` imports from `definitions/` and `implementations/` (outside `rootDir`). Added it to the tsconfig `exclude` list alongside `generate-all.ts` — both files are run via `npx tsx`, not through the compiled build. Build now passes cleanly; generator and all 798 tests unaffected.

### E-4: Add unit tests for `validation.py` ✅

Added `python/tests/test_validation.py` with 91 tests covering `DataValidator`, all three schema types (`ItemSchema`, `ColumnSchema`, `StepSchema`), convenience functions, expression validation, and `validate_dynamic_attribute`. Previously only tested indirectly via `test_errors.py` (error message quality). Tests cover:
- `DataValidator.validate_items()`: default schema, custom label/required keys, nested children (valid, invalid, deeply nested, non-list), empty list, custom path, multiple errors with correct indices
- `DataValidator.validate_columns()`: dict format, string shorthand, custom schema, mixed valid/invalid
- `DataValidator.validate_steps()`: valid states, custom states, custom label/state keys, optional state, error paths
- `DataValidator.validate_type()`: single type, tuple of types, None, bool-as-int, custom path
- Convenience functions: all valid sizes/colors, custom key parameters
- Expression validation: valid expressions (attribute access, function calls, comparisons, list/dict literals, ternary), empty/whitespace/None, Jinja delimiter/control tag rejection, bracket balance (unclosed, unmatched, mismatched, strings), syntax error suggestions (&&→and, ||→or, !→not, =→==)
- `validate_dynamic_attribute()`: colon prefix handling, error expression formatting
- Validator reuse: errors reset between calls across different methods

Total test count: 798 → 889.

### E-5: Add unit tests for `extension.py` ✅

Added `python/tests/test_extension_unit.py` with 105 tests covering all helper functions and public API of `extension.py`. Previously only tested indirectly via integration tests (`test_extension.py` — 20 error/location tests). Tests cover:
- `_find_tag_location()`: single/multi-line, occurrences, case-insensitive, deep indentation, edge cases (empty source, not found, beyond matches)
- `_find_attribute_location()`: same-line, multi-line, colon/at-prefixed attrs, occurrence tracking, fallback search, not-found paths
- `_is_generic_html_attribute()`: data-*, aria-*, hx-* prefixes, utility attrs (text-style, margin, padding), non-generic attrs
- `_extract_slots()`: no slots, default content only, named slots, multiple named slots, mixed slots+content, HTML in slots, template-without-slot
- `_build_include()`: string/dynamic/boolean/event attributes, content capture vars, named slot vars, escaped quotes, template paths
- `_generate_id()`: 8-char hex output, determinism, sequential uniqueness, template-dependent uniqueness
- `_restore_jinja_tags()`: no placeholders, single/multiple/nested placeholders, HTML entity unescaping, max-iteration safety
- `_calculate_nesting_depth()`: depth 0/1/2, non-component wrappers not counted
- `_is_component_tag()`: valid tags, regular HTML, NavigableString, None, non-Tag objects
- `_get_component_assets()`: default/custom prefix, htmx on/off, user CSS/JS files, RVO bundle coverage
- `setup_components()`: extension registration, theme/htmx/validate_data globals, return value, custom registry, searchpath append, no-loader safety
- Preprocess edge cases: no-component early return, empty source, generic/utility/id/class attrs, multiple components, state reset between calls
- `SourceLocation` and `ComponentError` edge cases

Total test count: 889 → 994.

### E-6: Tighten mypy configuration for stricter type checking ✅

Enhanced `python/pyproject.toml` mypy settings with 7 additional strict flags: `disallow_untyped_defs`, `check_untyped_defs`, `warn_redundant_casts`, `warn_unused_ignores`, `warn_no_return`, `warn_unreachable`, `strict_equality`. All 4 source files pass cleanly.

Fixed one `warn-unreachable` false positive in `extension.py:398-401` where BeautifulSoup's type stubs declare `tag.attrs` values as `str | list[str]` but at runtime can also return `None` for valueless HTML attributes. Restructured the None check into the else branch to satisfy mypy while preserving runtime safety.

### E-7: Add pytest coverage configuration with 95% enforcement ✅

Added `[tool.coverage.run]`, `[tool.coverage.report]`, and pytest `addopts` to `python/pyproject.toml` so that every `pytest` run automatically collects coverage, reports missing lines, and fails if coverage drops below 95%. Current coverage: 97.58% (660 statements, 16 missed). This protects the investment in the 994 existing tests by catching coverage regressions early. Configuration:
- `addopts`: `--cov=lord_of_the_components --cov-report=term-missing --cov-fail-under=95`
- `source`: `lord_of_the_components` (excludes test files from coverage)
- `exclude_lines`: standard pragmas (`no cover`, `__main__`, `TYPE_CHECKING`)

### E-8: Raise test coverage from 97.58% to 99.39% ✅

Added 18 tests covering previously untested code paths: `test_init.py` (13 tests) and extension edge cases (5 tests). Coverage improved from 97.58% (16 missed lines) to 99.39% (4 missed lines). Tests cover:
- `__init__.py`: `get_static_files_path()` and `get_templates_path()` path helpers (previously 64% → 100%), plus `__version__` and `__all__` export verification
- `extension.py`: Generic exception wrapping as RuntimeError with cause chain preservation (lines 188-190), slot name returned as list by BeautifulSoup (line 363), orphaned placeholder detection (lines 570-573), non-list searchpath fallback in `setup_components()` (lines 626-627)
- Remaining 4 uncovered lines are near-impossible defensive guards: empty component list early return (line 205), circular dependency detection (line 274), and `=` to `==` suggestion parse failure (validation.py lines 527-528)

Total test count: 994 → 1012.
