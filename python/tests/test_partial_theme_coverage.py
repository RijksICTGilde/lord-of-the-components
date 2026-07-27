"""Partial theme coverage: definitions are global, implementations per theme.

A component may be defined but not implemented by the active design system(s).
Default is a clear error; on_missing_component="placeholder" renders a visible
marker so you can switch themes and see the gaps. c-status-bar is a good probe:
it's a core (global) definition with an NLDD implementation but no RVO one.
"""

from pathlib import Path

import pytest
from jinja2 import Environment, FileSystemLoader

from lord_of_the_components import setup_components
from lord_of_the_components.extension import ComponentError

PKG = Path(__file__).resolve().parent.parent / "src" / "lord_of_the_components"


def _env(design_systems, on_missing="error"):
    env = Environment(loader=FileSystemLoader([str(PKG / "templates")]), autoescape=True)
    setup_components(
        env,
        design_systems=design_systems,
        registry_path=str(PKG / "registry.json"),
        on_missing_component=on_missing,
    )
    return env


def test_implemented_component_renders():
    html = _env(["nldd"]).from_string('<c-status-bar text="Demo"/>').render()
    assert "<nldd-status-bar" in html


def test_missing_impl_errors_by_default():
    with pytest.raises(ComponentError) as exc:
        _env(["rvo"]).from_string('<c-status-bar text="Demo"/>').render()
    assert "not implemented" in str(exc.value) and "rvo" in str(exc.value)


def test_missing_impl_placeholder():
    html = _env(["rvo"], on_missing="placeholder").from_string('<c-status-bar text="Demo"/>').render()
    assert 'class="lotc-unimplemented"' in html
    assert "status-bar" in html and "rvo" in html


def test_shared_component_still_renders_in_both_themes():
    assert "utrecht-button" in _env(["rvo"]).from_string('<c-button label="X"/>').render()
    assert "nldd-button" in _env(["nldd"]).from_string('<c-button label="X"/>').render()


def test_missing_python_component_also_detected():
    # A python-backend design-system component (button) with no active theme
    # errors too (no renderer registered).
    with pytest.raises(ComponentError):
        _env([]).from_string('<c-button label="X"/>').render()
