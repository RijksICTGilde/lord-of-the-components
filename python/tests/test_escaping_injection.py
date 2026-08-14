"""Regression tests for the attribute-injection holes found in review (PR-1 r1).

Three write paths put user data into a tag where escaping was missing:

  1. the composed CSS class string — `class=` / `:class=`, plus every prop that
     an implementation interpolates INTO a class (`rvo-icon-<icon>`), and the
     utility classes derived from the passthrough dict;
  2. the KEYS of the `:attrs="{name: value}"` spread, which are written unquoted
     into the tag, so an entity-escape cannot save them (attribute names are not
     entity-decoded) — they are rejected instead;
  3. `class="{{ expr }}"` did not render the expression at all: the literal
     mustache reached the browser (the only attribute where the documented
     mustache form silently failed).

The probe value below breaks out of a `class="…"` attribute and adds an event
handler if any of these paths writes it raw.
"""

from pathlib import Path

import pytest
from jinja2 import Environment, FileSystemLoader

from lord_of_the_components import setup_components
from lord_of_the_components.runtime import attr_name, merge_class, render_extra

PKG = Path(__file__).resolve().parent.parent / "src" / "lord_of_the_components"

#: Breaks out of a double-quoted attribute value and starts a new attribute.
BREAKOUT = 'x" onmouseover="alert(1)'


def _env(theme="rvo"):
    env = Environment(loader=FileSystemLoader([str(PKG / "templates")]), autoescape=True)
    setup_components(env, design_systems=[theme], registry_path=str(PKG / "registry.json"))
    return env


def _assert_no_breakout(html):
    """The probe stays INSIDE the class value: escaped, never a real attribute.

    The escaped text `onmouseover=&#34;` may appear (it is inert inside the
    quoted value); what must not appear is a live `onmouseover="` attribute,
    which requires an unescaped quote.
    """
    assert 'onmouseover="' not in html, html
    assert BREAKOUT not in html, html
    assert "&#34;" in html, html  # the probe's quote came out escaped


# ── 1. the class string ────────────────────────────────────────────────────────


def test_bound_class_cannot_break_out_of_the_class_attribute():
    html = _env().from_string('<c-button label="hi" :class="p"/>').render(p=BREAKOUT)
    _assert_no_breakout(html)
    assert "&#34;" in html  # the quote survived, escaped


def test_literal_class_cannot_break_out():
    html = _env().from_string(f'<c-button label="hi" class=\'{BREAKOUT}\'/>').render()
    _assert_no_breakout(html)


def test_prop_interpolated_into_a_class_is_escaped():
    # icon lands inside the class string as `rvo-icon-<icon>`, not in a value slot.
    html = _env().from_string('<c-icon :icon="p"/>').render(p=BREAKOUT)
    _assert_no_breakout(html)


def test_class_escaped_exactly_once():
    """A single escape, not a double one (`&amp;#34;` would show as text)."""
    html = _env().from_string('<c-button label="hi" class="{{ p }}"/>').render(p='a"b')
    assert "&#34;" in html and "&amp;" not in html


def test_jinja_backend_class_is_escaped_too():
    # card is a jinja-backend component: a different emitter, same guarantee.
    html = _env().from_string('<c-card :class="p">x</c-card>').render(p=BREAKOUT)
    _assert_no_breakout(html)


def test_normal_classes_still_pass_through():
    html = _env().from_string('<c-button label="hi" class="my-class other"/>').render()
    assert "my-class" in html and "other" in html


# ── 2. the `:attrs` spread keys ────────────────────────────────────────────────


def test_attrs_spread_rejects_an_injecting_key():
    tmpl = _env().from_string('<c-button label="hi" :attrs="d"/>')
    with pytest.raises(ValueError, match="Invalid HTML attribute name"):
        tmpl.render(d={BREAKOUT: "1"})


def test_attrs_spread_rejects_a_key_with_a_space():
    tmpl = _env().from_string('<c-button label="hi" :attrs="d"/>')
    with pytest.raises(ValueError, match="Invalid HTML attribute name"):
        tmpl.render(d={"data-x onclick": "1"})


def test_attrs_spread_keeps_legal_keys():
    html = _env().from_string('<c-button label="hi" :attrs="d"/>').render(
        d={"data-x": "1", "aria-label": "L", "hx-get": "/u", "my:attr.v": "2"}
    )
    for pair in (' data-x="1"', ' aria-label="L"', ' hx-get="/u"', ' my:attr.v="2"'):
        assert pair in html


def test_attrs_spread_values_are_still_escaped():
    html = _env().from_string('<c-button label="hi" :attrs="d"/>').render(
        d={"data-x": '"><script>alert(1)</script>'}
    )
    assert "<script>" not in html


def test_attrs_spread_key_guard_covers_the_jinja_backend():
    # lotc-forms templates spread `:attrs` through their own macro.
    tmpl = _env().from_string('<c-card :attrs="d">x</c-card>')
    with pytest.raises(ValueError, match="Invalid HTML attribute name"):
        tmpl.render(d={BREAKOUT: "1"})


# ── 3. `class="{{ expr }}"` must render the expression ─────────────────────────


def test_class_mustache_renders_the_expression():
    html = _env().from_string('<c-button label="hi" class="{{ cls }}"/>').render(cls="from-var")
    assert "from-var" in html
    assert "{{" not in html and "}}" not in html


def test_class_mustache_mixed_with_literal_text():
    html = _env().from_string('<c-button label="hi" class="a {{ cls }} b"/>').render(cls="mid")
    assert "a mid b" in html
    assert "{{" not in html


def test_class_mustache_on_the_jinja_backend():
    html = _env().from_string('<c-card class="{{ cls }}">x</c-card>').render(cls="from-var")
    assert "from-var" in html and "{{" not in html


# ── the shared validator / helper units ────────────────────────────────────────


@pytest.mark.parametrize("name", ["data-x", "aria-label", "id", "hx-get", "_x", ":x", "a.b:c-d_1"])
def test_attr_name_accepts_legal_names(name):
    assert attr_name(name) == name


@pytest.mark.parametrize("name", ['x" y', "x=y", "x y", "", "1x", "<x", "x'y", "x\ny"])
def test_attr_name_rejects_illegal_names(name):
    with pytest.raises(ValueError):
        attr_name(name)


def test_render_extra_rejects_an_injecting_spread_key():
    with pytest.raises(ValueError):
        render_extra({"attrs": {BREAKOUT: "1"}})


def test_merge_class_unescapes_markup_so_it_is_escaped_once():
    from markupsafe import Markup

    # A captured `{% set %}` block arrives pre-escaped; merge_class holds raw text.
    assert merge_class("base", Markup("a&#34;b")) == 'base a"b'
    assert merge_class("base", "plain") == "base plain"
    assert merge_class("", "only") == "only"
    assert merge_class("base", "") == "base"
