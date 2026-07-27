"""Tests for the Python renderer backend and its arg routing (plan v7 F3)."""

from pathlib import Path

import pytest
from jinja2 import Environment, FileSystemLoader

from lord_of_the_components import setup_components
from lord_of_the_components.extension import ComponentExtension
from lord_of_the_components.runtime import render_utility

PACKAGE_DIR = Path(__file__).resolve().parent.parent / "src" / "lord_of_the_components"
TEMPLATES_DIR = PACKAGE_DIR / "templates"
REGISTRY_JSON = PACKAGE_DIR / "registry.json"


@pytest.fixture
def ext_env():
    # fold=False so the routing tests below see the runtime _lotc_* call form
    # rather than the folded literal HTML.
    env = Environment(loader=FileSystemLoader(str(TEMPLATES_DIR)), autoescape=True)
    setup_components(env, design_systems=["rvo"], registry_path=str(REGISTRY_JSON), fold=False)
    return env


def _pre(env, source):
    ext = env.extensions[ComponentExtension.identifier]
    return ext.preprocess(source, "t.html")


# ── dispatch + routing ────────────────────────────────────────────────────────


def test_python_component_emits_call(ext_env):
    out = _pre(ext_env, '<c-button type="primary">Hi</c-button>')
    assert "_lotc_rvo_button(" in out
    assert "components/button.html.j2" not in out


def test_jinja_component_still_includes(ext_env):
    # card is still on the jinja backend.
    out = _pre(ext_env, "<c-card>Body</c-card>")
    assert "components/card.html.j2" in out


def test_literal_prop_is_string_literal(ext_env):
    out = _pre(ext_env, '<c-button type="primary"/>')
    assert "type='primary'" in out


def test_boolean_prop_true(ext_env):
    out = _pre(ext_env, "<c-button disabled/>")
    assert "disabled=True" in out


def test_boolean_prop_false_word(ext_env):
    out = _pre(ext_env, '<c-button disabled="false"/>')
    assert "disabled=False" in out


def test_class_routes_to_underscore_class(ext_env):
    out = _pre(ext_env, '<c-button class="x y"/>')
    assert "_class='x y'" in out


def test_generic_attr_routes_to_extra(ext_env):
    out = _pre(ext_env, '<c-button data-testid="b"/>')
    assert "_extra={" in out
    assert "'data-testid': 'b'" in out


def test_aria_label_prop_goes_to_kwarg_and_extra(ext_env):
    # aria-label is a def prop AND an aria-* passthrough: both, like the old macro.
    out = _pre(ext_env, '<c-button aria-label="Save"/>')
    assert "aria_label='Save'" in out
    assert "'aria-label': 'Save'" in out


def test_event_routes_to_extra(ext_env):
    out = _pre(ext_env, '<c-button @click="f()"/>')
    assert "'@click': 'f()'" in out


def test_expression_prop(ext_env):
    out = _pre(ext_env, '<c-button :type="chosen"/>')
    assert "type=chosen" in out


def test_interpolated_value_is_captured(ext_env):
    out = _pre(ext_env, '<c-button type="{{ kind }}"/>')
    # Interpolated values are captured into a set-block var, then passed.
    assert "{% set _lotc_a" in out
    assert "{{ kind }}" in out


def test_content_captured_and_passed(ext_env):
    out = _pre(ext_env, "<c-button>Save</c-button>")
    assert "{% set _lotc_c" in out
    assert "content=_lotc_c" in out


# ── rendered output ───────────────────────────────────────────────────────────


def test_button_renders_and_escapes_label(ext_env):
    html = ext_env.from_string('<c-button label="<b>x</b>"/>').render()
    assert "utrecht-button" in html
    assert "&lt;b&gt;x&lt;/b&gt;" in html  # label escaped
    assert "<b>x</b>" not in html


def test_content_overrides_label_and_is_markup(ext_env):
    html = ext_env.from_string("<c-button label='ignored'><b>kept</b></c-button>").render()
    assert "<b>kept</b>" in html  # content is trusted markup
    assert "ignored" not in html


def test_heading_dynamic_element(ext_env):
    html = ext_env.from_string('<c-heading type="h3">T</c-heading>').render()
    assert "<h3" in html and "</h3>" in html
    assert "utrecht-heading-3" in html


# ── render_utility ────────────────────────────────────────────────────────────


def test_render_utility_simple():
    assert render_utility({"margin": "sm"}) == "rvo-margin--sm"
    assert render_utility({"padding": "md"}) == "rvo-padding--md"


def test_render_utility_text_style_multiple():
    assert render_utility({"text-style": "bold italic"}) == "rvo-text--bold rvo-text--italic"


def test_render_utility_three_part():
    assert render_utility({"margin": "block-start-lg"}) == "rvo-margin-block-start--lg"


def test_render_utility_comma_separated():
    assert render_utility({"padding": "sm, lg"}) == "rvo-padding--sm rvo-padding--lg"


def test_render_utility_empty():
    assert render_utility(None) == ""
    assert render_utility({}) == ""
