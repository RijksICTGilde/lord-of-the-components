# lotc-bgnldd

Begane Grond's app-level components as a **mix-and-match theme layer** on top of
NLDD, for [Lord of the Components](../../README.md).

bg.rijks.app is NLDD web components *plus* its own app components — a sidebar
nav, metric cards, platform-layer rows, an activity feed, shortcut cards, section
headers — that aren't in NLDD proper. Rather than pollute NLDD, BGNLDD ships them
as a separate design system that composes with NLDD.

## Usage

```python
setup_components(env, design_systems=["nldd", "bgnldd"])
```

NLDD renders the primitives (`c-card`, `c-button`, `c-icon`, …); BGNLDD renders
its own components, each routed to its owner theme automatically:

```html
<c-metric icon="apartment-building" value="5" label="Datacenters" sub="4 operationeel" href="/fysiek"/>
<c-sidenav>
  <c-sidenav-item icon="house" label="Overzicht" href="/" active/>
  <c-sidenav-group label="Bouwen & draaien"/>
  <c-sidenav-item icon="cylinder-split" label="Infra-diensten" href="/infra"/>
</c-sidenav>
<c-layer icon="rectangle-stack" title="Applicaties" count="123 apps" sub="…">
  <c-tag type="default">Paspoortaanvraag</c-tag>
</c-layer>
<c-section-head title="Recente activiteit" icon="timer"/>
<c-activity>
  <c-activity-item icon="plus" actor="Anne Schuth" action="infra afgenomen" res="llm-gilde-prod" at="di 10:02"/>
</c-activity>
```

## Components

`c-metric`, `c-sidenav` (+ `c-sidenav-group`, `c-sidenav-item`), `c-layer`,
`c-section-head`, `c-activity` (+ `c-activity-item`), `c-shortcut`.

## How it works

- **Contracts**: TS definitions in `themes/bgnldd/definitions/` → the generator
  emits this package's `registry.json` fragment (core's registry is untouched).
  `setup_components` merges the fragment, tagging each component's owner theme.
- **Rendering**: hand-authored Jinja templates in `templates/components/`. They
  compose NLDD primitives — e.g. icons call NLDD's icon renderer
  (`_lotc_nldd_icon`), so BGNLDD reuses NLDD's semantic icon mapping. Requires
  `nldd` to also be declared.
- **CSS**: `static/lotc/bgnldd/bg-components.css` (the `bg-*` classes,
  derived from the live site's `rp-*` styles, using NLDD design tokens). A page
  loads it via `{{ get_design_system_assets() }}` / `design-systems="nldd bgnldd"`
  on `c-page`.
