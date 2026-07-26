"""Hot-path helpers for the generated Python renderers (plan v7 F3 / T3.3).

Kept small and import-free in function bodies: generated renderers call these on
every render, so they must be cheap. ``render_extra`` replaces the ~40 µs
``render_extra_attributes`` Jinja macro with a single loop.
"""

from __future__ import annotations

from typing import Any, Mapping, Optional

from markupsafe import Markup, escape

__all__ = ["Markup", "esc", "render_extra", "merge_class"]

# Generic HTML attributes passed through verbatim (besides data-/aria-/hx-*).
_PASSTHROUGH = ("id", "title", "style", "role", "tabindex")
_PREFIXES = ("data-", "aria-", "hx-")


def esc(value: Any) -> Markup:
    """Escape a prop value for HTML output (empty string for None)."""
    return escape("" if value is None else value)


def render_extra(extra: Optional[Mapping[str, Any]]) -> Markup:
    """Render passthrough attributes (data-/aria-/hx-*, id/title/style/role/tabindex)
    and events (@name -> on{name}, @hx-* -> hx-*) as a single attribute string.

    Values are attribute-escaped. Returns leading-space-separated ` k="v"` pairs.
    """
    if not extra:
        return Markup("")
    parts = []
    for key, value in extra.items():
        if value is None:
            continue
        if key.startswith("@"):
            name = key[1:]
            attr = name if name.startswith("hx-") else "on" + name
            parts.append(f' {attr}="{escape(value)}"')
        elif key.startswith(_PREFIXES) or key in _PASSTHROUGH:
            parts.append(f' {key}="{escape(value)}"')
    return Markup("".join(parts))


def merge_class(base: str, extra_class: Optional[str]) -> str:
    """Append user-supplied classes to a base class string."""
    if not extra_class:
        return base
    return f"{base} {extra_class}" if base else extra_class
