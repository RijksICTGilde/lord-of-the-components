"""Page-level design-system availability + the always-present system layer.

There is NO implicit default design system: a page declares which design systems
it uses via `design_systems=[...]`. The theme-agnostic "system" layer (LOTC's own
layout + basic HTML) is always available. Using a design-system component with no
design system loaded fails loudly with a suggestion.
"""

from pathlib import Path

import pytest
from jinja2 import Environment, FileSystemLoader

from lord_of_the_components.extension import ComponentError, setup_components

PKG = Path(__file__).resolve().parent.parent / "src" / "lord_of_the_components"
REGISTRY = str(PKG / "registry.json")
TEMPLATES = str(PKG / "templates")


def _env(**kwargs):
    env = Environment(loader=FileSystemLoader([TEMPLATES]), autoescape=True)
    setup_components(env, registry_path=REGISTRY, **kwargs)
    return env


def _render(env, src):
    return env.from_string(src).render()


# ── system layer is always present (no design system needed) ──────────────────


def test_system_component_renders_without_design_system():
    env = _env()  # nothing declared
    assert 'class="lotc-stack"' in _render(env, "<c-stack>x</c-stack>")
    assert "<div" in _render(env, "<c-div>hi</c-div>")


def test_system_layer_theme_global_is_system():
    assert _env().globals["lotc_theme"] == "system"


# ── design-system components require a declared design system ──────────────────


def test_design_system_component_errors_without_one():
    env = _env()  # no design system
    with pytest.raises(ComponentError) as exc:
        _render(env, '<c-button label="Go"/>')
    msg = str(exc.value)
    assert "design system" in msg
    assert "design_systems=['rvo']" in msg


def test_design_system_component_works_when_declared():
    env = _env(design_systems=["rvo"])
    assert "utrecht-button" in _render(env, '<c-button label="Go"/>')


def test_legacy_theme_arg_still_works():
    env = _env(theme="rvo")
    assert "utrecht-button" in _render(env, '<c-button label="Go"/>')
    assert env.globals["lotc_theme"] == "rvo"


# ── only declared systems are loaded ──────────────────────────────────────────


def test_only_declared_systems_registered():
    env = _env(design_systems=["rvo"])
    assert "_lotc_rvo_button" in env.globals
    assert "_lotc_nldd_button" not in env.globals  # nldd not declared -> not loaded


def test_multiple_declared_systems_all_loaded():
    env = _env(design_systems=["rvo", "nldd"])
    assert "_lotc_rvo_button" in env.globals
    assert "_lotc_nldd_button" in env.globals


def test_primary_is_first_declared():
    env = _env(design_systems=["nldd", "rvo"])
    # nldd is primary -> button renders as the NLDD web component.
    assert "<nldd-button" in _render(env, '<c-button label="Go"/>')


# ── unknown design system -> helpful error ─────────────────────────────────────


def test_unknown_design_system_errors_with_suggestion():
    with pytest.raises(RuntimeError) as exc:
        _env(design_systems=["rvoo"])
    assert "rvo" in str(exc.value)


# ── debug diagnostics: invalid enum values with suggestions ───────────────────


def test_debug_rejects_invalid_enum_value_with_suggestion():
    env = _env(design_systems=["rvo"], debug=True)
    with pytest.raises(ComponentError) as exc:
        _render(env, '<c-button type="prmary" label="Go"/>')
    msg = str(exc.value)
    assert "Invalid value 'prmary'" in msg
    assert "type" in msg
    assert "primary" in msg  # suggestion / allowed set


def test_debug_accepts_valid_enum_value():
    env = _env(design_systems=["rvo"], debug=True)
    assert "utrecht-button" in _render(env, '<c-button type="secondary" label="Go"/>')


def test_non_debug_is_lenient_on_enum_values():
    # Without debug, an out-of-set value passes through (no author diagnostic).
    env = _env(design_systems=["rvo"], debug=False)
    _render(env, '<c-button type="prmary" label="Go"/>')  # does not raise


def test_debug_skips_dynamic_values():
    # A jinja-expression value can't be checked statically -> no false positive.
    env = _env(design_systems=["rvo"], debug=True)
    env.from_string('{% set t = "primary" %}<c-button type="{{ t }}" label="Go"/>').render()


def test_debug_still_flags_unknown_attribute():
    # Unknown-attribute diagnostics are always on (independent of debug).
    env = _env(design_systems=["rvo"], debug=True)
    with pytest.raises(ComponentError) as exc:
        _render(env, '<c-button typ="primary" label="Go"/>')
    assert "Unknown attribute" in str(exc.value)


# ── entry-point discovery (decoupled: core has no hard-coded theme list) ──────


def test_discovery_finds_installed_design_systems():
    from lord_of_the_components.design_system import discover_design_systems

    found = discover_design_systems()
    assert {"rvo", "nldd"} <= set(found)
    assert found["rvo"].renderers_module.endswith("themes.rvo.renderers")


def test_core_has_no_hardcoded_theme_list():
    # The decoupling: core no longer ships a KNOWN_THEMES constant.
    import lord_of_the_components.extension as ext

    assert not hasattr(ext, "KNOWN_THEMES")
