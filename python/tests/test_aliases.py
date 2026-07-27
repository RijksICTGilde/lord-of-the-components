"""Convenience tag aliases: c-p -> paragraph, c-h1..c-h6 -> heading type=hN."""

from pathlib import Path

import pytest
from jinja2 import Environment, FileSystemLoader

from lord_of_the_components import setup_components

PKG = Path(__file__).resolve().parent.parent / "src" / "lord_of_the_components"


@pytest.fixture
def render():
    env = Environment(loader=FileSystemLoader([str(PKG / "templates")]), autoescape=True)
    setup_components(env, design_systems=["rvo"], registry_path=str(PKG / "registry.json"))
    return lambda s: env.from_string(s).render()


def test_c_p_is_paragraph(render):
    html = render("<c-p>Een paragraaf.</c-p>")
    assert "<p " in html and "rvo-paragraph" in html
    assert "Een paragraaf." in html


@pytest.mark.parametrize("level", [1, 2, 3, 4, 5, 6])
def test_c_hN_is_heading(render, level):
    html = render(f"<c-h{level}>Titel</c-h{level}>")
    assert f"<h{level} " in html
    assert f"utrecht-heading-{level}" in html
    assert "Titel" in html


def test_author_type_overrides_alias_default(render):
    # <c-h2 type="h4"> -> the explicit type wins over the alias default.
    html = render('<c-h2 type="h4">X</c-h2>')
    assert "<h4 " in html


def test_canonical_names_still_work(render):
    assert "rvo-paragraph" in render("<c-paragraph>x</c-paragraph>")
    assert "utrecht-heading-2" in render('<c-heading type="h2">y</c-heading>')


def test_alias_unknown_attribute_reports_alias_tag(render):
    # Errors reference the alias tag the author actually wrote.
    from lord_of_the_components.extension import ComponentError

    with pytest.raises(ComponentError) as exc:
        render('<c-p bogus="1">x</c-p>')
    assert "c-p" in str(exc.value)
