"""NLDD button icons via start-icon/end-icon (the attribute `when` guard).

show-icon selects which attribute carries the icon; the semantic icon name is
resolved to the NLDD icon set. Exercises the generator's per-attribute `when`
condition (an attribute gated on ANOTHER prop).
"""

from pathlib import Path

import pytest
from jinja2 import Environment, FileSystemLoader

from lord_of_the_components import setup_components

PKG = Path(__file__).resolve().parent.parent / "src" / "lord_of_the_components"


@pytest.fixture
def nldd():
    env = Environment(loader=FileSystemLoader([str(PKG / "templates")]), autoescape=True)
    setup_components(env, design_systems=["nldd"], registry_path=str(PKG / "registry.json"))
    return lambda s: env.from_string(s).render()


def test_icon_after_maps_to_end_icon(nldd):
    html = nldd('<c-button type="primary" label="Volgende" icon="arrow-right" show-icon="after"/>')
    assert 'end-icon="arrow-right"' in html
    assert "start-icon" not in html


def test_icon_before_maps_to_start_icon(nldd):
    html = nldd('<c-button type="secondary" label="Terug" icon="arrow-left" show-icon="before"/>')
    assert 'start-icon="arrow-left"' in html
    assert "end-icon" not in html


def test_semantic_icon_name_resolved(nldd):
    # home -> house in the NLDD icon set (definitions/icons.ts).
    html = nldd('<c-button label="Home" icon="home" show-icon="before"/>')
    assert 'start-icon="house"' in html


def test_no_icon_emits_neither(nldd):
    html = nldd('<c-button type="primary" label="Plain"/>')
    assert "start-icon" not in html and "end-icon" not in html
