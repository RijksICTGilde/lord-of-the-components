# Design systems: page-level availability + the system layer

## Model

A page is built from two kinds of components:

- **System layer** — LOTC's own, theme-agnostic implementations: layout
  (`app-shell`, `columns`, `stack`, `auto-grid`) and basic HTML (`div`, `span`,
  `small`, `b`, `i`, `code`, `blockquote`, `hr`). These render identically under
  every theme and need **no design system loaded**. They are *always present*.
  Marked `system: true` in each definition (and in `registry.json`).

- **Design-system layer** — components that require an active design system
  (`button`, `card`, `table`, form controls, `tag`, `icon`, …). RVO and NLDD are
  design systems; each ships its own renderers.

There is **no implicit default design system** — RVO is not special. A page
declares which design systems it uses; only those are loaded ("we never load a
whole theme we don't use"). Using a design-system component with none loaded is a
loud error with a fix suggestion.

## API

```python
setup_components(env, design_systems=["rvo"])   # load only RVO
setup_components(env, design_systems=["rvo", "nldd"])  # both available; rvo primary
setup_components(env)                              # system layer only
setup_components(env, theme="rvo")                 # legacy single-system alias
```

- The **first** declared system is the primary/active one for design-system
  components.
- `theme=` is the deprecated single-system alias, kept working.
- `default` / `system` name the always-present system layer, not a design system.
- The engine validates each declared id against the known design systems and
  raises with a `get_close_matches` suggestion on a typo.

## Check

When a component is emitted, the engine checks: a non-`system` component with no
active design system → `ComponentError("'c-button' needs a design system, but
none is loaded. Declare one at setup, e.g. setup_components(env,
design_systems=['rvo']).")`. System components skip the check and always render.

## Discovery (done — Stage 1 of the package split)

Core no longer hard-codes the set of design systems. It discovers whatever is
installed via the entry-point group `lord_of_the_components.design_systems`; each
system exposes a `DesignSystem` descriptor (`design_system.py`):

```python
@dataclass(frozen=True)
class DesignSystem:
    name: str                       # "rvo"
    renderers_module: str           # import path of the Python renderers
    templates_path: Path | None     # optional jinja templates dir -> loader path
    static_path: Path | None        # optional CSS/assets dir
```

`setup_components(design_systems=["rvo"])` resolves each id against the discovered
descriptors (typo → `get_close_matches` suggestion listing the *installed*
systems), registers only the declared systems' renderers, and appends any
`templates_path` to the loader. `KNOWN_THEMES` is gone; core imports no
`themes.<id>` by name.

The in-repo rvo/nldd still live under `themes/` for now but are wired exactly
like external packages — each is registered via an entry point in the core
`pyproject.toml`. Extracting them physically is Stage 2 and changes nothing about
discovery.

## Physical packages (done — Stage 2)

The design systems are now separate installable packages under `packages/`:

```
packages/lotc-rvo/    src/lotc_rvo/{__init__ (DESIGN_SYSTEM), renderers.py, templates/components/*.j2}
packages/lotc-nldd/   src/lotc_nldd/{__init__ (DESIGN_SYSTEM), renderers.py}
```

- Each has its own `pyproject.toml`, depends on `lord-of-the-components`, and
  declares its own `lord_of_the_components.design_systems` entry point. Core has
  **no** entry points and no `themes/` directory.
- **What moved out of core:** the RVO/NLDD Python renderers, and the RVO-specific
  jinja templates (the non-`system`, jinja-backend components: card, alert, grid,
  menu, header, …). `lotc-rvo` sets `templates_path`; `setup_components` appends it
  to the loader, so those templates resolve at render time.
- **What stayed in core:** the engine, the full `registry.json` (component
  contracts are theme-agnostic), the system-layer templates, the python-backend
  fallback templates, the shared macros (`_generic_attributes.j2`,
  `_attribute_mixin.j2`), and `layout.css`.
- **Generation:** `generate-all.ts` routes each template to core (system or
  python-backend) or `lotc-rvo` (everything else) and writes the renderers into
  the package dirs.
- **Dev/test:** the theme packages are editable dev-dependencies of core (via
  `[tool.uv.sources]`), so `uv sync --extra dev` installs all three; core does
  **not** depend on them at runtime.

Adding a third design system is now: a new package with a `DESIGN_SYSTEM` entry
point — no change to core.

### CSS bundles (done)

Each system's webpack CSS/JS bundle now emits **into its own package** and ships
with it, so `lotc-rvo` / `lotc-nldd` are fully self-contained (Python + assets):

- `webpack.config.cjs` → `packages/lotc-rvo/src/lotc_rvo/static/lotc/dist`
- `webpack.nldd.cjs` → `packages/lotc-nldd/src/lotc_nldd/static/lotc/nldd/dist`
- Only `layout.css` (the system layer) stays in core `static/`.

The URL space is unchanged (`/static/lotc/dist/…`, `/static/lotc/nldd/dist/…`), so
`<c-page>` links and everything downstream stay byte-stable — only the physical
location moved. Each `DesignSystem` exposes `static_path`; a host serves the
`/static/lotc/…` URL space from core plus every installed system's `static_path`
(see `tests/visual/serve.py`, which resolves across those roots). The built
bundles are gitignored per package, exactly as core's were.

## Choosing own vs theme-specific layout (by tag, not by attribute)

The one place "own vs theme" genuinely comes up is layout, and it is selected by
**which tag you use** — no per-element attribute needed:

- **Uniform across themes** (LOTC's own system layer): `c-columns`, `c-stack`,
  `c-auto-grid`, `c-app-shell`. Always render, identical under every theme.
- **Theme-specific**: `c-grid`, `c-layout-row`, `c-layout-column`,
  `c-max-width-layout`, `c-layout-flow` — use the active design system's classes.

## Per-tag `theme` override — deferred (YAGNI)

Considered and deliberately not built. With the model above it adds little:

- For layout it is redundant — own vs theme is already tag-distinguished.
- The only new capability would be forcing a *different* design system on a single
  multi-theme python component (`<c-button theme="nldd">` on an rvo page). That
  needs both systems loaded, does not work for jinja-backend components (their
  templates are not theme-namespaced in the loader), and is a niche "mix design
  systems on one page" use. Cost outweighs value for now.

Revisit only if a concrete need to mix design systems within one page appears.

## Roadmap

The package split is complete: core + two self-contained design-system packages
(Python renderers, templates, and CSS each), discovered via entry points. Adding a
third design system is a new package with a `DESIGN_SYSTEM` entry point — no core
change.
- **Per-tag `theme` override.** Once a page declares availability, a tag may carry
  `theme="rvo|nldd|system"`; the engine resolves against the declared systems and
  falls back to the system layer. For now the practical use is just the per-page
  default (e.g. layout resolves to the system layer).

## Debug diagnostics (done)

`setup_components(env, design_systems=["rvo"], debug=True)` turns on extra
author-facing diagnostics, jinja-roos style:

- **Unknown attribute** (always on, debug or not): `Unknown attribute 'typ' on
  component 'c-button'. Did you mean 'type'?`
- **Invalid enum value** (debug only): a literal value outside an enum
  attribute's allowed set → `Invalid value 'prmary' for attribute 'type' on
  'c-button'. Allowed: primary, secondary, …. Did you mean 'primary'?`

Value checks are debug-gated so production stays lenient/fast; dynamic
(`{{ … }}`) values are skipped (not statically checkable). Suggestions come from
`difflib.get_close_matches` over the enum set.
