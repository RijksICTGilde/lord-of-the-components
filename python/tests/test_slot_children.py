"""A component must never swallow its children.

Fifteen generated NLDD renderers emitted only their named slots, so anything
written between the tags disappeared — no error, just an empty element. Six of
them make up the application shell, so a whole page rendered as an empty
`<nldd-bar-split-view>` with every gate green (reported by RIG-Cluster, RC-151).

The named-slot path (`<template slot="…">`) was no way around it: it wraps the
content in a `<div slot="…">`, and a split view wants its panels as DIRECT
children carrying their own `slot=`.
"""

import json
import re
from pathlib import Path

import pytest
from jinja2 import Environment, FileSystemLoader

from lord_of_the_components import setup_components

ROOT = Path(__file__).resolve().parents[2]
PKG = ROOT / "python/src/lord_of_the_components"
NLDD_TEMPLATES = ROOT / "packages/lotc-nldd/src/lotc_nldd/templates"
GENERATED = "Auto-generated"


@pytest.fixture(scope="module")
def render():
    env = Environment(
        loader=FileSystemLoader([str(PKG / "templates"), str(NLDD_TEMPLATES)]), autoescape=True
    )
    setup_components(env, design_systems=["nldd"], registry_path=str(PKG / "registry.json"))
    return lambda s: env.from_string(s).render()


def _generated_templates():
    for path in sorted((NLDD_TEMPLATES / "components").glob("*.html.j2")):
        if path.name.startswith("_"):
            continue
        text = path.read_text(encoding="utf-8")
        if GENERATED in text:
            yield path.name[: -len(".html.j2")], text


def test_every_generated_template_renders_its_content():
    without = [name for name, text in _generated_templates() if "get('content'" not in text]
    assert not without, (
        "these templates never read `content`, so children written between the "
        f"tags vanish silently: {without}"
    )


def test_the_shell_components_keep_their_children(render):
    """The six the application shell is built from, end to end."""
    for name in (
        "bar-split-view",
        "navigation-split-view",
        "toolbar",
        "toolbar-title",
        "icon-button",
        "top-title-bar",
    ):
        out = render(f"<c-{name}><p>CHILD</p></c-{name}>")
        assert "CHILD" in out, f"c-{name} dropped its child"
        # and it is really INSIDE the element, not merely somewhere on the page
        inner = re.search(rf"<nldd-{name}\b[^>]*>(.*?)</nldd-{name}>", out, re.S)
        assert inner and "CHILD" in inner.group(1), f"c-{name} put its child outside the tag"


def test_a_child_keeps_its_own_slot_attribute(render):
    """What `<template slot="…">` cannot do: a direct child with its own slot.

    bar-split-view's manifest lists `main` and `*`, where `*` reads "any other
    unique slot name creates a bar panel" — a wildcard, not a name. It used to be
    emitted as a literal `<div slot="*">`, a slot that does not exist.
    """
    out = render('<c-bar-split-view><c-split-view-pane slot="header">H</c-split-view-pane></c-bar-split-view>')
    assert 'slot="header"' in out and 'slot="*"' not in out
    assert "<nldd-split-view-pane" in out and "H" in out


def test_no_template_emits_the_wildcard_as_a_slot_name():
    offenders = [name for name, text in _generated_templates() if 'slot="*"' in text]
    assert not offenders, f"`*` is a wildcard, not a slot name: {offenders}"


def test_no_generated_template_is_left_behind():
    """A component that disappears upstream must take its template with it.

    `list-item-action` (removed in 0.8.83) and `byline` (gone earlier) both
    lingered: unreachable through the registry, and rendering a tag the bundle
    no longer defines.
    """
    registry = json.loads((NLDD_TEMPLATES.parent / "registry.json").read_text(encoding="utf-8"))
    known = {c["name"] for c in registry["components"]}
    orphans = [name for name, _ in _generated_templates() if name not in known]
    assert not orphans, f"generated templates with no component in the registry: {orphans}"


# ── behaviour that is a method, not an attribute ─────────────────────────────

def test_method_only_components_are_recorded_and_documented():
    """`show` on a sheet reads like an attribute and is not — it is a METHOD.

    Setting the attribute does nothing, and neither does `el.show = true`; only
    `el.show()` opens it. RIG-Cluster (RC-151) measured that in a browser and it
    is not one component but six, five of which sit in the `layout` category
    that AUTHORING.md's catalogue leaves out — so without its own section they
    would be documented nowhere.
    """
    registry = json.loads((NLDD_TEMPLATES.parent / "registry.json").read_text(encoding="utf-8"))
    opened_by_method = {
        c["name"]
        for c in registry["components"]
        if any(m == "show" or re.match(r"^show[A-Z]", m) for m in c.get("methods", []))
    }
    assert "sheet" in opened_by_method and "modal-dialog" in opened_by_method

    authoring = (ROOT / "AUTHORING.md").read_text(encoding="utf-8")
    for name in opened_by_method:
        assert f"`<c-{name}>`" in authoring, f"c-{name} opens only from JS and says so nowhere"
    assert "not show=" in authoring  # the trap itself, spelled out


def test_a_declarative_state_is_not_called_js_only():
    """`toggle()` on a switch is a convenience — `checked` is the real door.

    Only show()/hide() earn the warning, or the note cries wolf on every control
    that happens to expose a helper.
    """
    registry = json.loads((NLDD_TEMPLATES.parent / "registry.json").read_text(encoding="utf-8"))
    switch = next(c for c in registry["components"] if c["name"] == "switch")
    assert "toggle" in switch.get("methods", [])
    assert {a["name"] for a in switch["attributes"]} & {"checked"}
    authoring = (ROOT / "AUTHORING.md").read_text(encoding="utf-8")
    section = authoring.split("### Opening a sheet")[1].split("\n\n**")[0]
    assert "`<c-switch>`" not in section
