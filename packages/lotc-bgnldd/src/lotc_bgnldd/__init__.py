"""BGNLDD component layer for Lord of the Components.

Begane Grond (bg.rijks.app) composes NLDD web components with a set of its own
app-level components — a sidebar nav, metric/stat cards, platform-layer rows, an
activity feed, shortcut cards, section headers. Those aren't in NLDD proper.

Rather than pollute the NLDD library, BGNLDD ships them as a **separate theme
layer** that mixes and matches with NLDD: a page declares both
(`design_systems=["nldd", "bgnldd"]`), NLDD renders `c-card`/`c-button`/…, and
BGNLDD renders `c-metric`/`c-sidenav`/…. Its components own their definitions
(the merged registry fragment) and their layout CSS (`bg-*` classes), so core and
NLDD stay clean.
"""

from pathlib import Path

from lord_of_the_components.design_system import DesignSystem

_HERE = Path(__file__).resolve().parent

#: Discovered by core; see setup_components(design_systems=["nldd", "bgnldd"]).
DESIGN_SYSTEM = DesignSystem(
    name="bgnldd",
    renderers_module="lotc_bgnldd.renderers",
    # Jinja templates for BGNLDD's components (all jinja-backend).
    templates_path=_HERE / "templates",
    # Root for the /static/lotc/... URL space (holds bg-components.css).
    static_path=_HERE / "static",
    # Component definitions this theme OWNS (merged into the registry at setup).
    registry_path=_HERE / "registry.json",
    # CSS the page must load when this theme is declared.
    css_urls=("/static/lotc/bgnldd/bg-components.css",),
)
