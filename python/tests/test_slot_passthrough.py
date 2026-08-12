"""`slot=` passes through to the rendered element (both backends).

`slot` is a global HTML attribute that assigns an element to a host's shadow-DOM
slot. Placing a LOTC component into a real custom element's named slot — e.g. a
`<nldd-page>` shell with `slot="header"` / `slot="footer"` regions — depends on it
reaching the output. It used to be accepted (no error) but silently dropped by the
generic-attribute emitters, so the whole slotted-composition pattern broke with no
signal. It is now emitted like id/style/role/tabindex.

LOTC's own named-slot mechanism (`<template slot="…">`) is unaffected: those are
extracted before rendering and never place `slot` in a child's context.
"""

from __future__ import annotations

from jinja2 import Environment, FileSystemLoader

from lord_of_the_components import setup_components

NLDD = ["lotc-layout", "nldd"]


def _render(source, design_systems=NLDD):
    env = Environment(autoescape=True, loader=FileSystemLoader([]))
    setup_components(env, design_systems=design_systems, on_missing_component="placeholder")
    return " ".join(env.from_string(source).render().split())


def test_slot_passes_through_on_jinja_backend():
    # top-title-bar is a jinja-backend component.
    assert 'slot="header"' in _render('<c-top-title-bar slot="header" text="T"/>')


def test_slot_passes_through_on_python_backend():
    # c-icon is a python-backend component.
    assert 'slot="header"' in _render('<c-icon icon="trash" slot="header"/>')


def test_component_composes_into_a_raw_custom_element_slots():
    # The motivating case: LOTC components filling <nldd-page>'s header/footer slots.
    out = _render(
        "<nldd-page>"
        '<c-top-title-bar slot="header" text="Titel"/>'
        "<c-simple-section>x</c-simple-section>"
        '<c-button-group slot="footer"><c-button type="primary" label="Opslaan"/></c-button-group>'
        "</nldd-page>"
    )
    assert 'nldd-top-title-bar' in out and 'slot="header"' in out
    assert 'nldd-button-group' in out and 'slot="footer"' in out


def test_template_named_slots_are_not_affected():
    # LOTC's own <template slot="…"> mechanism must not leak a slot= onto content.
    out = _render(
        '<c-app-shell><template slot="header">KOP</template>MAIN</c-app-shell>',
        design_systems=["lotc-layout", "nldd"],
    )
    assert "KOP" in out and "MAIN" in out
    # the header content is placed structurally, not via a stray slot attribute
    assert 'slot="header"' not in out
