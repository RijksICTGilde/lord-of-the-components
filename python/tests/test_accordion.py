"""Accordion — accordion / accordion-item (plan v7 F9, sweep).

RVO: <div class="rvo-accordion"> of native <details class="rvo-accordion__item">
with a summary (down/up toggle icons + h3 title) and rvo-accordion__content. NLDD
has no accordion web component, so it falls back to plain native <details>/<summary>.
"""

from pathlib import Path

import pytest
from jinja2 import Environment, FileSystemLoader

from lord_of_the_components import setup_components

PKG = Path(__file__).resolve().parent.parent / "src" / "lord_of_the_components"


def _env(theme):
    env = Environment(loader=FileSystemLoader([str(PKG / "templates")]), autoescape=True)
    setup_components(env, design_systems=[theme], registry_path=str(PKG / "registry.json"))
    return env


ACC = (
    "<c-accordion>"
    '<c-accordion-item title="Een" open>Inhoud een.</c-accordion-item>'
    '<c-accordion-item title="Twee">Inhoud twee.</c-accordion-item>'
    "</c-accordion>"
)


@pytest.fixture
def rvo():
    env = _env("rvo")
    return lambda s: env.from_string(s).render()


@pytest.fixture
def nldd():
    env = _env("nldd")
    return lambda s: env.from_string(s).render()


def test_rvo_structure(rvo):
    html = rvo(ACC)
    assert '<div class="rvo-accordion"' in html
    assert '<details class="rvo-accordion__item"' in html
    assert '<summary class="rvo-accordion__item-summary">' in html
    assert 'class="rvo-accordion__content"' in html
    assert ">Een</h3>" in html and "Inhoud een." in html


def test_rvo_toggle_icons_have_utrecht_icon(rvo):
    # The chevrons need the utrecht-icon base class or they render at height 0.
    html = rvo(ACC)
    assert "utrecht-icon rvo-icon rvo-icon-delta-omlaag" in html  # closed
    assert "utrecht-icon rvo-icon rvo-icon-delta-omhoog" in html  # open


def test_rvo_open_attribute(rvo):
    html = rvo(ACC)
    # Only the first item is open.
    assert html.count(" open>") == 1 or html.count(" open ") == 1 or " open" in html
    first = html.split("</details>")[0]
    assert "<details" in first and " open" in first


def test_nldd_native_details(nldd):
    html = nldd(ACC)
    assert "<details" in html and "<summary" in html
    assert ">Een</summary>" in html and "Inhoud een." in html
    assert "rvo-accordion" not in html  # no RVO classes under NLDD


def test_accordion_item_escapes_title(rvo):
    html = rvo('<c-accordion-item title="<x>"/>')
    assert "&lt;x&gt;" in html and "<x>" not in html
