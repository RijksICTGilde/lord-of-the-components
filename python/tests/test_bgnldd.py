"""BGNLDD theme: mix-and-match with NLDD.

BGNLDD is a separate theme layer that owns Begane Grond's app components
(c-metric, c-sidenav, …), absent from NLDD proper. A page declares both; NLDD
renders the primitives, BGNLDD its own components, each routed by owner theme.
Requires the lotc-bgnldd package to be installed (editable).
"""

from pathlib import Path

import pytest
from jinja2 import Environment, FileSystemLoader

from lord_of_the_components import setup_components

PKG = Path(__file__).resolve().parent.parent / "src" / "lord_of_the_components"


@pytest.fixture
def render():
    env = Environment(loader=FileSystemLoader([str(PKG / "templates")]), autoescape=True)
    setup_components(
        env, design_systems=["nldd", "bgnldd"], registry_path=str(PKG / "registry.json")
    )
    return lambda s: env.from_string(s).render()


def test_metric_is_a_global_component_rendered_by_bgnldd(render):
    # c-metric is a global (core) component; BGNLDD provides its NLDD impl.
    html = render('<c-metric icon="apartment-building" value="5" label="Datacenters"/>')
    assert 'class="bg-metric-link"' in html
    assert "bg-metric-value" in html and ">5<" in html


def test_metric_composes_nldd_primitives(render):
    # BGNLDD markup wraps real NLDD components (card/container) and reuses the
    # NLDD icon renderer (semantic name -> nldd icon name).
    html = render('<c-metric icon="apartment-building" value="5" label="Datacenters" sub="4 operationeel"/>')
    assert "<nldd-card" in html
    assert '<nldd-container' in html and 'padding="20"' in html
    assert '<nldd-icon' in html and 'name="apartment-building"' in html


def test_sidenav_active_state(render):
    html = render('<c-sidenav><c-sidenav-item icon="house" label="Overzicht" href="/" active/></c-sidenav>')
    assert 'class="bg-sidenav"' in html
    assert "bg-active" in html and 'aria-current="page"' in html


def test_mix_and_match_resolves_per_component(render):
    # Same page: c-card -> NLDD (nldd-card), c-metric -> BGNLDD's impl (bg-metric).
    html = render('<c-card>x</c-card><c-metric value="1" label="L"/>')
    assert "<nldd-card" in html  # NLDD primitive
    assert "bg-metric-link" in html  # global component, BGNLDD impl


def test_header_utility_menu(render):
    # c-header renders its children inside the nav bar; a utility menu (c-menu
    # type="bar", placed via slot="utility") lands in the top-nav utility slot.
    html = render(
        '<c-header text="BG" link="/">'
        '<c-menu type="bar" slot="utility"><c-menu-item label="Zoeken" icon="search"/>'
        '<c-menu-item label="Nieuw" icon="plus" expandable/></c-menu></c-header>'
    )
    assert "<nldd-top-navigation-bar" in html
    assert '<nldd-menu-bar slot="utility"' in html
    assert '<nldd-menu-bar-item text="Zoeken" icon="search"' in html
    assert "expandable" in html  # the "Nieuw" item
    assert "expandable" in html  # the "Nieuw" item


def test_section_head_uses_nldd_title(render):
    # Section titles render via the real nldd-title (not a hand-styled span), so
    # they match the design system's title typography.
    html = render('<c-section-head title="De lagen" icon="timer"/>')
    assert '<nldd-title size="4"><h2' in html and "De lagen" in html


def test_layer_and_activity_render(render):
    layer = render('<c-layer icon="rectangle-stack" title="Applicaties" count="123 apps" sub="Wat.."/>')
    assert 'class="bg-layer"' in layer and "bg-layer-title" in layer and "bg-layer-go" in layer
    act = render('<c-activity><c-activity-item icon="plus" actor="Anne" action="deed" res="r" at="now"/></c-activity>')
    assert 'class="bg-activity"' in act and "bg-activity-actor" in act and "bg-activity-res" in act


def test_design_system_assets_global_emits_css():
    # A page declaring bgnldd loads its CSS bundle via this global.
    env = Environment(loader=FileSystemLoader([str(PKG / "templates")]), autoescape=True)
    setup_components(env, design_systems=["nldd", "bgnldd"], registry_path=str(PKG / "registry.json"))
    html = env.from_string("{{ get_design_system_assets() }}").render()
    assert '<link rel="stylesheet" href="/static/lotc/bgnldd/bg-components.css">' in html


def test_cpage_loads_all_declared_theme_assets(render):
    # <c-page> renders the full document and loads every declared system's bundle:
    # NLDD's web-components module + BGNLDD's CSS.
    html = render('<c-page title="Overzicht" design-systems="nldd bgnldd"><p>x</p></c-page>')
    assert "<!DOCTYPE html>" in html
    assert 'src="/static/lotc/nldd/dist/nldd.js"' in html  # NLDD web components (JS module)
    assert 'href="/static/lotc/nldd/dist/css/reset.css"' in html  # NLDD base CSS
    assert 'href="/static/lotc/bgnldd/bg-components.css"' in html  # BGNLDD add-on CSS
    assert "<p>x</p>" in html


def test_app_components_are_global_and_bgnldd_is_impl_only():
    # The app components (metric, sidenav, …) are GLOBAL: their definitions live
    # in core's registry, not owned by any theme. BGNLDD is implementation-only
    # (it ships templates + CSS, no registry fragment).
    from lord_of_the_components.design_system import discover_design_systems
    from lord_of_the_components.registry import ComponentRegistry

    reg = ComponentRegistry(PKG / "registry.json")
    for name in ("metric", "sidenav", "layer", "activity", "chip", "card"):
        assert reg.has_component(name), name
        assert reg.get_component(name).theme is None  # global, no owner

    bg = discover_design_systems()["bgnldd"]
    assert bg.registry_path is None  # impl-only: no definitions of its own
    assert bg.templates_path is not None and bg.css_urls
