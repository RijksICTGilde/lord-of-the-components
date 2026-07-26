"""Hot-path helpers for the generated Python renderers (plan v7 F3 / T3.3).

Kept small and import-free in function bodies: generated renderers call these on
every render, so they must be cheap. ``render_extra`` replaces the ~40 µs
``render_extra_attributes`` Jinja macro with a single loop.
"""

from __future__ import annotations

from typing import Any, Mapping, Optional

from markupsafe import Markup, escape

__all__ = ["Markup", "esc", "render_extra", "render_utility", "merge_class"]

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


def render_utility(extra: Optional[Mapping[str, Any]]) -> str:
    """Build utility CSS classes from text-style / margin / padding inputs.

    Mirrors the render_utility_classes Jinja macro: text-style -> rvo-text--{v};
    margin/padding -> rvo-{margin|padding}--{v}, or a 3-part
    rvo-{margin|padding}-{a}-{b}--{c}. Multiple values may be space/comma separated.
    """
    if not extra:
        return ""
    classes = []
    text_style = extra.get("text-style")
    if text_style:
        for value in str(text_style).replace(",", " ").split():
            classes.append(f"rvo-text--{value}")
    for key, prefix in (("margin", "rvo-margin"), ("padding", "rvo-padding")):
        raw = extra.get(key)
        if not raw:
            continue
        for value in str(raw).replace(",", " ").split():
            if value.count("-") >= 2:
                parts = value.split("-")
                if len(parts) == 3:
                    classes.append(f"{prefix}-{parts[0]}-{parts[1]}--{parts[2]}")
            else:
                classes.append(f"{prefix}--{value}")
    return " ".join(classes)


def merge_class(base: str, extra_class: Optional[str]) -> str:
    """Append user-supplied classes to a base class string."""
    if not extra_class:
        return base
    return f"{base} {extra_class}" if base else extra_class
