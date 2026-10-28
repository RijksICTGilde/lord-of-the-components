"""Every attribute we put on <nldd-icon> must be one the vendored bundle reads.

NLDD 0.13.0 renamed the glyph attribute from `name` to `icon`. We kept emitting
`name=`, and <nldd-icon> without a known `icon` draws its circle-dashed
fallback: every icon on the page became a dotted circle, with no network or
console error. The markup tests passed because they checked our own spelling.

This reads the property list out of the bundle itself, so the next rename in an
NLDD upgrade fails here instead of in a browser.
"""

import re
from pathlib import Path

import pytest
from jinja2 import Environment, FileSystemLoader

from lord_of_the_components import setup_components

REPO = Path(__file__).resolve().parents[2]
BUNDLE = REPO / "packages" / "lotc-nldd" / "src" / "lotc_nldd" / "static" / "lotc" / "nldd" / "dist" / "nldd.js"
GLOBAL_ATTRS = {"class", "id", "style", "slot", "title", "role", "hidden"}

NLDD = ["lotc-layout", "nldd", "lotc-forms"]


def _declared_icon_attributes():
    js = BUNDLE.read_text(encoding="utf-8")
    end = js.index('"nldd-icon"', js.index("_loadIcon("))
    start = js.rindex("render(){", 0, end)
    chunk = js[start:end]
    attrs = set()
    for opts, prop in re.findall(r"\(\{([^}]*)\}\)\],\w+\.prototype,\"(\w+)\"", chunk):
        if "state" in opts:
            continue
        m = re.search(r'attribute:"([\w-]+)"', opts)
        attrs.add(m.group(1) if m else prop.lower())
    return attrs


def _render(src):
    env = Environment(autoescape=True, loader=FileSystemLoader([]))
    setup_components(env, design_systems=NLDD)
    return env.from_string(src).render()


def test_bundle_declares_icon_attribute():
    # Guards the parser below: if this fails, the bundle layout changed, not us.
    declared = _declared_icon_attributes()
    assert "icon" in declared and "size" in declared, declared


@pytest.mark.parametrize(
    "src",
    [
        '<c-icon icon="home"/>',
        '<c-icon icon="house" size="sm" color="primary"/>',
        '<c-secret-field value="sk-abc123" show-copy/>',
        '<c-text-input-field id="pn" name="pn" label="Naam" value="v" show-copy/>',
        '<c-metric icon="apartment-building" value="5" label="Datacenters"/>',
    ],
)
def test_nldd_icon_attributes_are_ones_the_bundle_reads(src):
    declared = _declared_icon_attributes()
    tags = re.findall(r"<nldd-icon(\s[^>]*)?>", _render(src))
    assert tags, f"no <nldd-icon> rendered for {src}"
    for tag in tags:
        for attr in re.findall(r"\s([\w:-]+)(?==|\s|$)", tag or ""):
            if attr in GLOBAL_ATTRS or attr.startswith(("data-", "aria-")):
                continue
            assert attr in declared, f"<nldd-icon {attr}=…> is not read by NLDD (reads {sorted(declared)})"
        assert re.search(r'\sicon="[^"]+"', tag or ""), f"<nldd-icon{tag}> has no icon= — draws the fallback"
