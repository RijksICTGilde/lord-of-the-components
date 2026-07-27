"""NLDD design-system package for Lord of the Components.

Registered with core via the ``lord_of_the_components.design_systems`` entry
point. NLDD components are all Python-backend, so this package ships only the
generated renderers — no templates or static assets.
"""

from lord_of_the_components.design_system import DesignSystem

#: Discovered by core; see setup_components(design_systems=["nldd"]).
DESIGN_SYSTEM = DesignSystem(
    name="nldd",
    renderers_module="lotc_nldd.renderers",
)
