"""Partial theme coverage: definitions are global, implementations per theme.

A component may be defined but not implemented by the active design system(s).
Default is a clear error; on_missing_component="placeholder" renders a visible
marker so you can switch themes and see the gaps. The probe is a dedicated
test-only component (`c-coverage-probe`, in data/coverage_probe_registry.json)
that no theme implements — robust to which real components happen to be covered.
"""

from pathlib import Path

import pytest
from jinja2 import Environment, FileSystemLoader

from lord_of_the_components import setup_components
from lord_of_the_components.extension import ComponentError

PKG = Path(__file__).resolve().parent.parent / "src" / "lord_of_the_components"
PROBE_REGISTRY = Path(__file__).resolve().parent / "data" / "coverage_probe_registry.json"


def _env(design_systems, on_missing="error", registry=None):
    env = Environment(loader=FileSystemLoader([str(PKG / "templates")]), autoescape=True)
    setup_components(
        env,
        design_systems=design_systems,
        registry_path=str(registry or (PKG / "registry.json")),
        on_missing_component=on_missing,
    )
    return env


def test_implemented_component_renders():
    html = _env(["nldd"]).from_string('<c-button label="X"/>').render()
    assert "nldd-button" in html


def test_missing_impl_errors_by_default():
    with pytest.raises(ComponentError) as exc:
        _env(["rvo"], registry=PROBE_REGISTRY).from_string('<c-coverage-probe text="x"/>').render()
    assert "not implemented" in str(exc.value) and "rvo" in str(exc.value)


def test_missing_impl_placeholder():
    html = (
        _env(["rvo"], on_missing="placeholder", registry=PROBE_REGISTRY)
        .from_string('<c-coverage-probe text="x"/>')
        .render()
    )
    assert 'class="lotc-unimplemented"' in html
    assert "coverage-probe" in html and "rvo" in html


def test_shared_component_still_renders_in_both_themes():
    assert "utrecht-button" in _env(["rvo"]).from_string('<c-button label="X"/>').render()
    assert "nldd-button" in _env(["nldd"]).from_string('<c-button label="X"/>').render()


def test_app_components_are_agnostic_rvo_and_nldd():
    # The same <c-metric> markup renders through each theme's implementation:
    # RVO composes rvo-card + rvo-icon; NLDD composes nldd-card + nldd-icon.
    src = '<c-metric icon="home" value="5" label="Datacenters"/>'
    rvo = _env(["rvo"]).from_string(src).render()
    assert "rvo-card" in rvo and "rvo-icon" in rvo and "lotc-metric-value" in rvo
    nldd = _env(["nldd"]).from_string(src).render()
    assert "<nldd-card" in nldd and "<nldd-icon" in nldd and "lotc-metric-value" in nldd


def test_app_components_render_across_the_set_in_rvo():
    env = _env(["rvo"])
    r = lambda s: env.from_string(s).render()
    assert "lotc-sidenav-link" in r('<c-sidenav-item icon="home" label="X" href="/"/>')
    assert "lotc-layer" in r('<c-layer icon="home" title="Apps" count="5"/>')
    assert "lotc-activity-item" in r('<c-activity-item icon="home" actor="A" action="did"/>')
    assert "utrecht-heading" in r('<c-section-head title="Kop"/>')  # RVO heading
    assert "lotc-layer-chip" in r("<c-chip>x</c-chip>")


def test_missing_python_component_also_detected():
    # A python-backend design-system component (button) with no active theme
    # errors too (no renderer registered).
    with pytest.raises(ComponentError):
        _env([]).from_string('<c-button label="X"/>').render()
