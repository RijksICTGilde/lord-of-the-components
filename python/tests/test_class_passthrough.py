"""`class` must survive on every component, in every layer.

A generated NLDD renderer swallowed it: `class` is not a manifest attribute, so
the generator never emitted it, and the shared passthrough macro covers
id/title/style/role/tabindex/slot but not class. Hand-authored components passed
it on, so moving a page from one to the other lost 23 hooks at once — a script
looking for `.service-cards-grid` found nothing and a click stopped working,
with no error anywhere (RIG-Cluster, RC-151).

The class attribute is how an application reaches a component from its own CSS
and JavaScript. Dropping it silently is the one outcome that helps nobody.
"""

import json
import re
from pathlib import Path

import pytest
from jinja2 import Environment, FileSystemLoader

from lord_of_the_components import setup_components

ROOT = Path(__file__).resolve().parents[2]
PKG = ROOT / "python/src/lord_of_the_components"
PACKAGES = ROOT / "packages"

#: A class nothing else would ever produce.
PROBE = "lotc-probe-class-x9"

#: Components that legitimately do not carry the class on themselves.
#: `page` puts it on <body> (documented, and its own tests pin that).
NOT_ON_THE_ELEMENT = {"page"}

#: Hand-authored components that still swallow `class`, measured. The generated
#: NLDD renderers are fixed — that is the one RIG-Cluster hit — but the same gap
#: runs through hand-written templates, and it is NOT a mechanical sweep: their
#: root class is often built with Jinja inside the attribute
#: (`class="lotc-action{% if tone != 'neutral' %}…"`), and several tests pin the
#: exact class string. A scripted pass produced 11 broken templates before this
#: list existed.
#:
#: The list may only ever SHRINK. Fixing one means removing its name; a new
#: component that swallows class fails this test rather than joining them.
KNOWN_SWALLOWERS = {
    "action",
    "activity-item",
    "breadcrumbs",
    "breadcrumbs-item",
    "catalog-card",
    "checkbox-field",
    "date-input-field",
    "detail-item",
    "detail-list",
    "em",
    "file-input-field",
    "filter-bar",
    "filter-select",
    "gauge",
    "identity",
    "label",
    "layer",
    "layout-column",
    "layout-row",
    "line-chart",
    "max-width-layout",
    "menu-item",
    "notification-item",
    "radio-button-field",
    "section-head",
    "section-link",
    "select-field",
    "shortcut",
    "sidenav-group",
    "sidenav-item",
    "site-footer",
    "strong",
    "text-input-field",
    "textarea-field",
}


@pytest.fixture(scope="module")
def render():
    env = Environment(
        loader=FileSystemLoader(
            [
                str(PKG / "templates"),
                str(PACKAGES / "lotc-nldd/src/lotc_nldd/templates"),
                str(PACKAGES / "lotc-forms/src/lotc_forms/templates"),
                str(PACKAGES / "lotc-charts/src/lotc_charts/templates"),
            ]
        ),
        autoescape=True,
    )
    setup_components(
        env,
        design_systems=["lotc-layout", "nldd", "lotc-forms", "lotc-charts"],
        registry_path=str(PKG / "registry.json"),
        on_missing_component="placeholder",
    )
    return lambda src: env.from_string(src).render()


def _component_names():
    names = set()
    for registry_file in (
        PKG / "registry.json",
        PACKAGES / "lotc-nldd/src/lotc_nldd/registry.json",
        PACKAGES / "lotc-forms/src/lotc_forms/registry.json",
        PACKAGES / "lotc-charts/src/lotc_charts/registry.json",
    ):
        names |= {c["name"] for c in json.loads(registry_file.read_text(encoding="utf-8"))["components"]}
    return sorted(names)


def test_every_component_passes_class_through(render):
    swallowed = []
    for name in _component_names():
        if name in NOT_ON_THE_ELEMENT:
            continue
        try:
            out = render(f'<c-{name} class="{PROBE}">x</c-{name}>')
        except Exception as exc:  # a component we cannot render says nothing here
            swallowed.append(f"{name} (could not render: {str(exc)[:60]})")
            continue
        if PROBE not in out:
            swallowed.append(name)
    new = sorted(set(swallowed) - KNOWN_SWALLOWERS)
    assert not new, f"these components drop `class`: {new}"
    fixed = sorted(KNOWN_SWALLOWERS - set(swallowed))
    assert not fixed, f"these now pass `class` through — remove them from KNOWN_SWALLOWERS: {fixed}"


def test_every_generated_nldd_renderer_passes_class_through(render):
    """The layer RIG-Cluster hit, and the one that is fully fixed.

    An application moving a page from a hand-written component to a generated
    one lost its styling and scripting hooks without a word.
    """
    generated = ROOT / "packages/lotc-nldd/src/lotc_nldd/templates/components"
    names = [
        f.name[: -len(".html.j2")]
        for f in sorted(generated.glob("*.html.j2"))
        if not f.name.startswith("_") and "Auto-generated" in f.read_text(encoding="utf-8")
    ]
    assert len(names) > 50, f"expected the generated set, found {len(names)}"
    swallowed = [n for n in names if PROBE not in render(f'<c-{n} class="{PROBE}">x</c-{n}>')]
    assert not swallowed, f"generated renderers dropping `class`: {swallowed}"


def test_class_lands_on_the_outermost_element(render):
    """Not just present somewhere — on the element the author is styling."""
    for name in ("container", "avatar", "card", "box"):
        out = render(f'<c-{name} class="{PROBE}">x</c-{name}>').strip()
        first_tag = re.search(r"<[a-z][a-z0-9-]*[^>]*>", out)
        assert first_tag and PROBE in first_tag.group(0), f"c-{name}: class is not on the root"


def test_page_puts_it_on_the_body(render):
    """The documented exception, pinned so it stays a decision."""
    out = render(f'<c-page title="T" class="{PROBE}">x</c-page>')
    body = re.search(r"<body([^>]*)>", out)
    assert body and PROBE in body.group(1)


def test_class_and_the_attrs_spread_do_not_fight(render):
    """A spread can also carry class; the author gets both, not neither."""
    out = render(f"<c-container class=\"{PROBE}\" :attrs=\"{{'class': 'from-spread'}}\">x</c-container>")
    assert PROBE in out and "from-spread" in out
