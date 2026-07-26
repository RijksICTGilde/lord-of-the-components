"""Feedback components — tag and badge (plan v7 F9, batch F)."""

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


def test_tag_rvo_type_class(render):
    html = render("<c-tag type=\"warning\">Concept</c-tag>")
    assert 'class="rvo-tag rvo-tag--warning"' in html
    assert ">Concept</div>" in html


def test_tag_rvo_default_type(render):
    assert "rvo-tag--default" in render("<c-tag>Label</c-tag>")


def test_badge_rvo(render):
    html = render('<c-badge label="3"/>')
    assert '<span class="rvo-badge"' in html and ">3</span>" in html


def test_tag_escapes_label(render):
    html = render('<c-tag label="<x>"/>')
    assert "<x>" not in html and "&lt;x&gt;" in html


# ── NLDD ───────────────────────────────────────────────────────────────────────


def test_tag_nldd_color_mapping():
    html = _env("nldd").from_string("<c-tag type=\"error\">Fout</c-tag>").render()
    assert "<nldd-tag" in html
    assert 'color="critical"' in html  # error -> critical
    assert ">Fout</nldd-tag>" in html


def test_badge_nldd_color_and_text():
    html = _env("nldd").from_string('<c-badge type="success" label="9"/>').render()
    assert "<nldd-badge" in html
    assert 'color="success"' in html and 'text="9"' in html
