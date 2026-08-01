"""NLDD implementations for footer, hero, header (jinja-backend, per-theme templates)."""

from pathlib import Path

import pytest
from jinja2 import Environment, FileSystemLoader

from lord_of_the_components import setup_components

PKG = Path(__file__).resolve().parent.parent / "src" / "lord_of_the_components"


def _env(theme):
    env = Environment(loader=FileSystemLoader([str(PKG / "templates")]), autoescape=True)
    setup_components(env, design_systems=[theme], registry_path=str(PKG / "registry.json"))
    return env


@pytest.fixture
def nldd():
    env = _env("nldd")
    return lambda s: env.from_string(s).render()


@pytest.fixture
def rvo():
    env = _env("rvo")
    return lambda s: env.from_string(s).render()


def test_footer_nldd(nldd):
    html = nldd('<c-footer pay-off="Samen digitaal">Links</c-footer>')
    assert "<nldd-page-footer" in html
    assert "Samen digitaal" in html and "Links" in html


def test_header_nldd(nldd):
    html = nldd('<c-header text="Mijn App" subtitle="Portaal" link="/"/>')
    assert "<nldd-top-navigation-bar" in html
    assert 'logo-title="Mijn App"' in html
    assert 'logo-subtitle="Portaal"' in html
    assert 'website-href="/"' in html


def test_status_bar_renders(nldd):
    # status-bar is now a theme-agnostic banner (no native per-theme element);
    # the semantic type becomes a lotc-statusbar--<type> variant class.
    html = nldd('<c-status-bar text="Demo / mock-up. Geen productiedata."/>')
    assert "lotc-statusbar" in html and "lotc-statusbar--neutral" in html
    assert "Demo / mock-up. Geen productiedata." in html


def test_status_bar_type_variant(nldd):
    assert "lotc-statusbar--warning" in nldd('<c-status-bar type="warning" text="Storing"/>')
    assert "lotc-statusbar--error" in nldd('<c-status-bar type="error" text="Down"/>')


def test_hero_nldd(nldd):
    html = nldd('<c-hero title="Welkom" subtitle="Ondertitel" image="/img.png" image-alt="x"/>')
    assert "<nldd-hero" in html
    assert 'media-src="/img.png"' in html and 'media-alt="x"' in html
    assert "<nldd-title" in html and "Welkom" in html
    assert 'slot="subtitle"' in html and "Ondertitel" in html


def test_still_rvo(rvo):
    # RVO versions unchanged (own templates in lotc-rvo).
    assert "rvo-footer" in rvo('<c-footer pay-off="x"/>')
    assert "rvo-hero" in rvo('<c-hero title="x"/>')
    assert "rvo-header" in rvo('<c-header text="x"/>')


def test_hyphenated_prop_in_text_resolves(nldd):
    # The generator fix: a hyphenated prop (pay-off) in a text expression must
    # resolve to its snake_cased var, not `pay-off` (which Jinja reads as pay minus off).
    html = nldd('<c-footer pay-off="Tekst met streepje">x</c-footer>')
    assert "Tekst met streepje" in html


def test_footer_legal_bar(nldd):
    # The footer's legal sub-bar: c-page-footer-legal-bar (+ -item) fill
    # nldd-page-footer's `legal-bar` slot, items go in the bar's `start`/`end`.
    html = nldd(
        "<c-footer>"
        '<template slot="legal-bar"><c-page-footer-legal-bar>'
        '<template slot="start">'
        '<c-page-footer-legal-bar-item href="/toegankelijkheid" text="Toegankelijkheid"/>'
        "</template></c-page-footer-legal-bar></template></c-footer>"
    )
    assert '<div slot="legal-bar">' in html
    assert "<nldd-page-footer-legal-bar" in html
    assert '<nldd-page-footer-legal-bar-item' in html
    assert 'text="Toegankelijkheid"' in html and 'href="/toegankelijkheid"' in html
    assert "not implemented" not in html
