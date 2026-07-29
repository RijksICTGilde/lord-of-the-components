"""BGNLDD — NLDD-flavoured implementations for the global app components.

The application/dashboard components (metric, sidenav, layer, activity, section-
head, shortcut, chip) are part of the GLOBAL component set — their definitions
live in core, theme-agnostic, like button or card. NLDD proper doesn't ship an
implementation for them yet, so BGNLDD provides one: a set of NLDD-composing
templates (+ the `bg-*` layout CSS). When lotc-nldd implements them upstream, or
an RVO implementation is added, this package becomes redundant.

A page declares it alongside NLDD (`design_systems=["nldd", "bgnldd"]`); each
component resolves to whichever active system implements it.
"""

from pathlib import Path

from lord_of_the_components.design_system import DesignSystem

_HERE = Path(__file__).resolve().parent

#: Discovered by core; see setup_components(design_systems=["nldd", "bgnldd"]).
#: Implementation-only: it contributes templates + CSS, not component definitions
#: (those are global, in core).
DESIGN_SYSTEM = DesignSystem(
    name="bgnldd",
    renderers_module="lotc_bgnldd.renderers",
    templates_path=_HERE / "templates",
    # The app-component styles are theme-agnostic and now ship in core
    # (app-components.css, always loaded), so this package is templates-only.
)
