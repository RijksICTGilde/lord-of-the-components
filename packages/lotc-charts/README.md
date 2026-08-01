# lotc-charts

Opt-in **capability set** of chart components for
[Lord of the Components](../../README.md) — a loose Chart.js implementation,
NLDD-styled. Charts aren't base elements, so they live in their own activatable
set (like `lotc-layout`).

## Activate

```python
setup_components(env, design_systems=["lotc-layout", "nldd", "lotc-charts"])
```

Only then do `<c-line-chart>` / `<c-gauge>` resolve. The set ships its component
defs, its templates, its CSS, and loads Chart.js (via the page's `<head>`).

## Components

| Component | Purpose |
| --- | --- |
| `<c-line-chart :data="…" id="net" height="220px" legend title="…">` | Time-series line chart (CPU/memory/network…). `:data` is a Chart.js `{labels, datasets}` object. |
| `<c-gauge value="72" label="CPU" sublabel="2/4 cores" id="cpu" color="#154273">` | Radial utilization gauge (Chart.js doughnut) with a centred value. |

```html
<c-line-chart id="net" title="Netwerk (KB/s)" height="220px" legend
  :data="{'labels': [...], 'datasets': [{'label':'Inbound','data':[...],'borderColor':'#154273','fill':true}]}"/>

<c-gauge value="72" label="CPU" sublabel="2/4 cores" id="cpu"/>
```

Each chart needs a unique `id` (the canvas id is derived as `<id>-canvas`).
Chart.js draws client-side; the component provides the canvas, the NLDD-styled
options, and a responsive container.
