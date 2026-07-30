"""The opt-in lotc-layout design system (Every Layout primitives).

Verifies the primitives render, compose with another design system
(mix-and-match), and — crucially — are opt-in: without lotc-layout active,
neither the components nor their stylesheet are present.
"""

from pathlib import Path

import pytest
from jinja2 import Environment, FileSystemLoader

from lord_of_the_components import setup_components

PKG = Path(__file__).resolve().parent.parent / "src" / "lord_of_the_components"
REGISTRY = PKG / "registry.json"


def _env(design_systems, on_missing="error"):
    env = Environment(loader=FileSystemLoader([str(PKG / "templates")]), autoescape=True)
    setup_components(
        env,
        design_systems=design_systems,
        registry_path=str(REGISTRY),
        on_missing_component=on_missing,
    )
    return env


@pytest.fixture
def render():
    env = _env(["lotc-layout", "rvo"])
    return lambda s: env.from_string(s).render()


def test_primitives_render(render):
    html = render(
        '<c-center max="26rem"><c-cluster gap=".5rem"><span>a</span><span>b</span></c-cluster>'
        '<c-sidebar side="left" width="12rem"><nav>side</nav><div>main</div></c-sidebar>'
        '<c-switcher threshold="30rem"><div>x</div><div>y</div></c-switcher>'
        '<c-box pad="1rem" border>b</c-box></c-center>'
    )
    assert 'class="lotc-center"' in html
    assert 'class="lotc-cluster"' in html
    assert "lotc-sidebar lotc-sidebar--left" in html
    assert 'class="lotc-switcher"' in html
    assert "lotc-box lotc-box--border" in html


def test_props_become_css_vars(render):
    html = render('<c-center max="60rem" gutters="2rem">x</c-center>')
    assert "--lotc-center-max: 60rem" in html and "--lotc-center-gutters: 2rem" in html


def test_mix_and_match_with_design_system(render):
    # A layout primitive wrapping a design-system component (rvo button).
    html = render('<c-center><c-button type="primary" label="Go"/></c-center>')
    assert "lotc-center" in html and "utrecht-button" in html


def test_opt_in_stylesheet_only_when_active():
    with_layout = _env(["lotc-layout", "rvo"]).from_string(
        '<c-page title="x" design-systems="lotc-layout rvo"><c-center>hi</c-center></c-page>'
    ).render()
    without = _env(["rvo"]).from_string(
        '<c-page title="x" design-systems="rvo"><p>hi</p></c-page>'
    ).render()
    assert "/static/lotc/layout/layout.css" in with_layout
    assert "/static/lotc/layout/layout.css" not in without


def test_opt_in_components_absent_without_layout():
    # Without lotc-layout active, <c-center> is not implemented (a gap marker).
    env = _env(["rvo"], on_missing="placeholder")
    assert "not implemented" in env.from_string("<c-center>hi</c-center>").render()


def test_lotc_layout_is_impl_only_with_own_css():
    from lord_of_the_components.design_system import discover_design_systems

    ds = discover_design_systems()["lotc-layout"]
    assert ds.templates_path is not None and ds.static_path is not None
    assert ds.css_urls == ("/static/lotc/layout/layout.css",)
