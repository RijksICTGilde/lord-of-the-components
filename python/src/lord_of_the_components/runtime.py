"""Hot-path helpers for the generated Python renderers (plan v7 F3 / T3.3).

Kept small and import-free in function bodies: generated renderers call these on
every render, so they must be cheap. ``render_extra`` replaces the ~40 µs
``render_extra_attributes`` Jinja macro with a single loop.
"""

from __future__ import annotations

import re
from typing import Any, Mapping, Optional

from markupsafe import Markup, escape

__all__ = [
    "Markup",
    "esc",
    "render_extra",
    "render_utility",
    "merge_class",
    "attr_name",
]

# Generic HTML attributes passed through verbatim (besides data-/aria-/hx-*).
_PASSTHROUGH = ("id", "title", "style", "role", "tabindex", "slot")
_PREFIXES = ("data-", "aria-", "hx-")

#: A legal HTML attribute name. Escaping a value protects the value; the KEY of a
#: `:attrs="{...}"` spread is written outside quotes, so a key carrying a quote,
#: space or `=` would inject a whole new attribute (`x" onmouseover="alert(1)`).
#: Entity-escaping cannot help there — attribute names are not entity-decoded —
#: so an illegal name is rejected outright.
_ATTR_NAME_RE = re.compile(r"^[A-Za-z_:][-A-Za-z0-9_:.]*$")

#: An inline event-handler attribute (`onclick`, `ONERROR`, …). Legal HTML, but
#: never acceptable from a data-driven `:attrs` spread.
_EVENT_ATTR_RE = re.compile(r"^on[a-z]+$", re.IGNORECASE)


def attr_name(key: Any, allow_event: bool = False) -> str:
    """Return `key` if it is a legal HTML attribute name, else raise ValueError.

    Guards the `:attrs="{name: value}"` spread, whose keys come from application
    data and are written unquoted into the tag. Event-handler names (`on*`) are
    rejected there: a spread built from request data would otherwise turn a data
    value into executable script. Use the explicit `@event` syntax instead —
    `allow_event=True` is for that path, which has a literal handler name.
    """
    name = str(key)
    if not _ATTR_NAME_RE.match(name):
        raise ValueError(
            f"Invalid HTML attribute name in :attrs spread: {name!r}. "
            "Attribute names may contain letters, digits, '-', '_', ':' and '.' "
            "and must start with a letter, '_' or ':'."
        )
    if not allow_event and _EVENT_ATTR_RE.match(name):
        raise ValueError(
            f"Event-handler attribute {name!r} is not allowed in an :attrs spread. "
            "Use the '@event' syntax (e.g. @click=\"...\") for handlers, so a "
            "data-driven spread can never introduce executable script."
        )
    return name


def esc(value: Any) -> Markup:
    """Escape a prop value for HTML output (empty string for None)."""
    return escape("" if value is None else value)


def render_extra(extra: Optional[Mapping[str, Any]]) -> Markup:
    """Render passthrough attributes (data-/aria-/hx-*, id/title/style/role/tabindex/slot)
    and events (@name -> on{name}, @hx-* -> hx-*) as a single attribute string.

    Values are attribute-escaped. Returns leading-space-separated ` k="v"` pairs.
    """
    if not extra:
        return Markup("")
    parts = []
    for key, value in extra.items():
        if value is None:
            continue
        # :attrs="{name: value}" spread — merge a dict onto the element (hx-*/data-*/
        # aria-*/generic). None or '' omits an entry (same rule as :prop="expr or none").
        if key == "attrs" and isinstance(value, dict):
            for k, v in value.items():
                # A boolean is written the way HTML means one: True is the bare
                # attribute, False is its ABSENCE. Rendering False as
                # `disabled="False"` disabled the element, because for a boolean
                # attribute any presence counts — the opposite of what was asked.
                if v is True:
                    parts.append(f" {attr_name(k)}")
                elif v is not None and v is not False and v != "":
                    parts.append(f' {attr_name(k)}="{escape(v)}"')
            continue
        if key.startswith("@"):
            name = key[1:]
            attr = name if name.startswith("hx-") else "on" + name
            parts.append(f' {attr_name(attr, allow_event=True)}="{escape(value)}"')
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
    """Append user-supplied classes to a base class string.

    Class strings are handled as RAW text here and escaped once where the
    `class="…"` attribute is emitted. An `extra_class` that already arrives as
    escaped Markup — `class="a {{ x }}"` is captured by a `{% set %}` block under
    autoescape — is unescaped first, so it is escaped exactly once and not twice.
    """
    if not extra_class:
        return base
    raw = str(extra_class.unescape()) if isinstance(extra_class, Markup) else extra_class
    return f"{base} {raw}" if base else raw
