"""Opt-in, theme-agnostic layout primitives for Lord of the Components.

A small composable layout toolkit modelled on Every Layout (every-layout.dev):
Center, Cluster, Sidebar, Switcher, Cover, Box (Stack/Grid live in core). The
primitives are intrinsically responsive (flex-wrap, min()/clamp, no media-query
breakpoints) and design-system-agnostic, so they mix-and-match with any active
design system's components.

Opt-in: install this package and activate it —
``setup_components(env, design_systems=["lotc-layout", "rvo"])``. Only then do the
``<c-center>`` / ``<c-cluster>`` / … components resolve and does layout.css load.
"""

from pathlib import Path

from lord_of_the_components.design_system import DesignSystem

_HERE = Path(__file__).resolve().parent

#: Discovered by core; see setup_components(design_systems=["lotc-layout", ...]).
DESIGN_SYSTEM = DesignSystem(
    name="lotc-layout",
    renderers_module="lotc_layout.renderers",
    templates_path=_HERE / "templates",
    static_path=_HERE / "static",
    # The one stylesheet for the primitives, loaded only when this system is active.
    css_urls=("/static/lotc/layout/layout.css",),
)
