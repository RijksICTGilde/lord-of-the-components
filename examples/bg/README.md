# Begane Grond page templates

Readable `<c-*>` templates for building bg.rijks.app-style screens. Start here when
you need to recreate or build a Begane Grond screen — the shell is written out once,
each screen just fills its own content.

## Files

- **`bg-base.html.j2`** — the page skeleton: the demo status bar, the header with its
  utility menu, and the **full platform navigation** (extracted verbatim from the live
  site). It exposes two blocks: `title` and `main`.
- **`artefacten.html.j2`** — a resource-listing screen (the artifact register). Shows
  the **listing-card pattern**: `c-card` + a thin app-CSS layer (`.art-*`) wrapping
  `c-heading` / `c-tag` / `c-icon`.
- **`overzicht.html.j2`** — a dashboard screen. Shows how small a screen is once the
  shell is shared.

## Build a new screen

```jinja
{% extends "bg-base.html.j2" %}
{% block title %}Mijn scherm · Begane Grond{% endblock %}
{% block main %}
  <c-stack gap="1.25rem">
    …your content, in <c-*> markup…
  </c-stack>
{% endblock %}
```

Then activate the design systems and render it:

```python
setup_components(env, design_systems=["lotc-layout", "nldd"])
env.get_template("mijn-scherm.html.j2").render()
```

Mark the current page in the sidebar by adding `active` to its `<c-sidenav-item>`.
(In a real app you'd render the sidebar from data and pass the active path, rather
than editing the base.)

## Which components to reach for

- **Shell / layout**: `c-page`, `c-app-shell`, `c-status-bar`, `c-header`,
  `c-menu type="bar"` (utility menu), `c-sidenav` / `c-sidenav-group` /
  `c-sidenav-item`, `c-breadcrumbs`, `c-stack`, `c-columns`, `c-auto-grid`.
- **Content**: `c-heading`, `c-p`, `c-card`, `c-tag`, `c-icon`, `c-button`, `c-link`.
- **bg app patterns (already core)**: `c-metric` (stat card), `c-layer`,
  `c-section-head`, `c-activity` / `c-activity-item`, `c-chip`, `c-catalog-card`,
  `c-filter-bar` / `c-filter-select`, `c-site-footer`.
- **App-specific cards** (like the artifact card here): compose `c-card` + a small
  app-CSS layer, as shown in `artefacten.html.j2`.

See the full component catalog + rules in the generated `AUTHORING.md` at the repo root.
