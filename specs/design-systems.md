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

## Roadmap (agreed, not yet done)

- **Decouple implementations into separate poetry packages.** The component
  *system* (parser/extension/runtime/definitions + the system layer) is one
  package; each design system (`lotc-rvo`, `lotc-nldd`) is an independently
  installed package that registers itself with the core — the core must not
  import `themes.<id>` directly. Discovery via entry points. (Its own phase.)
- **Per-tag `theme` override.** Once a page declares availability, a tag may carry
  `theme="rvo|nldd|system"`; the engine resolves against the declared systems and
  falls back to the system layer. For now the practical use is just the per-page
  default (e.g. layout resolves to the system layer).
- **Debug diagnostics.** With debug on, give jinja-roos-quality messages for wrong
  attributes/values, with suggestions. (Next up.)
