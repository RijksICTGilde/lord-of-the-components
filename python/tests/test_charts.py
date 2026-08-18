"""lotc-charts — an opt-in capability set of Chart.js chart components."""

from pathlib import Path

import pytest
from jinja2 import Environment, FileSystemLoader

from lord_of_the_components import ComponentError, setup_components

PKG = Path(__file__).resolve().parent.parent / "src" / "lord_of_the_components"
CHARTS = str(Path(__file__).resolve().parents[2] / "packages" / "lotc-charts" / "src" / "lotc_charts" / "templates")
NLDD = str(Path(__file__).resolve().parents[2] / "packages" / "lotc-nldd" / "src" / "lotc_nldd" / "templates")


def _env(themes):
    env = Environment(loader=FileSystemLoader([str(PKG / "templates"), NLDD, CHARTS]), autoescape=True)
    setup_components(env, design_systems=themes, registry_path=str(PKG / "registry.json"))
    return env


def test_line_chart_renders_canvas_and_chartjs():
    html = _env(["nldd", "lotc-charts"]).from_string(
        "<c-line-chart id=\"cpu\" title=\"CPU\" "
        ":data=\"{'labels':['1','2'],'datasets':[{'label':'x','data':[1,2]}]}\"/>"
    ).render()
    assert '<canvas id="cpu-canvas"' in html  # derived canvas id (no clash with figure id)
    # The config travels as JSON on the canvas; charts.js (loaded once a page)
    # builds the chart from it. It used to be an inline <script> per chart.
    assert "data-lotc-line-chart=" in html
    assert "<script" not in html
    assert "&#34;labels&#34;: [&#34;1&#34;, &#34;2&#34;]" in html  # data serialised for Chart.js


def test_gauge_renders_doughnut_with_value():
    html = _env(["nldd", "lotc-charts"]).from_string(
        '<c-gauge value="72" label="CPU" sublabel="2/4 cores" id="g"/>'
    ).render()
    assert '<canvas id="g-canvas"' in html and "data-lotc-gauge=" in html
    assert "<script" not in html
    assert "72%" in html and "2/4 cores" in html


def test_charts_are_opt_in():
    # Without lotc-charts active, the components aren't registered.
    env = Environment(loader=FileSystemLoader([str(PKG / "templates"), NLDD]), autoescape=True)
    setup_components(env, design_systems=["nldd"], registry_path=str(PKG / "registry.json"))
    with pytest.raises(ComponentError, match="Unknown component"):
        env.from_string('<c-gauge value="5"/>').render()


def test_set_loads_chartjs_and_css():
    from lord_of_the_components.design_system import discover_design_systems

    ds = discover_design_systems()["lotc-charts"]
    assert "chart.js" in ds.extra_head and ds.css_urls  # Chart.js + its own CSS
    assert ds.js_urls  # our own builder, so no chart carries an inline <script>
