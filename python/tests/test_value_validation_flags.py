"""Author-facing validation flags on setup_components.

Two opt-in strictness controls turn silent authoring mistakes into loud errors:

* ``on_unknown_value`` — an attribute *value* that is not recognised. An icon name
  absent from an active theme's set renders as a blank box (``verwijderen`` is an RVO
  icon; NLDD has ``trash``), and a literal outside an enum's allowed set is ignored.
  ``"error"`` raises with a suggestion; ``"ignore"`` (default) renders as-is.
* ``on_unknown_attribute`` — an attribute *name* the component does not declare.
  ``"error"`` (default) raises; ``"ignore"`` tolerates it (drops it, no error).

``debug=True`` is shorthand for ``on_unknown_value="error"``.
"""

from __future__ import annotations

import pytest
from jinja2 import Environment, FileSystemLoader

from lord_of_the_components import setup_components
from lord_of_the_components.extension import ComponentError


def _render(design_systems, source, **kwargs):
    env = Environment(autoescape=True, loader=FileSystemLoader([]))
    setup_components(env, design_systems=design_systems, on_missing_component="placeholder", **kwargs)
    return env.from_string(source).render()


NLDD = ["lotc-layout", "nldd"]
RVO = ["lotc-layout", "rvo"]


# ── on_unknown_value: icon names ──────────────────────────────────────────────

def test_unknown_icon_is_silent_by_default():
    # verwijderen is an RVO icon, absent from the NLDD set — a blank box, no error.
    assert _render(NLDD, '<c-icon icon="verwijderen"/>')


def test_unknown_icon_raises_under_error_mode():
    with pytest.raises(ComponentError) as exc:
        _render(NLDD, '<c-icon icon="verwijderen"/>', on_unknown_value="error")
    assert "verwijderen" in str(exc.value) and "nldd" in str(exc.value)


def test_valid_icon_passes_under_error_mode():
    assert _render(NLDD, '<c-icon icon="trash"/>', on_unknown_value="error")


def test_icon_is_validated_against_the_active_theme():
    # The same name is valid under RVO and invalid under NLDD — validation is
    # per active theme, not global.
    assert _render(RVO, '<c-icon icon="verwijderen"/>', on_unknown_value="error")
    with pytest.raises(ComponentError):
        _render(NLDD, '<c-icon icon="verwijderen"/>', on_unknown_value="error")


def test_theme_agnostic_alias_passes_under_error_mode():
    # `home` is an alias resolving to house(nldd)/home(rvo); it must pass in both.
    assert _render(NLDD, '<c-icon icon="home"/>', on_unknown_value="error")
    assert _render(RVO, '<c-icon icon="home"/>', on_unknown_value="error")


def test_debug_implies_value_errors():
    with pytest.raises(ComponentError):
        _render(NLDD, '<c-icon icon="verwijderen"/>', debug=True)


# ── on_unknown_value: enum values ─────────────────────────────────────────────

def test_bad_enum_value_is_silent_by_default():
    assert _render(RVO, '<c-button label="x" type="zomaar"/>')


def test_bad_enum_value_raises_under_error_mode():
    with pytest.raises(ComponentError) as exc:
        _render(RVO, '<c-button label="x" type="zomaar"/>', on_unknown_value="error")
    assert "zomaar" in str(exc.value)


# ── on_unknown_attribute ──────────────────────────────────────────────────────

def test_unknown_attribute_raises_by_default():
    with pytest.raises(ComponentError) as exc:
        _render(RVO, '<c-button label="x" zomaar="1"/>')
    assert "zomaar" in str(exc.value)


def test_unknown_attribute_tolerated_under_ignore_mode():
    # Lenient mode: the unknown attribute is dropped, the render still succeeds.
    out = _render(RVO, '<c-button label="x" zomaar="1"/>', on_unknown_attribute="ignore")
    assert "zomaar" not in out


# ── guard rails ───────────────────────────────────────────────────────────────

@pytest.mark.parametrize("kwargs", [{"on_unknown_value": "soms"}, {"on_unknown_attribute": "maybe"}])
def test_invalid_flag_value_is_rejected(kwargs):
    env = Environment(autoescape=True, loader=FileSystemLoader([]))
    with pytest.raises(ValueError):
        setup_components(env, design_systems=RVO, **kwargs)
