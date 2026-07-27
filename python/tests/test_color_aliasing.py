"""Semantic color aliasing (plan v7 — semantic aliasing).

`<c-icon color="primary"/>` uses a SEMANTIC color name; each theme resolves it
through definitions/colors.ts to its own palette. Raw theme color names still
pass through unchanged (the escape hatch), mirroring the icon-name aliasing.
"""

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
def rvo():
    env = _env("rvo")
    return lambda s: env.from_string(s).render()


@pytest.fixture
def nldd():
    env = _env("nldd")
    return lambda s: env.from_string(s).render()


# ── RVO: semantic name -> RVO palette (as an rvo-icon--{name} class) ──────────


def test_rvo_primary(rvo):
    assert "rvo-icon--hemelblauw" in rvo('<c-icon icon="home" color="primary"/>')


def test_rvo_muted(rvo):
    assert "rvo-icon--grijs-700" in rvo('<c-icon icon="home" color="muted"/>')


def test_rvo_inverse(rvo):
    assert "rvo-icon--wit" in rvo('<c-icon icon="home" color="inverse"/>')


def test_rvo_raw_color_passes_through(rvo):
    # Unlisted / raw theme color still works (escape hatch).
    assert "rvo-icon--donkerblauw" in rvo('<c-icon icon="home" color="donkerblauw"/>')


# ── NLDD: semantic name -> NLDD palette (as the color attribute) ──────────────


def test_nldd_primary(nldd):
    assert 'color="accent"' in nldd('<c-icon icon="home" color="primary"/>')


def test_nldd_muted(nldd):
    assert 'color="secondary-content"' in nldd('<c-icon icon="home" color="muted"/>')


def test_nldd_raw_color_passes_through(nldd):
    assert 'color="donkerblauw"' in nldd('<c-icon icon="home" color="donkerblauw"/>')


# ── Same semantic name, different resolved value per theme ────────────────────


def test_primary_differs_across_themes(rvo, nldd):
    assert "hemelblauw" in rvo('<c-icon icon="home" color="primary"/>')
    assert 'color="accent"' in nldd('<c-icon icon="home" color="primary"/>')


# ── The alias also drives icon-colored buttons / links (RVO icon spans) ───────


def test_button_icon_color_alias(rvo):
    html = rvo('<c-button label="Go" icon="home" show-icon="before" color="primary"/>')
    assert "rvo-icon--hemelblauw" in html


def test_link_icon_color_alias(rvo):
    html = rvo('<c-link href="#" icon="home" show-icon="before" icon-color="muted">x</c-link>')
    assert "rvo-icon--grijs-700" in html
