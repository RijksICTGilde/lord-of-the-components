"""Tabs — tabs / tab (plan v7 F9, sweep).

RVO: <div class="rvo-tabs"><nav class="rvo-tabs__nav" role="tablist"> with
<a class="rvo-tab"> items (rvo-tab--active for the active one). NLDD: <nldd-tab-bar>
with <nldd-tab-bar-item> (label via text, active via selected).
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


TABS = (
    '<c-tabs aria-label="Secties">'
    '<c-tab label="Overzicht" href="#o" active/>'
    '<c-tab label="Details" href="#d"/>'
    "</c-tabs>"
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
    html = rvo(TABS)
    assert '<ul class="rvo-tabs rvo-ul rvo-ul--no-margin rvo-ul--no-padding"' in html
    assert 'role="tablist"' in html
    assert '<li class="rvo-tabs__item"' in html
    assert '<a class="rvo-tabs__item-link rvo-tabs__item-link--active"' in html
    assert 'href="#o"' in html
    assert ">Overzicht</a>" in html and ">Details</a>" in html


def test_rvo_only_active_tab_has_modifier(rvo):
    html = rvo(TABS)
    assert html.count("rvo-tabs__item-link--active") == 1


def test_rvo_tab_standalone(rvo):
    assert rvo('<c-tab label="X" href="#"/>').startswith("<li")


def test_nldd_structure(nldd):
    html = nldd(TABS)
    assert "<nldd-tab-bar" in html
    assert "<nldd-tab-bar-item" in html
    assert 'text="Overzicht"' in html and 'href="#o"' in html
    assert " selected" in html  # the active tab


def test_nldd_only_active_selected(nldd):
    assert nldd(TABS).count(" selected") == 1


def test_tab_escapes_label(rvo):
    html = rvo('<c-tab label="<x>"/>')
    assert "<x>" not in html and "&lt;x&gt;" in html
