"""RVO design-system implementation (in-repo; extracted to its own package later)."""

from pathlib import Path

from lord_of_the_components.design_system import DesignSystem

_PKG_ROOT = Path(__file__).resolve().parent.parent.parent

#: Discovered by core via the "lord_of_the_components.design_systems" entry point.
DESIGN_SYSTEM = DesignSystem(
    name="rvo",
    renderers_module="lord_of_the_components.themes.rvo.renderers",
    static_path=_PKG_ROOT / "static" / "lotc",
)
