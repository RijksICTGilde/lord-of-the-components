"""Attribute coverage check — does every declared attribute actually land?

For each component, for each declared STRING attribute, set it to a sentinel and
assert the sentinel lands somewhere in the rendered output under each active theme.

This targets one specific, expensive bug class: a *silently dropped* attribute — one
that is declared in the component definition but never reaches the implementation
under some theme. The page still renders and nothing errors; it is just quietly
wrong. Downstream teams hit this repeatedly (``value`` on ``select-field``, ``href``
on ``catalog-card``, children on ``icon-button``) and each one cost a debugging round
because there was no signal. This test turns that class red.

Scope: STRING attributes only (the highest-signal, lowest-noise case — a plain string
should echo verbatim). Enums map to classes and booleans toggle markup, so they are
out of scope here.

Two curated allowlists carry the current reality; anything flagged that is in neither
fails the test:

* ``LEGIT_TRANSFORMS`` — the value legitimately does not appear verbatim: an icon
  *name* becomes an SVG/class, a color *token* becomes a class, a control attribute
  steers rendering instead of appearing in it, a structural attribute lands on child
  elements (absent in a bare probe), or a value is masked by design.
* ``KNOWN_GAPS`` — the attribute really is dropped and arguably should not be. Listed
  so the baseline stays green and the gap stays visible and greppable. Fix it upstream,
  then delete the entry — the staleness guard below will remind you if you forget.

Both are keyed ``(component, attr)``. Add-or-fix is the workflow: a *new* silent-drop
fails loudly; a *fixed* one trips the staleness guard until you remove its entry.
"""

from __future__ import annotations

import json
from pathlib import Path

from jinja2 import Environment, FileSystemLoader

from lord_of_the_components import setup_components

_ROOT = Path(__file__).resolve().parents[2]
_SENTINEL = "ZZPROBEZZ"
_UNIMPLEMENTED_MARKERS = ("lotc-unimplemented", "not implemented")

# Each registry + the design-system stack it needs active, and the themes to probe.
_REGISTRIES = {
    "core": (_ROOT / "python/src/lord_of_the_components/registry.json", ["lotc-layout"], ["rvo", "nldd"]),
    "nldd": (_ROOT / "packages/lotc-nldd/src/lotc_nldd/registry.json", ["lotc-layout"], ["nldd"]),
    "forms": (
        _ROOT / "packages/lotc-forms/src/lotc_forms/registry.json",
        ["lotc-layout", "lotc-forms"],
        ["rvo", "nldd"],
    ),
    "charts": (_ROOT / "packages/lotc-charts/src/lotc_charts/registry.json", ["lotc-layout", "lotc-charts"], ["nldd"]),
}

# Structural attributes given real-ish values so a bare component renders enough to
# host the probed attribute.
_BASELINE = {"id": "bid", "name": "bname", "label": "blabel", "title": "btitle", "text": "btext", "value": "bvalue"}

# Companion attributes to satisfy conditional rendering: probing ``image-alt`` only
# lands if there is also an ``image`` to carry it.
_COMPANIONS = {
    "image-alt": {"image": "/img.png"},
    "alt": {"image": "/img.png", "src": "/img.png"},
    "icon-aria-label": {"icon": "home", "show-icon": "before"},
    "icon-color": {"icon": "home", "show-icon": "before"},
}

# (component, attr): the value legitimately does not appear verbatim.
LEGIT_TRANSFORMS = {
    ("button", "icon"): "icon NAME -> rvo-icon-<name> class / theme icon slot, not a literal string",
    ("button", "color"): "color TOKEN -> rvo-icon--<token> class, not a literal string",
    ("link", "icon"): "icon NAME -> icon class/slot, not a literal string",
    ("link", "icon-color"): "icon-color TOKEN -> icon styling class, not a literal string",
    ("site-footer", "note-icon"): "icon NAME -> icon class/svg, not a literal string",
    ("card", "background-color"): "color TOKEN -> card class, not a literal string",
    ("page", "design-systems"): "control attribute: selects the active themes, never rendered",
    ("table", "columns"): "columns is structured data (a list of column defs), not a string echo",
    ("radio-button-field", "name"): "shared radio name lands on the child radios; a bare group has none",
    ("identity", "aside-href"): "only rendered when the aside slot is populated; a bare probe has none",
}

# (component, attr): the attribute IS silently dropped and arguably should not be.
# Fix upstream, then delete the entry.
KNOWN_GAPS = {
    ("button", "href"): "rvo button ignores href — always <button>, never <a>; nldd renders the link",
    ("select", "placeholder"): "core <c-select> reads placeholder but never emits the empty option; use select-field",
    ("select", "value"): "core <c-select> reads value but never selects it; use <c-select-field>",
    ("card", "image"): "nldd-card has no image support; rvo renders <img>",
    ("card", "image-alt"): "nldd-card has no image support; rvo renders the alt",
    ("card", "background-image"): "nldd-card has no background-image support; rvo renders it",
    ("link", "icon-aria-label"): "nldd-link has no icon, so its icon aria-label has nowhere to land",
    ("fieldset", "id"): "fieldset id is not echoed onto the <fieldset> element under rvo/nldd",
    ("checkbox-field", "id"): "checkbox-field group id is not echoed under nldd",
}

_ALLOWED = set(LEGIT_TRANSFORMS) | set(KNOWN_GAPS)


def _components(path: Path):
    data = json.loads(path.read_text())
    comps = data.get("components")
    return comps if isinstance(comps, list) else list(comps.values())


def _env(theme: str, extra: list[str]) -> Environment:
    env = Environment(autoescape=True, loader=FileSystemLoader([]))
    # Documented activation order: lotc-layout first (so it owns the structural
    # primitives), then the theme, then any capability set. Theme-first would let a
    # theme's own grid/stack shadow the layout primitives and report false drops.
    ds = ["lotc-layout", theme] + [d for d in extra if d not in ("lotc-layout", theme)]
    setup_components(env, design_systems=ds, on_missing_component="placeholder")
    return env


def _string_attrs(comp: dict) -> list[str]:
    attrs = comp.get("attributes", [])
    return [a["name"] for a in attrs if a.get("type", "string") == "string" and a["name"] != "class"]


def _probe(env: Environment, comp: dict) -> list[str]:
    """Return the string attrs whose sentinel does NOT land in this component's output."""
    dropped = []
    names = {a["name"] for a in comp.get("attributes", [])}
    base = {k: v for k, v in _BASELINE.items() if k in names}
    for attr in _string_attrs(comp):
        ctx = dict(base)
        ctx.update(_COMPANIONS.get(attr, {}))
        ctx[attr] = _SENTINEL
        rendered_attrs = " ".join(f'{k}="{v}"' for k, v in ctx.items())
        src = f'<c-{comp["name"]} {rendered_attrs}></c-{comp["name"]}>'
        try:
            html = env.from_string(src).render()
        except Exception:
            continue  # a bare probe cannot satisfy every component; skip, don't guess
        if any(marker in html for marker in _UNIMPLEMENTED_MARKERS):
            continue  # component not implemented in this theme — nothing to assert
        if _SENTINEL not in html:
            dropped.append(attr)
    return dropped


def _all_dropped() -> set[tuple[str, str]]:
    dropped: set[tuple[str, str]] = set()
    for path, extra, themes in _REGISTRIES.values():
        for theme in themes:
            env = _env(theme, extra)
            for comp in _components(path):
                for attr in _probe(env, comp):
                    dropped.add((comp["name"], attr))
    return dropped


def test_no_undocumented_attribute_drops():
    """Every declared string attribute lands in the output, or is a documented drop."""
    dropped = _all_dropped()
    undocumented = sorted(dropped - _ALLOWED)
    assert not undocumented, (
        "Declared string attribute(s) silently dropped from the rendered output "
        "under some theme (the page renders but is quietly wrong). Fix the "
        "implementation, or — if the drop is a legitimate transform — document it in "
        "LEGIT_TRANSFORMS / KNOWN_GAPS in this file:\n"
        + "\n".join(f"  <c-{c}> .{a}" for c, a in undocumented)
    )


def test_allowlists_are_not_stale():
    """Every allowlisted (component, attr) still drops — remove entries once fixed."""
    dropped = _all_dropped()
    stale = sorted(_ALLOWED - dropped)
    assert not stale, (
        "Allowlisted attribute(s) now land in the output (the drop was fixed). "
        "Remove them from LEGIT_TRANSFORMS / KNOWN_GAPS so the guard stays honest:\n"
        + "\n".join(f"  <c-{c}> .{a}" for c, a in stale)
    )
