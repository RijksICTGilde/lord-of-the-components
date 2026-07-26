"""Form input components — text-input and textarea (plan v7 F9, batch B)."""

from pathlib import Path

import pytest
from jinja2 import Environment, FileSystemLoader

from lord_of_the_components import setup_components

PKG = Path(__file__).resolve().parent.parent / "src" / "lord_of_the_components"


def _env(theme):
    env = Environment(loader=FileSystemLoader([str(PKG / "templates")]), autoescape=True)
    setup_components(env, registry_path=str(PKG / "registry.json"), theme=theme)
    return env


@pytest.fixture
def render():  # RVO by default
    env = _env("rvo")
    return lambda s: env.from_string(s).render()


# ── RVO ────────────────────────────────────────────────────────────────────────


def test_text_input_is_utrecht_textbox(render):
    html = render('<c-text-input name="email" type="email" placeholder="p" required/>')
    assert "utrecht-textbox" in html
    assert 'type="email"' in html and 'name="email"' in html
    assert 'placeholder="p"' in html and " required" in html
    assert "</input>" not in html  # void


def test_textarea_value_in_body(render):
    html = render('<c-textarea name="msg" value="Hello"/>')
    assert "<textarea" in html and "utrecht-textbox" in html
    assert ">Hello</textarea>" in html


def test_text_input_disabled_class(render):
    assert "utrecht-textbox--disabled" in render("<c-text-input disabled/>")


def test_text_input_escapes_value(render):
    html = render('<c-text-input value="<x>"/>')
    assert "<x>" not in html and "&lt;x&gt;" in html


# ── RVO: checkbox / radio / select (batch C) ──────────────────────────────────


def test_checkbox_rvo_structure(render):
    html = render('<c-checkbox name="agree" value="yes" label="I agree" checked/>')
    assert '<label class="rvo-checkbox"' in html
    assert '<input class="rvo-checkbox__input" type="checkbox"' in html
    assert 'name="agree"' in html and 'value="yes"' in html and " checked" in html
    assert "<span>I agree</span>" in html
    assert "</input>" not in html  # void


def test_checkbox_disabled_class(render):
    html = render("<c-checkbox disabled/>")
    assert "rvo-checkbox--disabled" in html and " disabled" in html


def test_radio_rvo_structure(render):
    html = render('<c-radio name="pick" value="a" label="Option A"/>')
    assert '<label class="rvo-radio-button__label"' in html
    assert '<input class="rvo-radio-button" type="radio"' in html
    assert 'name="pick"' in html and 'value="a"' in html
    assert "<span>Option A</span>" in html


def test_select_rvo_options_as_content(render):
    html = render('<c-select name="c"><c-option value="1" label="One"/></c-select>')
    assert '<div class="rvo-select-wrapper"' in html
    assert '<select class="utrecht-select utrecht-select--html-select" name="c">' in html
    assert "<option" in html and 'value="1">One</option>' in html
    assert "</select></div>" in html


def test_option_rvo_content_overrides_label(render):
    html = render('<c-option value="x" label="L">Body</c-option>')
    assert html.startswith("<option") and 'value="x">Body</option>' in html


def test_checkbox_escapes_label(render):
    html = render('<c-checkbox label="<x>"/>')
    assert "<x>" not in html and "&lt;x&gt;" in html


# ── NLDD ───────────────────────────────────────────────────────────────────────


def test_text_input_nldd():
    html = _env("nldd").from_string('<c-text-input name="email" type="email"/>').render()
    assert "<nldd-text-field" in html
    assert 'type="email"' in html
    assert "utrecht-" not in html


def test_textarea_nldd_value_attr():
    html = _env("nldd").from_string('<c-textarea name="m" value="Hi"/>').render()
    assert "<nldd-multi-line-text-field" in html
    assert 'value="Hi"' in html


def test_checkbox_nldd_field():
    html = _env("nldd").from_string('<c-checkbox name="a" label="Agree" checked/>').render()
    assert "<nldd-checkbox-field" in html
    assert 'label="Agree"' in html and " checked" in html
    assert "rvo-" not in html


def test_radio_nldd_field():
    html = _env("nldd").from_string('<c-radio name="p" value="a" label="A"/>').render()
    assert "<nldd-radio-button-field" in html
    assert 'label="A"' in html


def test_select_nldd_combo_box():
    html = _env("nldd").from_string(
        '<c-select name="c" placeholder="Pick"><c-option value="1" label="One"/></c-select>'
    ).render()
    assert "<nldd-combo-box" in html
    assert 'placeholder="Pick"' in html
    assert "<nldd-menu" in html
    assert "<nldd-menu-item" in html and 'value="1" text="One">' in html


def test_option_nldd_menu_item():
    html = _env("nldd").from_string('<c-option value="x" label="L"/>').render()
    assert html.startswith("<nldd-menu-item") and 'value="x" text="L">' in html
