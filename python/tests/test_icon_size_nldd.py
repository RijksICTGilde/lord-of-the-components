"""NLDD icon size mapping.

<nldd-icon> defaults to --_size:100% (fills its parent) and only recognises numeric
spacer tokens (16 20 24 28 32 40 44 48 56 64 80 96). Our t-shirt sizes must be
mapped onto that scale, or icons render enormous (blowing out any layout).
Regression for the bg.rijks.app recreation.
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


@pytest.mark.parametrize(
    "size,expected",
    [
        ("2xs", "16"),
        ("xs", "16"),
        ("sm", "20"),
        ("md", "24"),
        ("lg", "32"),
        ("xl", "40"),
        ("2xl", "48"),
        ("3xl", "64"),
        ("4xl", "96"),
    ],
)
def test_size_maps_to_numeric_spacer_token(nldd, size, expected):
    html = nldd(f'<c-icon icon="house" size="{size}"/>')
    assert f'size="{expected}"' in html


def test_default_size_is_numeric(nldd):
    # No explicit size -> default md -> 24, never a bare t-shirt token.
    html = nldd('<c-icon icon="house"/>')
    assert 'size="24"' in html
    for bad in ('size="md"', 'size="sm"', 'size="lg"'):
        assert bad not in html
