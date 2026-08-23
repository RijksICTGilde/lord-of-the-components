"""A value we hand to NLDD must be one NLDD accepts.

`gap` on `c-layout-flow` is the layout layer's t-shirt scale; `gap` on
`nldd-container` is NLDD's PaddingSize ('0' | '2' | ... | '96'). The
implementation passed the t-shirt size straight through, so `gap="md"` reached
the browser as an invalid value, which resolves to `normal` — no gap at all, and
no error anywhere. One application had 189 of them, every card with its heading
against its body, found only by looking at a screenshot (RIG-Cluster, RC-151).

Strictness pointed the wrong way here, which is why no gate caught it:
`gap="md"` passes because it is in OUR enum, while `gap="16"` — the value that
actually works — is rejected. Two vocabularies, each internally consistent.
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
CEM = ROOT / "node_modules/@nldd/design-system/custom-elements.json"
TYPES = ROOT / "node_modules/@nldd/design-system/dist"


@pytest.fixture(scope="module")
def render():
    env = Environment(
        loader=FileSystemLoader([str(PKG / "templates"), str(PACKAGES / "lotc-nldd/src/lotc_nldd/templates")]),
        autoescape=True,
    )
    setup_components(
        env,
        design_systems=["lotc-layout", "nldd"],
        registry_path=str(PKG / "registry.json"),
    )
    return lambda src: env.from_string(src).render()


def _padding_sizes():
    """NLDD's PaddingSize union, read from its own type declarations."""
    for declaration in TYPES.rglob("*.d.ts"):
        match = re.search(r"PaddingSize\s*=\s*([^;]+)", declaration.read_text(encoding="utf-8"))
        if match and "|" in match.group(1):
            return {v.strip().strip("'\"") for v in match.group(1).split("|")}
    return set()


def test_padding_sizes_were_found():
    """Negative control: an empty set would make the checks below vacuous."""
    sizes = _padding_sizes()
    assert {"0", "16", "96"} <= sizes, f"PaddingSize not parsed, got {sizes}"


@pytest.mark.parametrize("component,attribute", [("layout-flow", "gap"), ("card", "padding")])
def test_every_declared_value_survives_the_translation(render, component, attribute):
    """Walk OUR enum and check what NLDD is handed for each of its values."""
    registry = json.loads((PKG / "registry.json").read_text(encoding="utf-8"))
    definition = next(c for c in registry["components"] if c["name"] == component)
    declared = next(a for a in definition["attributes"] if a["name"] == attribute)
    assert declared.get("enum_values"), f"{component}.{attribute} is no longer an enum"

    allowed = _padding_sizes()
    wrong = {}
    for value in declared["enum_values"]:
        out = render(f'<c-{component} {attribute}="{value}">x</c-{component}>')
        emitted = re.search(rf'\b{attribute}="([^"]*)"', out)
        if emitted and emitted.group(1) not in allowed:
            wrong[value] = emitted.group(1)
    assert not wrong, (
        f"c-{component} hands NLDD values it does not accept (t-shirt sizes reach "
        f"the browser as `normal`, i.e. no spacing at all): {wrong}"
    )


def test_the_translation_is_by_value_not_by_position(render):
    """1rem is 16px at the root, so `md` must be 16 — not 'the fifth step'."""
    for size, expected in (("3xs", "2"), ("xs", "8"), ("md", "16"), ("lg", "24")):
        out = render(f'<c-layout-flow gap="{size}">x</c-layout-flow>')
        assert f'gap="{expected}"' in out, f"gap={size} should hand NLDD {expected}"


def test_a_named_union_becomes_an_enum_not_a_free_string():
    """An optional attribute's type reads `PaddingSize | undefined`.

    Looking that text up verbatim found nothing, so 129 attributes across 11
    unions were declared as free strings — and a free string is not validated at
    all. `<c-container gap="onzin">` passed happily, and NLDD resolves an unknown
    PaddingSize to `normal`: no spacing, no error (RIG-Cluster, RC-151).
    """
    manifest = json.loads(CEM.read_text(encoding="utf-8"))
    unions = {}
    for declaration in TYPES.rglob("*.d.ts"):
        for match in re.finditer(
            r"type ([A-Z][A-Za-z0-9]+) = ((?:'[^']*' ?\| ?)*'[^']*');",
            declaration.read_text(encoding="utf-8"),
        ):
            unions[match.group(1)] = [v.strip().strip("'") for v in match.group(2).split("|")]
    assert "PaddingSize" in unions, "the union types were not parsed"

    registry = json.loads((PACKAGES / "lotc-nldd/src/lotc_nldd/registry.json").read_text(encoding="utf-8"))
    ours = {c["name"]: {a["name"]: a for a in c["attributes"]} for c in registry["components"]}

    free_strings = []
    for module in manifest["modules"]:
        for declaration in module.get("declarations", []):
            tag = declaration.get("tagName")
            if not tag:
                continue
            name = tag[len("nldd-") :]
            for attribute in declaration.get("attributes") or []:
                text = (attribute.get("type") or {}).get("text", "")
                base = re.sub(r"\|\s*(undefined|null)", "", text).strip()
                if base not in unions:
                    continue
                declared = ours.get(name, {}).get(attribute["name"])
                if declared and declared.get("type") != "enum":
                    free_strings.append(f"{name}.{attribute['name']} ({base})")
    assert not free_strings, (
        "these have a named union upstream but are free strings here, so nothing "
        f"validates them: {free_strings[:10]} (+{max(0, len(free_strings) - 10)} more)"
    )
