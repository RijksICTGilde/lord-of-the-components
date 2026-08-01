"""Icon-name validation (debug mode): an icon that resolves to no icon in an
active theme's set renders as a blank box. This catches typos and one-theme-only
icons — the jinja-roos-style diagnostic. Validated against icons.json (semantic
aliases + each theme's real icon set)."""

from pathlib import Path

import pytest
from jinja2 import Environment, FileSystemLoader

from lord_of_the_components import ComponentError, setup_components

PKG = Path(__file__).resolve().parent.parent / "src" / "lord_of_the_components"
NLDD = str(Path(__file__).resolve().parents[2] / "packages" / "lotc-nldd" / "src" / "lotc_nldd" / "templates")
RVO = str(Path(__file__).resolve().parents[2] / "packages" / "lotc-rvo" / "src" / "lotc_rvo" / "templates")


def _env(themes, debug=True):
    env = Environment(loader=FileSystemLoader([str(PKG / "templates"), NLDD, RVO]), autoescape=True)
    setup_components(env, design_systems=themes, registry_path=str(PKG / "registry.json"), debug=debug)
    return env


@pytest.mark.parametrize("icon", ["house", "apartment-building", "home"])  # nldd-native, nldd-raw, semantic alias
def test_valid_icon_passes(icon):
    _env(["nldd"]).from_string(f'<c-icon icon="{icon}"/>').render()  # no raise


def test_typo_errors_with_suggestion():
    with pytest.raises(ComponentError) as exc:
        _env(["nldd"]).from_string('<c-icon icon="huos"/>').render()
    assert "Unknown icon 'huos'" in str(exc.value) and "blank box" in str(exc.value)


def test_one_theme_only_icon_flagged_under_other_theme():
    # "accessibility" is NLDD-only (no alias, no RVO icon) -> blue box under RVO.
    with pytest.raises(ComponentError, match="Unknown icon 'accessibility'"):
        _env(["rvo"]).from_string('<c-icon icon="accessibility"/>').render()
    # a real RVO icon renders fine under RVO
    _env(["rvo"]).from_string('<c-icon icon="home"/>').render()


def test_show_icon_position_is_not_validated_as_a_name():
    # show-icon is a before/after/no position (enum), not an icon name.
    _env(["nldd"]).from_string('<c-button label="X" icon="house" show-icon="before"/>').render()


def test_not_validated_outside_debug():
    _env(["nldd"], debug=False).from_string('<c-icon icon="huos"/>').render()  # no raise
