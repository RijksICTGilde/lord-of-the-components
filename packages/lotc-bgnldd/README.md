# lotc-bgnldd

An **implementation-only** design-system layer that renders app/dashboard
components on top of NLDD, for [Lord of the Components](../../README.md).

bg.rijks.app is NLDD web components *plus* app components — a sidebar nav, metric
cards, platform-layer rows, an activity feed, a profile/identity card, catalog
cards, a filter bar, a page footer — that aren't in NLDD proper. Those components
are defined **globally** in core (like `c-button` or `c-card`); BGNLDD just
provides their NLDD-flavoured implementations, so you can drop them into any
NLDD page.

## Usage

```python
setup_components(env, design_systems=["nldd", "bgnldd"])
```

NLDD renders the primitives (`c-card`, `c-button`, `c-icon`, …); BGNLDD renders
the app components, each routed to its owner theme automatically:

```html
<c-metric icon="apartment-building" value="5" label="Datacenters" sub="4 operationeel" href="/fysiek"/>
<c-sidenav>
  <c-sidenav-item icon="house" label="Overzicht" href="/" active/>
  <c-sidenav-group label="Bouwen & draaien"/>
  <c-sidenav-item icon="cylinder-split" label="Infra-diensten" href="/infra"/>
</c-sidenav>
<c-catalog-card icon="rectangle-stack" title="Paspoortaanvraag" subtitle="Burgerzaken"
                status="ok" status-type="success" maturity="goud" open-label="Open" href="/apps/x">
  <c-tag type="default">service</c-tag><c-tag type="info">Rust</c-tag>
</c-catalog-card>
```

## Components

`c-metric`, `c-sidenav` (+ `c-sidenav-group`, `c-sidenav-item`), `c-layer`,
`c-section-head`, `c-activity` (+ `c-activity-item`), `c-shortcut`, `c-chip`,
`c-identity`, `c-action`, `c-detail-list` (+ `c-detail-item`), `c-section-link`,
`c-notification` (+ `c-notification-item`), `c-catalog-card`, `c-filter-bar`
(+ `c-filter-select`), `c-site-footer`.

## How it works

- **Contracts**: the definitions are **global**, in core's
  `definitions/components/app-components.def.ts` — BGNLDD ships no registry
  fragment of its own.
- **Rendering**: hand-authored Jinja templates in `templates/components/`. They
  compose NLDD primitives — icons call NLDD's icon renderer (`_lotc_nldd_icon`),
  so BGNLDD reuses NLDD's semantic icon mapping. Requires `nldd` to also be
  declared.
- **CSS**: the structural styles (`lotc-*` classes, using
  `var(--semantics-*, fallback)` so they work under any theme) live in **core**,
  in `app-components.css` — loaded on every page. BGNLDD is pure implementation:
  no CSS bundle, no static assets of its own.

The same app components also have RVO implementations (in `lotc-rvo`), proving
they are design-system-agnostic: the same `<c-metric>` / `<c-catalog-card>`
markup renders under RVO or NLDD.
