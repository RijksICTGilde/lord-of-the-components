"""
Jinja2 Component Extension.

Transforms custom component tags into standard Jinja2 includes:
<c-button type="primary">Click me</c-button>
-> {% set _component_context = {...} %}{% include "components/button.html.j2" with context %}

Preprocessing uses the one-pass parser in parser.py (no BeautifulSoup): the node
tree is walked once, components become includes, and all other text passes
through as unmodified slices of the original source.
"""

import json
import logging
import re
from dataclasses import dataclass
from difflib import get_close_matches
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List, Optional

from jinja2 import Environment
from jinja2.ext import Extension

from .design_system import DesignSystem, discover_design_systems
from .parser import (
    Attr,
    ComponentNode,
    Node,
    ParseError,
    TemplateNode,
    TextNode,
    parse,
)
from .registry import ComponentRegistry
from .validation import validate_expression

logger = logging.getLogger(__name__)

# Maximum allowed nesting depth for components to prevent infinite recursion
MAX_NESTING_DEPTH = 50


@dataclass
class SourceLocation:
    """Represents a location in source code."""

    line: int
    column: int

    def __str__(self) -> str:
        return f"line {self.line}, column {self.column}"


class ComponentError(Exception):
    """Exception for component-related errors with source location information."""

    def __init__(
        self,
        message: str,
        location: Optional[SourceLocation] = None,
        suggestion: Optional[str] = None,
    ) -> None:
        self.message = message
        self.location = location
        self.suggestion = suggestion

        full_message = message
        if location:
            full_message = f"{message} at {location}"
        if suggestion:
            full_message = f"{full_message}. Did you mean '{suggestion}'?"

        super().__init__(full_message)


def _source_location(source: str, offset: int) -> SourceLocation:
    """Compute a 1-based line/column for *offset* (cold path — only on errors)."""
    line = source.count("\n", 0, offset) + 1
    last_newline = source.rfind("\n", 0, offset)
    column = offset - last_newline if last_newline != -1 else offset + 1
    return SourceLocation(line=line, column=column)


@dataclass
class _CompileState:
    """Per-compile state for a single preprocess() call.

    Kept off the extension instance so concurrent compiles in a threaded server
    cannot corrupt each other's counters (the extension instance is shared
    across the whole Environment).
    """

    counter: int = 0


#: Jinja delimiters that make a folded string unsafe to embed as literal source.
_JINJA_DELIMS = ("{{", "{%", "{#")
# Statically-named template targets that pull in components whose macros must be
# registered before the render context is snapshotted: {% extends "x" %},
# {% include "x" %}, {% import "x" %}, {% from "x" import … %} (single/double quoted).
_PREWARM_RE = re.compile(
    r"""\{%-?\s*(?:extends|include|import|from)\s+["']([^"']+)["']"""
)
# Jinja comments — stripped before the pre-warm scan so a {% extends %} shown inside
# a {# … #} example doesn't get pre-warmed (and can't make a template recurse on itself).
_JINJA_COMMENT_RE = re.compile(r"\{#.*?#\}", re.DOTALL)


def _has_jinja(text: Optional[str]) -> bool:
    return text is not None and any(d in text for d in _JINJA_DELIMS)


@lru_cache(maxsize=1)
def _load_icons() -> Optional[dict]:
    """The icon vocabulary for validation: {aliases: {name: {rvo, nldd}},
    sets: {theme: [names]}}, generated from definitions/icons.ts + the theme icon
    assets. Returns None if the file is absent. Membership sets are pre-built."""
    try:
        data = json.loads((Path(__file__).resolve().parent / "icons.json").read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None
    data["_sets"] = {t: set(names) for t, names in data.get("sets", {}).items()}
    return data


def _mustache_expr(value: Optional[str]) -> Optional[str]:
    """If `value` is a single whole ``{{ expr }}`` (nothing else), return the
    inner expression; otherwise None. Lets ``attr="{{ x }}"`` behave exactly like
    the ``:attr="x"`` bound form (object-preserving), for every attribute."""
    if value is None:
        return None
    s = value.strip()
    if s.startswith("{{") and s.endswith("}}") and s.count("{{") == 1 and s.count("}}") == 1:
        return s[2:-2].strip()
    return None


def _is_foldable(attrs: Dict[str, Any], content: Optional[str]) -> bool:
    """A component instance can be folded when every attribute is a literal and its
    content is already a static (Jinja-free) string."""
    if _has_jinja(content):
        return False
    for key, value in attrs.items():
        if key.startswith(":"):
            return False  # dynamic expression
        if _has_jinja(value):
            return False
    return True


def _py_ident(name: str) -> str:
    """Component/prop name to a Python identifier (kebab -> snake)."""
    return name.replace("-", "_")


def _py_string(value: str) -> str:
    """A single-quoted Jinja/Python string literal for *value*."""
    return "'" + value.replace("\\", "\\\\").replace("'", "\\'") + "'"


#: Names that mean "the always-present system layer" rather than a design system.
#: The theme-agnostic "system" layer (LOTC's own layout + basic HTML) is always
#: present and needs nothing loaded. There is no implicit default design system —
#: a page declares which ones it uses; core discovers the installed ones.
SYSTEM_ALIASES = ("system", "default")

#: Convenience tag aliases -> (target component, default props merged in unless the
#: author overrides them). Lets you write <c-p>/<c-h1> for the common HTML-ish
#: components (<c-paragraph>/<c-heading type="h1">). Aliases resolve before lookup.
COMPONENT_ALIASES: Dict[str, tuple[str, Dict[str, str]]] = {
    "p": ("paragraph", {}),
    "h1": ("heading", {"type": "h1"}),
    "h2": ("heading", {"type": "h2"}),
    "h3": ("heading", {"type": "h3"}),
    "h4": ("heading", {"type": "h4"}),
    "h5": ("heading", {"type": "h5"}),
    "h6": ("heading", {"type": "h6"}),
}


@lru_cache(maxsize=1)
def _available_design_systems() -> Dict[str, DesignSystem]:
    """Installed design systems, discovered via entry points (cached per process)."""
    return discover_design_systems()


def _resolve_theme(theme: str) -> DesignSystem:
    """Resolve a design-system id to its installed descriptor, or raise."""
    available = _available_design_systems()
    if theme in available:
        return available[theme]
    names = sorted(available)
    suggestion = get_close_matches(theme, names, n=1, cutoff=0.4)
    hint = f" Did you mean '{suggestion[0]}'?" if suggestion else ""
    installed = ", ".join(names) if names else "(none installed)"
    raise RuntimeError(
        f"Unknown design system '{theme}'. Installed design systems: {installed}.{hint}"
    )


def _register_theme_renderers(jinja_env: Environment, ds: DesignSystem) -> None:
    """Register a design system's Python renderers as `_lotc_<name>_<comp>` globals."""
    import importlib

    try:
        module = importlib.import_module(ds.renderers_module)
    except ModuleNotFoundError:
        return
    for attr_name in dir(module):
        if attr_name.startswith("_"):
            continue
        fn = getattr(module, attr_name)
        if callable(fn) and getattr(fn, "__module__", "") == module.__name__:
            jinja_env.globals[f"_lotc_{ds.name}_{attr_name}"] = fn


def _slot_name(node: TemplateNode) -> Optional[str]:
    """Return the value of a <template>'s `slot` attribute if it is non-empty.

    A ``<template>`` without a slot attribute, or with an empty one, is treated
    as ordinary default content (matching the previous behavior).
    """
    for attr in node.attrs:
        if attr.name == "slot" and attr.raw_value:
            return attr.raw_value
    return None


class ComponentExtension(Extension):
    """Jinja2 extension that preprocesses component syntax via the one-pass parser."""

    def __init__(self, environment: Environment) -> None:
        super().__init__(environment)
        self.registry = ComponentRegistry()
        # Design systems available on this page (declared at setup). The
        # theme-agnostic "system" layer is always available regardless.
        self.design_systems: tuple[str, ...] = ()
        # Primary/active design system for design-system components (first
        # declared). None when only the system layer is available.
        self.render_theme: Optional[str] = None
        # Resolved DesignSystem descriptors for the declared systems, in order
        # (used by c-page to emit each system's CSS/JS bundle). Set at setup.
        self.active_design_systems: tuple[Any, ...] = ()
        # Components whose lotc_render macro was looked up and NOT found, so we
        # don't re-attempt get_template on every use (lazy macro registration).
        self._jinja_macro_missing: set[str] = set()
        # Guard against re-entrant/circular {% extends/include %} pre-warming.
        self._prewarming: set[str] = set()
        # What to do when a component is defined globally but no active design
        # system implements it: "error" (default, fail loudly) or "placeholder"
        # (render a visible marker so you can switch themes and see the gaps).
        self.on_missing_component: str = "error"
        # Constant folding: render fully-literal python components at compile time.
        self.fold = True
        # Validate bound data structures (:items, :columns, ...) at render time.
        self.validate_data = True
        # Debug mode: extra author-facing diagnostics (invalid enum values with
        # suggestions), in addition to the always-on unknown-attribute checks.
        self.debug = False
        # How to treat an attribute *name* the component does not declare:
        # "error" (default, raise) or "ignore" (tolerate — drop it, no error).
        self.on_unknown_attribute: str = "error"
        # How to treat an attribute *value* that is not recognised — an icon name
        # absent from an active theme's set, or a literal outside an enum's set:
        # "ignore" (default, render as-is — a wrong icon is a blank box) or
        # "error" (raise, with a suggestion). `debug=True` implies "error".
        self.on_unknown_value: str = "ignore"

    def _wrap_binding(self, clean_key: str, value: str, component_def: Any) -> str:
        """Wrap a :binding expression in a render-time validation call, if enabled."""
        bindings = getattr(component_def, "bindings", {})
        if self.validate_data and clean_key in bindings:
            return (
                f"_lotc_validate({value}, {_py_string(bindings[clean_key])}, "
                f"{_py_string(component_def.name)}, {_py_string(clean_key)})"
            )
        return value

    def preprocess(
        self, source: str, name: Optional[str], filename: Optional[str] = None
    ) -> str:
        """Preprocess template source, converting component syntax to Jinja2 includes."""
        template_id = filename or name or "<unknown>"
        logger.debug("Preprocessing template: %s", template_id)

        # Eagerly load statically-named {% extends/include/import/from "x" %} targets
        # NOW, during this template's preprocess, so the components they pull in have
        # their macros (_lotc_jinja_*) registered on the environment before rendering
        # starts. Jinja snapshots (copies) a context's globals when a render begins;
        # with {% extends %} the parent body runs against the child's already-taken
        # snapshot, and the same lands on partials reached while that snapshot is live,
        # so a macro registered later (when the target loads mid-render) resolves to
        # Undefined. Pre-warming here closes that gap. Statically-named targets only; a
        # dynamic name (e.g. {% include var %}) can't be pre-resolved and keeps the
        # original render-time behaviour.
        loader = getattr(self.environment, "loader", None)
        if loader is not None and (
            "extends" in source or "include" in source or "import" in source
        ):
            # Scan the source WITHOUT its Jinja comments — a {% extends "…" %} shown
            # inside a {# … #} doc-comment is documentation, not a real dependency,
            # and pre-warming it (a template can mention itself) would recurse.
            scan = _JINJA_COMMENT_RE.sub("", source)
            for target in _PREWARM_RE.findall(scan):
                if target in self._prewarming:  # already loading it (self/circular)
                    continue
                self._prewarming.add(target)
                try:
                    self.environment.get_template(target)
                except Exception:  # noqa: BLE001 — missing/dynamic target: nothing to pre-warm
                    pass
                finally:
                    self._prewarming.discard(target)

        # If no component tags exist, skip parsing entirely.
        if "<c-" not in source:
            return source

        state = _CompileState()
        try:
            nodes = parse(source)
            return "".join(self._emit(source, node, state, 0) for node in nodes)
        except ParseError as exc:
            raise ComponentError(
                exc.message, location=SourceLocation(exc.line, exc.column)
            ) from None
        except ComponentError:
            raise
        except Exception as exc:
            logger.error("Component preprocessing failed for template %s: %s", template_id, exc)
            raise RuntimeError(
                f"Component preprocessing failed for template '{template_id}': {exc}"
            ) from exc

    # ── tree walk ────────────────────────────────────────────────────────────
    def _emit(self, source: str, node: Node, state: "_CompileState", depth: int) -> str:
        """Serialize a node: text verbatim, template re-emitted, component -> include."""
        if isinstance(node, TextNode):
            return source[node.span.start : node.span.end]
        if isinstance(node, TemplateNode):
            inner = "".join(self._emit(source, c, state, depth) for c in node.children)
            return node.open_source + inner + "</template>"
        return self._emit_component(source, node, state, depth)

    def _emit_component(
        self, source: str, node: ComponentNode, state: "_CompileState", depth: int
    ) -> str:
        if depth > MAX_NESTING_DEPTH:
            raise ComponentError(
                f"Component nesting depth ({depth}) exceeds maximum allowed ({MAX_NESTING_DEPTH})",
                location=_source_location(source, node.span.start),
            )

        # Resolve a convenience alias (c-p -> paragraph, c-h1 -> heading type=h1).
        # Keep the original tag for error messages; the alias's default props are
        # merged into the parsed attributes below (author values win).
        alias = COMPONENT_ALIASES.get(node.name)
        component_name = alias[0] if alias else node.name
        alias_defaults = alias[1] if alias else {}
        tag_name = f"c-{node.name}"
        location = _source_location(source, node.span.start)

        if not self.registry.has_component(component_name):
            available = sorted(self.registry.get_all_component_names())
            suggestion = None
            close_matches = get_close_matches(component_name, available, n=1, cutoff=0.6)
            if close_matches:
                suggestion = f"c-{close_matches[0]}"
            raise ComponentError(
                f"Unknown component '{tag_name}'",
                location=location,
                suggestion=suggestion,
            )

        component_def = self.registry.get_component(component_name)

        # Resolve which design system renders this component (mix-and-match):
        #   explicit `theme=` on the tag  >  the component's owner theme  >  the
        #   page's primary. `theme=` routes to a design system and is stripped
        #   before attribute parsing — UNLESS the component declares its own
        #   `theme` prop (e.g. c-page uses theme= for its body class), in which
        #   case it's an ordinary attribute.
        explicit_theme: Optional[str] = None
        routed_attrs = node.attrs
        if component_def is not None and not component_def.has_attribute("theme") and any(
            a.name == "theme" for a in node.attrs
        ):
            explicit_theme = next(a.raw_value for a in node.attrs if a.name == "theme")
            routed_attrs = [a for a in node.attrs if a.name != "theme"]
        owner = getattr(component_def, "theme", None)
        is_system = getattr(component_def, "system", False)
        backend = getattr(component_def, "backend", "jinja")

        # Resolve which active design system implements this component (partial
        # theme coverage): definitions are global, but a system only implements a
        # subset. System components (layout + basic HTML) are theme-agnostic and
        # always render. If no active system implements a component, defer to
        # on_missing_component (error, or a visible placeholder).
        # No loader = a bare-extension mechanics test (no real setup); we can't
        # (and shouldn't) verify implementations there — emit as declared.
        has_loader = getattr(self.environment, "loader", None) is not None
        if is_system or not has_loader:
            render_theme: Optional[str] = (
                None if is_system else (explicit_theme or owner or self.render_theme)
            )
        elif backend == "python":
            render_theme = self._python_impl_theme(component_name, explicit_theme, owner)
            if render_theme is None:
                return self._missing_impl(component_name, tag_name, location)
        else:  # jinja
            if not self._jinja_impl_available(component_name):
                return self._missing_impl(component_name, tag_name, location)
            render_theme = explicit_theme or owner or self.render_theme

        attrs = self._parse_component_attributes(source, routed_attrs, component_def, tag_name)
        for key, value in alias_defaults.items():
            attrs.setdefault(key, value)

        named_slots, default_content = self._extract_slots(source, node, state, depth + 1)

        if getattr(component_def, "backend", "jinja") == "python" and not named_slots:
            if self.fold and _is_foldable(attrs, default_content):
                folded = self._fold_component(
                    component_name, component_def, attrs, default_content, render_theme
                )
                if folded is not None:
                    return folded
            return self._build_python_call(
                component_name, component_def, attrs, default_content, state, render_theme
            )
        # Jinja-backend: fold a fully-static instance (static attrs + content + all
        # slots) to literal HTML at compile time, exactly like a python component —
        # collapsing the {% include %} away. Since children are emitted first, a
        # static subtree folds bottom-up. Falls back to the include on anything
        # dynamic or on any render error.
        if (
            self.fold
            and _is_foldable(attrs, default_content)
            and not any(_has_jinja(s) for s in (named_slots or {}).values())
        ):
            folded = self._fold_jinja_component(
                component_name, component_def, attrs, default_content, named_slots
            )
            if folded is not None:
                return folded
        return self._build_include(component_name, attrs, default_content, state, named_slots)

    def _extract_slots(
        self, source: str, node: ComponentNode, state: "_CompileState", child_depth: int
    ) -> tuple[Dict[str, str], Optional[str]]:
        """Split a component's children into named slots and default content.

        Named slots are direct-child <template slot="name"> elements; everything
        else is default content. Child components are emitted (as includes) here,
        so nesting composes bottom-up.
        """
        named_slots: Dict[str, str] = {}
        default_parts: List[str] = []

        for child in node.children:
            slot = _slot_name(child) if isinstance(child, TemplateNode) else None
            if slot is not None and isinstance(child, TemplateNode):
                content = "".join(
                    self._emit(source, c, state, child_depth) for c in child.children
                ).strip()
                named_slots[slot] = content
            else:
                default_parts.append(self._emit(source, child, state, child_depth))

        default_content = "".join(default_parts).strip()
        return named_slots, (default_content or None)

    # ── attribute handling ───────────────────────────────────────────────────
    def _parse_component_attributes(
        self,
        source: str,
        attr_list: List[Attr],
        component_def: Any,
        tag_name: str,
    ) -> Dict[str, Any]:
        """Parse and validate component attributes into a name->value dict."""
        attrs: Dict[str, Any] = {}

        valid_attrs = {attr.name.lower(): attr.name for attr in component_def.attributes}
        for attr in component_def.attributes:
            if any(c.isupper() for c in attr.name):
                valid_attrs[attr.name.lower()] = attr.name
        valid_attrs.update({"class": "class", "id": "id", "style": "style"})
        # Data-binding names (e.g. `items`) are addressable without the ':' prefix
        # too — `items="{{ x }}"` is the Jinja-style equivalent of `:items="x"`.
        valid_attrs.update({b.lower(): b for b in getattr(component_def, "bindings", {})})

        for parsed in attr_list:
            attr_name = parsed.name
            attr_value = parsed.raw_value if parsed.raw_value is not None else ""

            if attr_name.startswith(":"):
                is_valid, expr_error = validate_expression(attr_value)
                if not is_valid and expr_error:
                    error_msg = f"Invalid expression in '{attr_name}': {expr_error.message}"
                    if expr_error.position:
                        error_msg += f" at position {expr_error.position}"
                    raise ComponentError(
                        error_msg,
                        location=_source_location(source, parsed.span.start),
                        suggestion=expr_error.suggestion,
                    )
                attrs[attr_name] = attr_value
            elif attr_name.startswith("@"):
                attrs[attr_name] = attr_value
            elif self._is_generic_html_attribute(attr_name):
                attrs[attr_name] = attr_value
            else:
                clean_name = attr_name.lower()
                if clean_name in valid_attrs:
                    real_name = valid_attrs[clean_name]
                    # Extended-component gating: a theme-owned extension attribute
                    # is only valid while its owning design system is active.
                    attr_def = component_def.get_attribute(real_name)
                    owner = getattr(attr_def, "owner", None) if attr_def else None
                    if owner and owner not in getattr(self, "design_systems", ()):
                        raise ComponentError(
                            f"Attribute '{attr_name}' on '{tag_name}' is an extension "
                            f"provided by the '{owner}' design system, which is not active",
                            location=_source_location(source, parsed.span.start),
                            suggestion=f"activate '{owner}' (design_systems=[…, '{owner}'])",
                        )
                    attrs[real_name] = attr_value
                    if self.debug or self.on_unknown_value == "error":
                        self._validate_enum_value(
                            source, component_def, real_name, attr_value, parsed, tag_name
                        )
                        # icon-NAME attrs only — skip enum icon attrs like
                        # `show-icon` (a before/after/no position, not a name).
                        if (real_name == "icon" or real_name.endswith("-icon")) and not getattr(
                            attr_def, "enum_values", None
                        ):
                            self._validate_icon_value(
                                source, attr_value, parsed, tag_name, real_name
                            )
                else:
                    if self.on_unknown_attribute == "ignore":
                        # Lenient mode: tolerate an unknown attribute (drop it, no
                        # error) instead of failing the render.
                        continue
                    available = sorted(set(valid_attrs.values()))
                    suggestion = None
                    # `name` was renamed to `label` for visible text (plan v7 T1.2);
                    # they are not close enough for get_close_matches, so hint explicitly.
                    if clean_name == "name" and "label" in {a.lower() for a in available}:
                        suggestion = "label"
                    else:
                        close_matches = get_close_matches(
                            clean_name, [a.lower() for a in available], n=1, cutoff=0.6
                        )
                        if close_matches:
                            for avail in available:
                                if avail.lower() == close_matches[0]:
                                    suggestion = avail
                                    break
                    raise ComponentError(
                        f"Unknown attribute '{attr_name}' on component '{tag_name}'",
                        location=_source_location(source, parsed.span.start),
                        suggestion=suggestion,
                    )

        return attrs

    def _validate_enum_value(
        self,
        source: str,
        component_def: Any,
        attr_name: str,
        value: str,
        parsed: Attr,
        tag_name: str,
    ) -> None:
        """Debug-only: reject a literal value outside an enum attribute's set,
        with a suggestion — the jinja-roos-style author diagnostic."""
        from .registry import AttributeType

        attr_def = component_def.get_attribute(attr_name)
        if attr_def is None or attr_def.type != AttributeType.ENUM or not attr_def.enum_values:
            return
        # Skip dynamic / empty values — only plain literals are checkable.
        if not value or _has_jinja(value):
            return
        if value in attr_def.enum_values:
            return
        close = get_close_matches(value, attr_def.enum_values, n=1, cutoff=0.4)
        allowed = ", ".join(attr_def.enum_values)
        raise ComponentError(
            f"Invalid value '{value}' for attribute '{attr_name}' on '{tag_name}'. "
            f"Allowed: {allowed}",
            location=_source_location(source, parsed.span.start),
            suggestion=close[0] if close else None,
        )

    def _validate_icon_value(
        self, source: str, value: str, parsed: Attr, tag_name: str, attr_name: str
    ) -> None:
        """Debug-only: an icon name that resolves to no icon in an active theme's
        set renders as a blank box. Catches typos and one-theme-only icons — the
        jinja-roos-style diagnostic the icon vocabulary was missing."""
        icons = _load_icons()
        if not icons or not value or _has_jinja(value):
            return
        active = [t for t in getattr(self, "design_systems", ()) if t in icons["_sets"]]
        if not active:  # no theme with an icon set (e.g. lotc-layout only)
            return
        aliases = icons.get("aliases", {})
        missing = [
            t for t in active if aliases.get(value, {}).get(t, value) not in icons["_sets"][t]
        ]
        if not missing:
            return
        pool = list(aliases.keys()) + [n for t in active for n in icons["sets"][t]]
        close = get_close_matches(value, pool, n=1, cutoff=0.5)
        raise ComponentError(
            f"Unknown icon '{value}' for '{attr_name}' on '{tag_name}' — not in the "
            f"{', '.join(missing)} icon set, so it renders as a blank box.",
            location=_source_location(source, parsed.span.start),
            suggestion=close[0] if close else None,
        )

    def _is_generic_html_attribute(self, attr_name: str) -> bool:
        """Check if an attribute is a generic HTML attribute or utility attribute."""
        generic_prefixes = ("data-", "aria-", "hx-")
        for prefix in generic_prefixes:
            if attr_name.startswith(prefix):
                return True
        # Utility attributes used by _attribute_mixin.j2, plus `slot` (the web
        # component slot the element is placed into, e.g. a utility menu bar).
        return attr_name in {"text-style", "margin", "padding", "slot"}

    # ── include building ─────────────────────────────────────────────────────
    def _build_include(
        self,
        component_name: str,
        attrs: Dict[str, Any],
        content: Optional[str],
        state: "_CompileState",
        named_slots: Optional[Dict[str, str]] = None,
    ) -> str:
        """Build the Jinja2 include statement."""
        from .registry import AttributeType

        template_path = f"components/{component_name}.html.j2"
        context_items = []
        set_statements: List[str] = []

        component_def = self.registry.get_component(component_name)

        for key, value in attrs.items():
            if key.startswith(":"):
                clean_key = key[1:]
                if value in ["true", "false"]:
                    context_items.append(f'"{clean_key}": {value.capitalize()}')
                else:
                    context_items.append(
                        f'"{clean_key}": {self._wrap_binding(clean_key, value, component_def)}'
                    )
            elif key.startswith("@"):
                escaped_value = value.replace('"', '\\"')
                context_items.append(f"'{key}': \"{escaped_value}\"")
            elif (mexpr := _mustache_expr(value)) is not None:
                # attr="{{ expr }}" — the Jinja-style equivalent of :attr="expr":
                # evaluate the expression (object-preserving), validated if a binding.
                if mexpr in ("true", "false"):
                    context_items.append(f'"{key}": {mexpr.capitalize()}')
                else:
                    context_items.append(f'"{key}": {self._wrap_binding(key, mexpr, component_def)}')
            elif _has_jinja(value):
                # Mixed literal + {{ }} / {% %} (e.g. href="/u/{{ id }}") — render it
                # to a string via a capture block, so Jinja evaluates the embedded code.
                cap = f"_attr_{self._generate_id(state)}"
                set_statements.append(f"{{% set {cap} %}}{value}{{% endset %}}")
                context_items.append(f'"{key}": {cap}')
            else:
                # Check if this is a boolean attribute
                attr_def = component_def.get_attribute(key) if component_def else None
                if attr_def and attr_def.type == AttributeType.BOOLEAN:
                    # Boolean attribute: empty string or missing value means True
                    str_value = str(value) if value is not None else ""
                    if str_value.lower() in ("false", "0", "no", "off"):
                        context_items.append(f'"{key}": False')
                    else:
                        context_items.append(f'"{key}": True')
                else:
                    str_value = str(value) if value is not None else ""
                    escaped_value = str_value.replace('"', '\\"')
                    context_items.append(f'"{key}": "{escaped_value}"')

        # Handle default content
        if content:
            var_suffix = self._generate_id(state)
            capture_var = f"_captured_content_{var_suffix}"
            set_statements.append(f"{{% set {capture_var} %}}{content}{{% endset %}}")
            context_items.append(f'"content": {capture_var}')

        # Handle named slots
        slot_items: List[str] = []
        if named_slots:
            for slot_name, slot_content in named_slots.items():
                var_suffix = self._generate_id(state)
                slot_var = f"_slot_{slot_name}_{var_suffix}"
                set_statements.append(f"{{% set {slot_var} %}}{slot_content}{{% endset %}}")
                slot_items.append(f'"{slot_name}": {slot_var}')

        # Build slots dict if we have named slots
        if slot_items:
            slots_dict = "{" + ", ".join(slot_items) + "}"
            context_items.append(f'"slots": {slots_dict}')

        context_str = ", ".join(context_items)
        set_stmts_str = "".join(set_statements)

        # Prefer calling the template's `lotc_render` macro directly (registered as
        # a global at setup) — a compiled function call, far cheaper than the
        # {% include %} machinery. Fall back to the include when no macro is
        # registered (e.g. bare-extension unit tests with no loader).
        macro_global = f"_lotc_jinja_{_py_ident(component_name)}"
        if self._ensure_jinja_macro(component_name) is not None:
            return f"{set_stmts_str}{{{{ {macro_global}({{{context_str}}}) }}}}"
        return (
            f"{set_stmts_str}"
            f"{{% set _component_context = {{{context_str}}} %}}"
            f'{{% include "{template_path}" with context %}}'
        )

    def _generate_id(self, state: "_CompileState") -> str:
        """Return a unique-per-compile suffix for generated variable names."""
        state.counter += 1
        return str(state.counter)

    # ── Python renderer backend (F3) ─────────────────────────────────────────
    _GENERIC_PREFIXES = ("data-", "aria-", "hx-")
    _GENERIC_NAMES = frozenset({"id", "title", "style", "role", "tabindex", "slot"})

    def _build_python_call(
        self,
        component_name: str,
        component_def: Any,
        attrs: Dict[str, Any],
        content: Optional[str],
        state: "_CompileState",
        render_theme: Optional[str] = None,
    ) -> str:
        """Emit `{{ _lotc_<theme>_<name>(...) }}` for a Python-backend component."""
        theme = render_theme or self.render_theme
        kwargs: List[str] = []
        extra_items: List[str] = []
        class_expr: Optional[str] = None
        set_stmts: List[str] = []

        def value_expr(raw: str) -> str:
            # Interpolated / block values are captured (rendered) into a Markup var;
            # plain literals become Jinja string literals.
            if "{{" in raw or "{%" in raw:
                var = f"_lotc_a{self._generate_id(state)}"
                set_stmts.append(f"{{% set {var} %}}{raw}{{% endset %}}")
                return var
            return _py_string(raw)

        for key, value in attrs.items():
            if key.startswith(":"):
                clean = key[1:]
                wrapped = self._wrap_binding(clean, value, component_def)
                if clean == "class":
                    class_expr = wrapped
                elif clean in getattr(component_def, "bindings", {}):
                    kwargs.append(f"{_py_ident(clean)}={wrapped}")
                elif component_def.get_attribute(clean):
                    kwargs.append(f"{_py_ident(clean)}={wrapped}")
                else:
                    extra_items.append(f"{_py_string(clean)}: ({wrapped})")
            elif key.startswith("@"):
                extra_items.append(f"{_py_string(key)}: {_py_string(value)}")
            elif key == "class":
                class_expr = _py_string(value)
            else:
                attr_def = component_def.get_attribute(key)
                is_generic = key.startswith(self._GENERIC_PREFIXES) or key in self._GENERIC_NAMES
                if attr_def is not None:
                    from .registry import AttributeType

                    if attr_def.type == AttributeType.BOOLEAN:
                        bexpr = _mustache_expr(value)
                        if bexpr is not None:
                            # disabled="{{ flag }}" — evaluate, like :disabled="flag".
                            kwargs.append(f"{_py_ident(key)}=({bexpr})")
                        else:
                            falsy = str(value).lower() in ("false", "0", "no", "off")
                            kwargs.append(f"{_py_ident(key)}={'False' if falsy else 'True'}")
                    else:
                        kwargs.append(f"{_py_ident(key)}={value_expr(value)}")
                    if is_generic:
                        # A def prop that is also a passthrough attribute is rendered
                        # on the root too (matches the old generic-attributes macro).
                        extra_items.append(f"{_py_string(key)}: {value_expr(value)}")
                else:
                    extra_items.append(f"{_py_string(key)}: {value_expr(value)}")

        if content:
            var = f"_lotc_c{self._generate_id(state)}"
            set_stmts.append(f"{{% set {var} %}}{content}{{% endset %}}")
            kwargs.append(f"content={var}")
        if extra_items:
            kwargs.append("_extra={" + ", ".join(extra_items) + "}")
        if class_expr:
            kwargs.append(f"_class={class_expr}")

        global_name = f"_lotc_{theme}_{_py_ident(component_name)}"
        call = f"{{{{ {global_name}({', '.join(kwargs)}) }}}}"
        return "".join(set_stmts) + call

    def _fold_component(
        self,
        component_name: str,
        component_def: Any,
        attrs: Dict[str, Any],
        content: Optional[str],
        render_theme: Optional[str] = None,
    ) -> Optional[str]:
        """Render a fully-literal component at compile time to literal HTML.

        Returns the rendered HTML (wrapped in {% raw %} if it happens to contain
        Jinja delimiters), or None if the renderer function is not available.
        """
        from markupsafe import Markup

        from .registry import AttributeType

        global_name = f"_lotc_{render_theme or self.render_theme}_{_py_ident(component_name)}"
        fn: Any = self.environment.globals.get(global_name)
        if fn is None:
            return None

        kwargs: Dict[str, Any] = {}
        extra: Dict[str, Any] = {}
        css_class = ""
        for key, value in attrs.items():
            if key.startswith("@"):
                extra[key] = value
            elif key == "class":
                css_class = value
            else:
                attr_def = component_def.get_attribute(key)
                is_generic = key.startswith(self._GENERIC_PREFIXES) or key in self._GENERIC_NAMES
                if attr_def is not None:
                    if attr_def.type == AttributeType.BOOLEAN:
                        kwargs[_py_ident(key)] = str(value).lower() not in ("false", "0", "no", "off")
                    else:
                        kwargs[_py_ident(key)] = value
                    if is_generic:
                        extra[key] = value
                else:
                    extra[key] = value

        if content:
            kwargs["content"] = Markup(content)
        if extra:
            kwargs["_extra"] = extra
        if css_class:
            kwargs["_class"] = css_class

        html = str(fn(**kwargs))
        if _has_jinja(html):
            return f"{{% raw %}}{html}{{% endraw %}}"
        return html

    def _python_impl_theme(
        self, component_name: str, explicit: Optional[str], owner: Optional[str]
    ) -> Optional[str]:
        """The active design system that provides this python-backend component's
        renderer (`_lotc_<theme>_<name>`), searched: explicit theme=, then owner,
        then declared order. None if no active system implements it."""
        ident = _py_ident(component_name)
        for cand in (explicit, owner, *self.design_systems):
            if cand and f"_lotc_{cand}_{ident}" in self.environment.globals:
                return cand
        return None

    def _jinja_impl_available(self, component_name: str) -> bool:
        """Whether a jinja template exists for this component on the loader path
        (i.e. some active design system — or core — implements it)."""
        if self._ensure_jinja_macro(component_name) is not None:
            return True
        loader = getattr(self.environment, "loader", None)
        if loader is None:
            return True  # bare-extension tests: don't second-guess, use the include
        from jinja2 import TemplateNotFound

        try:
            self.environment.get_template(f"components/{component_name}.html.j2")
            return True
        except (TemplateNotFound, TypeError):
            return False

    def _missing_impl(self, component_name: str, tag_name: str, location: Any) -> str:
        """Handle a globally-defined component that no active design system
        implements: raise (default) or emit a visible placeholder."""
        active = ", ".join(self.design_systems) or "none"
        if self.on_missing_component == "placeholder":
            from markupsafe import escape

            return (
                f'<div class="lotc-unimplemented" data-lotc-component="{escape(component_name)}">'
                f"&lt;{escape(tag_name)}&gt; not implemented in theme(s): {escape(active)}</div>"
            )
        raise ComponentError(
            f"'{tag_name}' is not implemented by the active design system(s): [{active}]. "
            f"Implement it for one of them, activate a system that provides it, or set "
            f"setup_components(on_missing_component='placeholder') to preview the gap.",
            location=location,
        )

    def _ensure_jinja_macro(self, component_name: str) -> Optional[Any]:
        """Lazily load a jinja component template's `lotc_render` macro and cache
        it as the global `_lotc_jinja_<name>`, so the emitter can call it directly
        instead of paying {% include %} overhead. Registered on first use (not at
        setup) so a page only pays for the components it actually uses. Returns the
        macro, or None (no loader / missing template / no macro)."""
        key = f"_lotc_jinja_{_py_ident(component_name)}"
        macro = self.environment.globals.get(key)
        if macro is not None:
            return macro
        if component_name in self._jinja_macro_missing:
            return None
        if getattr(self.environment, "loader", None) is None:
            self._jinja_macro_missing.add(component_name)
            return None
        try:
            tmpl = self.environment.get_template(f"components/{component_name}.html.j2")
            macro = getattr(tmpl.module, "lotc_render", None)
        except Exception:  # noqa: BLE001 — missing template etc.: fall back to include
            macro = None
        if macro is None:
            self._jinja_macro_missing.add(component_name)
            return None
        self.environment.globals[key] = macro
        return macro

    def _fold_jinja_component(
        self,
        component_name: str,
        component_def: Any,
        attrs: Dict[str, Any],
        content: Optional[str],
        named_slots: Optional[Dict[str, str]],
    ) -> Optional[str]:
        """Render a fully-static jinja-backend component at compile time to literal
        HTML, so its `{% include %}` is gone at render time. Returns None (falling
        back to the include) if the template is missing or rendering fails.
        """
        from markupsafe import Markup

        from .registry import AttributeType

        # The component renders via its `lotc_render` macro. No macro (e.g. no
        # loader) -> can't fold; use the include.
        macro = self._ensure_jinja_macro(component_name)
        if macro is None:
            return None

        # Build _component_context as real Python values (mirrors _build_include's
        # dict, but evaluated now instead of emitted as a Jinja literal).
        ctx: Dict[str, Any] = {}
        for key, value in attrs.items():
            if key.startswith(("@", ":")):
                # Events pass through; ':' can't occur here (guarded by _is_foldable).
                ctx[key] = value
                continue
            attr_def = component_def.get_attribute(key) if component_def else None
            if attr_def is not None and attr_def.type == AttributeType.BOOLEAN:
                sv = str(value).lower() if value is not None else ""
                ctx[key] = sv not in ("false", "0", "no", "off")
            else:
                ctx[key] = value if value is not None else ""
        if content:
            ctx["content"] = Markup(content)  # already-safe rendered children
        if named_slots:
            ctx["slots"] = {name: Markup(html) for name, html in named_slots.items()}

        try:
            html = str(macro(ctx))
        except Exception:  # noqa: BLE001 — any failure: fall back to the include
            return None
        if _has_jinja(html):
            return f"{{% raw %}}{html}{{% endraw %}}"
        return html


def setup_components(
    jinja_env: Environment,
    design_systems: Optional[List[str]] = None,
    theme: Optional[str] = None,
    htmx: bool = False,
    user_css_files: Optional[List[str]] = None,
    user_js_files: Optional[List[str]] = None,
    static_url_prefix: str = "/static/lotc/",
    registry_path: Optional[str] = None,
    validate_data: bool = True,
    fold: bool = True,
    debug: bool = False,
    on_missing_component: str = "error",
    on_unknown_attribute: str = "error",
    on_unknown_value: str = "ignore",
) -> Environment:
    """
    Setup Lord of the Components in a Jinja2 environment.

    Args:
        jinja_env: The Jinja2 environment to configure
        design_systems: Design systems available on this page (e.g. ["rvo"]).
            Only these are loaded. The theme-agnostic "system" layer (LOTC's own
            layout + basic HTML) is always present and needs none of them. There
            is NO implicit default design system — declare what you use. The first
            entry is the primary/active one for design-system components.
        theme: Deprecated single-design-system alias. `theme="rvo"` is equivalent
            to `design_systems=["rvo"]`. Ignored when `design_systems` is given.
        htmx: Whether to include HTMX library
        user_css_files: List of additional CSS files to include
        user_js_files: List of additional JS files to include
        static_url_prefix: URL prefix for static assets
        registry_path: Optional path to generated registry.json file
        validate_data: Whether to validate dynamic data structures
        fold: Render fully-literal python components at compile time (default True;
            set False to debug the runtime renderer calls)
        debug: Extra author-facing diagnostics. Shorthand that turns on the
            value checks below (equivalent to on_unknown_value="error").
        on_unknown_attribute: What to do when a page uses an attribute a
            component does not declare. "error" (default) raises with a
            suggestion; "ignore" tolerates it (the attribute is dropped, no
            error) for lenient rendering.
        on_unknown_value: What to do when an attribute *value* is not
            recognised — an icon name that resolves to no icon in an active
            theme's set (a blank box), or a literal outside an enum's allowed
            set. "ignore" (default) renders as-is; "error" raises with a
            suggestion. `debug=True` forces "error".

    Returns:
        Configured Jinja2 environment
    """
    _choices = {"error", "ignore"}
    if on_unknown_attribute not in _choices:
        raise ValueError(f"on_unknown_attribute must be one of {sorted(_choices)}")
    if on_unknown_value not in _choices:
        raise ValueError(f"on_unknown_value must be one of {sorted(_choices)}")
    import os
    from pathlib import Path

    if not jinja_env.autoescape:
        raise RuntimeError(
            "Lord of the Components requires autoescape to be enabled on the Jinja2 "
            "environment (Environment(autoescape=True)). Component renderers escape "
            "prop values and treat content as already-safe Markup; with autoescape "
            "off, user data would not be escaped."
        )

    jinja_env.add_extension(ComponentExtension)

    # Load custom registry if provided
    if registry_path:
        ext = jinja_env.extensions.get(ComponentExtension.identifier)
        if ext and isinstance(ext, ComponentExtension):
            ext.registry = ComponentRegistry(Path(registry_path))

    component_templates_path = os.path.join(os.path.dirname(__file__), "templates")

    # Add templates path to FileSystemLoader if available
    loader = jinja_env.loader
    if loader is not None and hasattr(loader, "searchpath"):
        searchpath = getattr(loader, "searchpath", None)
        if isinstance(searchpath, list):
            searchpath.append(component_templates_path)
        elif searchpath is not None:
            setattr(loader, "searchpath", [searchpath, component_templates_path])

    # Resolve the declared design systems. `theme=` is the legacy single-system
    # alias. No implicit default: with neither given, only the system layer is
    # available and design-system components raise a clear error when used.
    if design_systems is not None:
        declared = list(design_systems)
    elif theme is not None and theme not in SYSTEM_ALIASES:
        declared = [theme]
    else:
        declared = []
    resolved = tuple(_resolve_theme(t) for t in declared)  # -> DesignSystem descriptors
    primary = resolved[0].name if resolved else None

    # Register the generated Python renderers (the fast backend) for every
    # declared design system — loading only what the page asked for. Each system
    # may also contribute its own templates dir to the loader search path (used
    # once the systems are extracted into their own packages).
    ext = jinja_env.extensions.get(ComponentExtension.identifier)
    if isinstance(ext, ComponentExtension):
        ext.fold = fold
        ext.validate_data = validate_data
        ext.on_missing_component = on_missing_component
        ext.debug = debug
        ext.on_unknown_attribute = on_unknown_attribute
        ext.on_unknown_value = on_unknown_value
        ext.design_systems = tuple(ds.name for ds in resolved)
        ext.render_theme = primary
    for ds in resolved:
        _register_theme_renderers(jinja_env, ds)
        ds_searchpath = getattr(loader, "searchpath", None)
        if ds.templates_path is not None and isinstance(ds_searchpath, list):
            ds_searchpath.append(str(ds.templates_path))
        # Merge any component definitions this design system OWNS (theme-specific
        # components absent from core, e.g. BGNLDD's c-metric), tagged with its
        # owner theme so the emitter routes them to this system's renderer.
        if ds.registry_path is not None and isinstance(ext, ComponentExtension):
            ext.registry.merge_fragment(Path(ds.registry_path), ds.name)

    # Expose the active design systems (with their CSS bundle URLs) so `c-page`
    # can emit the right <link>/<script> tags for whatever the page declared.
    if isinstance(ext, ComponentExtension):
        ext.active_design_systems = resolved

    from markupsafe import Markup

    def _design_system_assets() -> Markup:
        """<head> asset tags for every declared design system (CSS + JS + extra).

        A page calls `{{ get_design_system_assets() }}` in its <head> to load the
        bundles for whatever it declared — e.g. the NLDD web-components module plus
        BGNLDD's bg-components.css on top of it. Each design system is
        self-describing (css_urls / js_urls / extra_head).
        """
        tags: list[str] = []
        for ds in resolved:
            tags += [f'<link rel="stylesheet" href="{u}">' for u in ds.css_urls]
            tags += [f'<script type="module" src="{u}"></script>' for u in ds.js_urls]
            if ds.extra_head:
                tags.append(ds.extra_head)
        return Markup("\n    ".join(tags))

    jinja_env.globals["get_design_system_assets"] = _design_system_assets

    # Render-time data-binding validation (:items, :columns, ...).
    from .validation import validate_binding

    jinja_env.globals["_lotc_validate"] = validate_binding

    jinja_env.globals["get_component_assets"] = lambda: _get_component_assets(
        static_url_prefix, htmx, user_css_files, user_js_files
    )
    jinja_env.globals["lotc_theme"] = primary or "system"
    # The active design systems, in declared order. Templates that must branch on
    # the *visual* theme (e.g. a capability set like lotc-forms rendering NLDD vs
    # RVO field markup) check membership here — robust regardless of which entry is
    # primary, since a layout/forms set is often declared before the visual theme.
    jinja_env.globals["lotc_design_systems"] = tuple(ds.name for ds in resolved)
    jinja_env.globals["lotc_htmx"] = htmx
    jinja_env.globals["lotc_validate_data"] = validate_data

    return jinja_env


def _get_component_assets(
    static_url_prefix: str = "/static/lotc/",
    htmx: bool = False,
    user_css_files: Optional[List[str]] = None,
    user_js_files: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """Get the URLs for component CSS and JS assets.

    Returns all bundled CSS and JS file URLs produced by the webpack build pipeline.
    The assets include the main lotc bundle plus all @nl-rvo package CSS files.
    """
    dist = f"{static_url_prefix}dist/"
    css_files = [
        f"{dist}lotc.css",
        f"{dist}@nl-rvo/assets/fonts/index.css",
        f"{dist}@nl-rvo/assets/icons/index.css",
        f"{dist}@nl-rvo/assets/images/index.css",
        f"{dist}@nl-rvo/design-tokens/index.css",
        f"{dist}@nl-rvo/component-library-css/index.css",
        f"{dist}@nl-rvo/css-button/index.css",
    ]
    js_files = [
        f"{dist}lotc.js",
    ]

    if htmx:
        js_files.insert(0, "https://unpkg.com/htmx.org@1.9.12/dist/htmx.min.js")

    if user_css_files:
        css_files.extend(user_css_files)
    if user_js_files:
        js_files.extend(user_js_files)

    return {
        "css_files": css_files,
        "js_files": js_files,
        "htmx_enabled": htmx,
    }
