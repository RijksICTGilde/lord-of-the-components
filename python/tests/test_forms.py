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
