"""NLDD design-system implementation (in-repo; extracted to its own package later)."""

from lord_of_the_components.design_system import DesignSystem

#: Discovered by core via the "lord_of_the_components.design_systems" entry point.
DESIGN_SYSTEM = DesignSystem(
    name="nldd",
    renderers_module="lord_of_the_components.themes.nldd.renderers",
)
