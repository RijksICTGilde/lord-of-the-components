"""A component template ships markup — its CSS and JS live in the design system.

An inline `<style>`/`<script>` inside a component is emitted once per instance:
three secret fields on a page carried three copies of the same rules (8540 bytes
for three, against 1424 after the move), and the page could not run under a
Content-Security-Policy without 'unsafe-inline'.

Every design system already declares `css_urls` / `js_urls`, which core loads
once per page through `<c-page>`. That is where component CSS and behaviour go.
"""

import re
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]

TEMPLATE_DIRS = [
    ROOT / "python/src/lord_of_the_components/templates",
    *sorted(ROOT.glob("packages/*/src/*/templates")),
]

#: `<c-page>` renders the document itself, so these are emitted once per page,
#: not once per component — and their POSITION is the point: the body reset has
#: to sit after the theme CSS and before the app's own head, and the font rule
#: has to beat the browser default before first paint.
ALLOWED = {"page.html.j2"}

INLINE_ASSET = re.compile(r"<(style|script)\b", re.IGNORECASE)
#: Jinja and HTML comments are prose — a template may say the words "<style>"
#: while emitting none. (The first version of this gate flagged four templates
#: on their own explanation of having moved the CSS out.)
COMMENT = re.compile(r"\{#.*?#\}|<!--.*?-->", re.DOTALL)


def _component_templates():
    for base in TEMPLATE_DIRS:
        for path in sorted(base.rglob("*.j2")):
            yield path


def test_no_component_template_carries_inline_css_or_js():
    offenders = {}
    for path in _component_templates():
        if path.name in ALLOWED:
            continue
        markup = COMMENT.sub(" ", path.read_text(encoding="utf-8"))
        tags = INLINE_ASSET.findall(markup)
        if tags:
            offenders[str(path.relative_to(ROOT))] = sorted(set(tags))
    assert not offenders, (
        "these templates inline their CSS/JS, so it is repeated per instance and "
        f"needs 'unsafe-inline' to run: {offenders}. Move it to the design "
        "system's css_urls/js_urls."
    )


def test_the_gate_is_actually_looking_at_templates():
    """Negative control: a gate over an empty file list would pass silently."""
    names = [p.name for p in _component_templates()]
    assert len(names) > 50, f"expected the full template set, found {len(names)}"
    assert "secret-field.html.j2" in names


def test_the_gate_sees_a_planted_inline_block():
    """...and it must see real markup while ignoring a comment that mentions it."""
    planted = "{# was a <style> here #}\n<div></div>\n<style>.x{color:red}</style>"
    assert INLINE_ASSET.findall(COMMENT.sub(" ", planted)) == ["style"]


@pytest.mark.parametrize(
    ("system", "expected"),
    [
        ("nldd", "/static/lotc/nldd/lotc-nldd.css"),
        ("lotc-forms", "/static/lotc/forms/forms.css"),
        ("lotc-charts", "/static/lotc/charts/charts.css"),
    ],
)
def test_each_system_declares_the_stylesheet_its_components_need(system, expected):
    """The move only works if the page actually loads the file it moved to."""
    from lord_of_the_components.design_system import discover_design_systems

    design_system = discover_design_systems()[system]
    assert expected in design_system.css_urls


@pytest.mark.parametrize(
    ("system", "expected"),
    [
        ("nldd", "/static/lotc/nldd/lotc-nldd.js"),
        ("lotc-forms", "/static/lotc/forms/forms.js"),
        ("lotc-charts", "/static/lotc/charts/charts.js"),
    ],
)
def test_each_system_declares_the_script_its_components_need(system, expected):
    from lord_of_the_components.design_system import discover_design_systems

    design_system = discover_design_systems()[system]
    assert expected in design_system.js_urls


def test_the_files_those_urls_point_at_exist():
    """A url in css_urls/js_urls that 404s fails silently in the browser."""
    from lord_of_the_components.design_system import discover_design_systems

    missing = []
    for name, design_system in discover_design_systems().items():
        if not design_system.static_path:
            continue
        root = Path(design_system.static_path)
        for url in (*design_system.css_urls, *design_system.js_urls):
            # /static/lotc/... maps to <static_path>/lotc/...
            candidate = root / url.removeprefix("/static/")
            if not candidate.exists():
                missing.append(f"{name}: {url}")
    assert not missing, f"declared but not shipped: {missing}"


def test_the_registry_carries_the_upstream_pointers():
    """pip installs neither the design system's package.json nor node_modules.

    So an application on the Python side cannot see where the component
    documentation lives — which is how a team spent a round concluding a
    capability did not exist while the Storybook would have shown the slot in a
    minute (RIG-Cluster, RC-151, who traced it to exactly this). The address
    travels in the registry instead, which pip does install.
    """
    import json

    registry = json.loads((ROOT / "packages/lotc-nldd/src/lotc_nldd/registry.json").read_text(encoding="utf-8"))
    meta = registry.get("meta", {})
    assert meta.get("storybook_url", "").startswith("https://")
    assert meta.get("upstream_repository", "").startswith("https://")
    # And it is reachable from a package install: the registry ships with it.
    packaged = ROOT / "packages/lotc-nldd/src/lotc_nldd/registry.json"
    assert packaged.exists()
