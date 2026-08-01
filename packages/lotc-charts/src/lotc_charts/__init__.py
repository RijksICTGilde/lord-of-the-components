"""lotc-charts — an opt-in CAPABILITY SET of chart components.

Charts aren't base elements, so they live in their own activatable set (like
lotc-layout). Activate alongside a visual design system:

    setup_components(env, design_systems=["lotc-layout", "nldd", "lotc-charts"])

Only then do <c-line-chart>/<c-gauge> resolve. The set owns its component defs
(registry.json fragment), its templates, and loads Chart.js (via extra_head) +
its own CSS — a loose implementation, NLDD-styled, wrapping an existing library.
"""

from pathlib import Path

from lord_of_the_components.design_system import DesignSystem

_HERE = Path(__file__).resolve().parent

DESIGN_SYSTEM = DesignSystem(
    name="lotc-charts",
    renderers_module="lotc_charts.renderers",
    templates_path=_HERE / "templates",
    static_path=_HERE / "static",
    registry_path=_HERE / "registry.json",
    css_urls=("/static/lotc/charts/charts.css",),
    # Chart.js is a UMD global (not an ES module), so load it via extra_head
    # rather than js_urls (which emits <script type="module">).
    extra_head='<script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>',
)
