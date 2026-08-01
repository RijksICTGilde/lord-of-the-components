"""Extended-component mechanism: a shared base + theme-owned extension attributes.

A component can declare base attributes (always valid) plus theme-specific
EXTENSION attributes tagged with an `owner` design system. An owned attribute is
only valid while its owner is active; otherwise it's a clear error. Pilot: c-box
(base: content/class; lotc-layout owns pad/border; nldd owns background).
"""

from pathlib import Path

import pytest
from jinja2 import Environment, FileSystemLoader

from lord_of_the_components import ComponentError, setup_components

PKG = Path(__file__).resolve().parent.parent / "src" / "lord_of_the_components"
LAYOUT = Path(__file__).resolve().parents[2] / "packages" / "lotc-layout" / "src" / "lotc_layout" / "templates"


def _env(themes):
    env = Environment(loader=FileSystemLoader([str(PKG / "templates"), str(LAYOUT)]), autoescape=True)
    setup_components(env, design_systems=themes, registry_path=str(PKG / "registry.json"))
    return env


def test_registry_tags_extension_attributes_with_owner():
    env = _env(["lotc-layout"])
    from lord_of_the_components.extension import ComponentExtension

    reg = env.extensions[ComponentExtension.identifier].registry
    box = reg._components["box"]
    assert box.get_attribute("pad").owner == "lotc-layout"
    assert box.get_attribute("border").owner == "lotc-layout"
    assert box.get_attribute("background").owner == "nldd"
    assert box.get_attribute("class").owner is None  # base attr, always valid


def test_base_and_owner_active_render():
    # pad/border (lotc-layout-owned) render under lotc-layout
    html = _env(["lotc-layout", "rvo"]).from_string('<c-box pad="1rem" border>x</c-box>').render()
    assert "lotc-box" in html and "lotc-box--border" in html and "--lotc-box-pad: 1rem" in html
    # background (nldd-owned) renders when nldd is active
    html = _env(["lotc-layout", "nldd"]).from_string('<c-box background="accent">x</c-box>').render()
    assert "lotc-box--bg" in html and "--lotc-box-bg: accent" in html


def test_owner_not_active_is_rejected():
    # background is nldd-only; under lotc-layout+rvo it must error clearly.
    with pytest.raises(ComponentError, match="extension provided by the 'nldd'"):
        _env(["lotc-layout", "rvo"]).from_string('<c-box background="x">y</c-box>').render()


def test_base_attribute_always_valid():
    # class has no owner -> valid in any theme.
    html = _env(["lotc-layout", "rvo"]).from_string('<c-box class="mine">x</c-box>').render()
    assert "mine" in html
