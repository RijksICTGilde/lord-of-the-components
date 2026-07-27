"""NLDD design-system package for Lord of the Components.

Registered with core via the ``lord_of_the_components.design_systems`` entry
point. NLDD components are all Python-backend, so this package ships only the
generated renderers — no templates or static assets.
"""

import json
from pathlib import Path

from lord_of_the_components.design_system import DesignSystem

_HERE = Path(__file__).resolve().parent
_DIST = _HERE / "static" / "lotc" / "nldd" / "dist"


def _bundle() -> tuple[tuple[str, ...], tuple[str, ...]]:
    """(css_urls, js_urls) read from the webpack manifest, so c-page's asset
    loading tracks whatever `npm run build:fe:nldd` produced."""
    manifest = json.loads((_DIST / "assets.json").read_text())
    css = tuple(f"/static/lotc/nldd/dist/{c}" for c in manifest.get("css", []))
    js = tuple(
        f"/static/lotc/nldd/dist/{j['src'] if isinstance(j, dict) else j}"
        for j in manifest.get("js", [])
    )
    return css, js


_CSS, _JS = _bundle()

# NLDD only applies its body font via `html:has(nldd-app-view) body`, so plain
# HTML content (headings, paragraphs) falls back to the browser serif. Apply the
# RijksSans stack at the root so ordinary content matches the NLDD components.
_FONT = (
    "<style>body { font-family: var(--primitives-font-family-sans-serif, "
    "RijksSans, system-ui, sans-serif); }</style>"
)

#: Discovered by core; see setup_components(design_systems=["nldd"]).
DESIGN_SYSTEM = DesignSystem(
    name="nldd",
    renderers_module="lotc_nldd.renderers",
    # Jinja templates for NLDD's jinja-backend components (card, alert, …).
    templates_path=_HERE / "templates",
    # Root for the /static/lotc/... URL space (holds the webpack CSS/JS bundle).
    static_path=_HERE / "static",
    css_urls=_CSS,
    js_urls=_JS,
    extra_head=_FONT,
)

