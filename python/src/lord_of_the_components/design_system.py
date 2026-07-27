"""Pluggable design-system discovery.

A design system (rvo, nldd, …) is an independently installable package that
provides implementations for the design-system components. Core has NO built-in
knowledge of any specific one: it discovers whatever is installed via the
entry-point group below. Each design-system package advertises a `DesignSystem`
descriptor under that group.

    [project.entry-points."lord_of_the_components.design_systems"]
    rvo = "lotc_rvo:DESIGN_SYSTEM"

The always-present, theme-agnostic "system" layer (layout + basic HTML) lives in
core and is NOT a design system — it needs none of this.
"""

from __future__ import annotations

from dataclasses import dataclass
from importlib.metadata import entry_points
from pathlib import Path
from typing import Any, Dict, Optional, cast

#: Entry-point group installed design-system packages register themselves under.
ENTRY_POINT_GROUP = "lord_of_the_components.design_systems"


@dataclass(frozen=True)
class DesignSystem:
    """Descriptor a design-system package exposes for core to discover.

    Attributes:
        name: The id used in `design_systems=[...]` / `<c-* theme="...">` (e.g. "rvo").
        renderers_module: Importable module whose public callables are the Python
            renderers, registered as `_lotc_<name>_<component>` globals.
        templates_path: Optional dir of Jinja templates for this system's
            jinja-backend components (added to the loader search path).
        static_path: Optional dir of CSS/assets bundled with this system.
    """

    name: str
    renderers_module: str
    templates_path: Optional[Path] = None
    static_path: Optional[Path] = None
    #: Optional JSON registry fragment declaring component definitions this
    #: design system OWNS (theme-specific components not present in core, e.g.
    #: BGNLDD's `c-metric`). Merged into the registry when the system is active;
    #: each merged component is tagged with this system's name as its owner theme.
    registry_path: Optional[Path] = None
    #: CSS hrefs (under the /static/lotc/... URL space) that a page declaring this
    #: design system should load. Consumed by `c-page`'s asset loading.
    css_urls: tuple[str, ...] = ()


def discover_design_systems() -> Dict[str, DesignSystem]:
    """Return {name: DesignSystem} for every installed design-system package."""
    eps = entry_points()
    # Python 3.10+ exposes .select(group=...); 3.9 returns a group->list dict.
    if hasattr(eps, "select"):
        group_eps = list(eps.select(group=ENTRY_POINT_GROUP))
    else:  # pragma: no cover - Python 3.9 returns a group->list mapping
        group_eps = list(cast(Any, eps).get(ENTRY_POINT_GROUP, []))

    found: Dict[str, DesignSystem] = {}
    for ep in group_eps:
        obj = ep.load()
        ds = obj() if callable(obj) and not isinstance(obj, DesignSystem) else obj
        if isinstance(ds, DesignSystem):
            found[ds.name] = ds
    return found
