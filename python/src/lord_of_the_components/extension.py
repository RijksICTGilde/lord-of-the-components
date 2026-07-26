"""
Jinja2 Component Extension using DOM-based parsing with BeautifulSoup.

Transforms custom component tags into standard Jinja2 includes:
<c-button variant="primary">Click me</c-button>
-> {% include "components/button.html.j2" with context %}
"""

import hashlib
import logging
import re
from collections import deque
from dataclasses import dataclass, field
from difflib import get_close_matches
from typing import Any, Dict, List, Optional, Set

from bs4 import BeautifulSoup, Tag
from jinja2 import Environment
from jinja2.ext import Extension

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


def _find_tag_location(source: str, tag_name: str, occurrence: int = 0) -> Optional[SourceLocation]:
    """
    Find the line and column of a tag in the source.

    Args:
        source: The original template source
        tag_name: The tag name to find (e.g., 'c-button')
        occurrence: Which occurrence to find (0-indexed)

    Returns:
        SourceLocation or None if not found
    """
    # Pattern to match opening tags with the given name
    pattern = rf"<{re.escape(tag_name)}(?:\s|>|/)"
    matches = list(re.finditer(pattern, source, re.IGNORECASE))

    if occurrence >= len(matches):
        return None

    match = matches[occurrence]
    pos = match.start()

    # Calculate line and column
    lines_before = source[:pos].split("\n")
    line = len(lines_before)
    column = len(lines_before[-1]) + 1 if lines_before else 1

    return SourceLocation(line=line, column=column)


def _find_attribute_location(
    source: str, tag_name: str, attr_name: str, tag_occurrence: int = 0
) -> Optional[SourceLocation]:
    """
    Find the line and column of an attribute within a tag.

    Args:
        source: The original template source
        tag_name: The tag name containing the attribute
        attr_name: The attribute name to find
        tag_occurrence: Which occurrence of the tag (0-indexed)

    Returns:
        SourceLocation or None if not found
    """
    # First, find the tag
    tag_pattern = rf"<{re.escape(tag_name)}[^>]*>"
    tag_matches = list(re.finditer(tag_pattern, source, re.IGNORECASE | re.DOTALL))

    if tag_occurrence >= len(tag_matches):
        return None

    tag_match = tag_matches[tag_occurrence]
    tag_content = tag_match.group()
    tag_start = tag_match.start()

    # Find the attribute within the tag
    # Handle both attr="value" and :attr="value" and @attr="value"
    attr_pattern = rf'(?:^|[\s])({re.escape(attr_name)})(?:=|[\s>])'
    attr_match = re.search(attr_pattern, tag_content, re.IGNORECASE)

    if not attr_match:
        # Fallback: try to find attribute with prefix stripped for :attr
        clean_attr = attr_name.lstrip(":@")
        attr_pattern = rf'(?:^|[\s])[:@]?({re.escape(clean_attr)})(?:=|[\s>])'
        attr_match = re.search(attr_pattern, tag_content, re.IGNORECASE)

    if not attr_match:
        return None

    # Calculate absolute position
    attr_pos = tag_start + attr_match.start(1)

    # Calculate line and column
    lines_before = source[:attr_pos].split("\n")
    line = len(lines_before)
    column = len(lines_before[-1]) + 1 if lines_before else 1

    return SourceLocation(line=line, column=column)


@dataclass
class _CompileState:
    """Per-compile state for a single preprocess() call.

    Kept off the extension instance so concurrent compiles in a threaded server
    cannot corrupt each other's placeholders/counters (the extension instance is
    shared across the whole Environment).
    """

    template_id: str
    source: str
    placeholders: Dict[str, str] = field(default_factory=dict)
    placeholder_counter: int = 0
    tag_occurrence_counts: Dict[str, int] = field(default_factory=dict)


class ComponentExtension(Extension):
    """
    Jinja2 extension that preprocesses component syntax using BeautifulSoup DOM parsing.
    """

    def __init__(self, environment: Environment) -> None:
        super().__init__(environment)
        self.registry = ComponentRegistry()

    def preprocess(
        self, source: str, name: Optional[str], filename: Optional[str] = None
    ) -> str:
        """
        Preprocess the template source to convert component syntax to Jinja2 includes.
        """
        template_id = filename or name or "<unknown>"
        logger.debug("Preprocessing template: %s", template_id)

        # If no component tags exist, skip BeautifulSoup entirely
        if "<c-" not in source:
            return source

        state = _CompileState(template_id=template_id, source=source)

        try:
            soup = BeautifulSoup(source, features="html.parser")
            self._process_components_in_soup(soup, state)
            result = str(soup)
            result = self._restore_jinja_tags(result, state)
            logger.debug("Successfully processed template: %s", template_id)
            return result

        except ComponentError:
            # Re-raise ComponentError as-is (already has location info)
            raise

        except Exception as e:
            logger.error("Component preprocessing failed for template %s: %s", template_id, e)
            raise RuntimeError(
                f"Component preprocessing failed for template '{template_id}': {e}"
            ) from e

    def _process_components_in_soup(self, soup: BeautifulSoup, state: "_CompileState") -> None:
        """
        Process all component tags in the BeautifulSoup tree using topological sort.

        Uses Kahn's algorithm to build a processing order where child components
        are always processed before their parent components (bottom-up).
        """
        # Find all component tags
        all_components: List[Tag] = list(soup.find_all(self._is_component_tag))

        if not all_components:
            return

        # Build dependency graph and check nesting depth
        # For each component, track which components are its direct children
        # A component depends on its children (must process children first)
        tag_to_id: Dict[int, Tag] = {id(tag): tag for tag in all_components}
        children_of: Dict[int, Set[int]] = {id(tag): set() for tag in all_components}
        parent_of: Dict[int, Optional[int]] = {id(tag): None for tag in all_components}

        for tag in all_components:
            # Find direct child components (not nested further down)
            for child in tag.find_all(self._is_component_tag, recursive=True):
                child_id = id(child)
                tag_id = id(tag)
                if child_id in tag_to_id:
                    # Find the immediate parent component of this child
                    current = child.parent
                    while current is not None:
                        if id(current) == tag_id:
                            # tag is the immediate component parent of child
                            children_of[tag_id].add(child_id)
                            parent_of[child_id] = tag_id
                            break
                        elif id(current) in tag_to_id:
                            # Another component is between them
                            break
                        current = current.parent

        # Check nesting depth
        for tag in all_components:
            depth = self._calculate_nesting_depth(tag, tag_to_id)
            if depth > MAX_NESTING_DEPTH:
                location = _find_tag_location(
                    state.source,
                    tag.name,
                    state.tag_occurrence_counts.get(tag.name, 0),
                )
                raise ComponentError(
                    f"Component nesting depth ({depth}) exceeds maximum allowed ({MAX_NESTING_DEPTH})",
                    location=location,
                )

        # Topological sort using Kahn's algorithm
        # Components with no children (leaves) have in-degree 0 and are processed first
        in_degree: Dict[int, int] = {id(tag): len(children_of[id(tag)]) for tag in all_components}
        queue: deque[int] = deque()

        # Start with leaf components (no child components)
        for tag_id, degree in in_degree.items():
            if degree == 0:
                queue.append(tag_id)

        processing_order: List[Tag] = []

        while queue:
            tag_id = queue.popleft()
            tag = tag_to_id[tag_id]
            processing_order.append(tag)

            # Find the parent of this component and decrease its in-degree
            parent_id = parent_of.get(tag_id)
            if parent_id is not None and parent_id in in_degree:
                in_degree[parent_id] -= 1
                if in_degree[parent_id] == 0:
                    queue.append(parent_id)

        # Verify all components are in the processing order (detect cycles)
        if len(processing_order) != len(all_components):
            # This shouldn't happen with valid HTML, but handle it gracefully
            raise ComponentError(
                "Circular component dependency detected. This may indicate malformed HTML."
            )

        # Process components in topological order (leaves first, then their parents)
        for tag in processing_order:
            self._process_single_component(tag, state)

    def _calculate_nesting_depth(self, tag: Tag, tag_to_id: Dict[int, Tag]) -> int:
        """
        Calculate the nesting depth of a component tag.

        Counts how many component ancestors this tag has.
        """
        depth = 0
        current = tag.parent
        while current is not None:
            if id(current) in tag_to_id:
                depth += 1
            current = current.parent
        return depth

    def _is_component_tag(self, tag: Any) -> bool:
        """Check if a tag is a component tag (starts with 'c-')."""
        if not hasattr(tag, "name"):
            return False
        return bool(tag.name and tag.name.startswith("c-"))

    def _process_single_component(self, tag: Tag, state: "_CompileState") -> None:
        """
        Process a single component tag and replace it with Jinja2 include.
        """
        component_name = tag.name[2:]  # Remove 'c-' prefix
        tag_name = tag.name

        # Track occurrence count for this tag type
        occurrence = state.tag_occurrence_counts.get(tag_name, 0)
        state.tag_occurrence_counts[tag_name] = occurrence + 1

        # Get location for this tag
        location = _find_tag_location(state.source, tag_name, occurrence)

        if not self.registry.has_component(component_name):
            available = sorted(self.registry.get_all_component_names())
            # Try to find a close match for suggestion
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
        attrs = self._parse_component_attributes(tag, component_def, state, location, occurrence)

        # Extract named slots and default content
        named_slots, default_content = self._extract_slots(tag)

        include_str = self._build_include(component_name, attrs, default_content, state, named_slots)

        placeholder = f"JINJA2_PLACEHOLDER_{self._generate_id(state)}"
        tag.replace_with(placeholder)
        state.placeholders[placeholder] = include_str

    def _extract_slots(self, tag: Tag) -> tuple[Dict[str, str], Optional[str]]:
        """
        Extract named slots and default content from a component tag.

        Named slots are defined using <template slot="name">content</template>.
        All other content becomes the default content.

        Args:
            tag: The component tag to extract slots from

        Returns:
            A tuple of (named_slots dict, default_content string or None)
        """
        named_slots: Dict[str, str] = {}
        default_content_parts: List[str] = []

        for child in tag.contents:
            if isinstance(child, Tag) and child.name == "template" and child.get("slot"):
                # This is a named slot
                slot_name = child.get("slot")
                if isinstance(slot_name, list):
                    slot_name = slot_name[0]
                slot_name = str(slot_name)

                # Get the inner content of the template tag
                slot_content_parts = []
                for slot_child in child.contents:
                    slot_content_parts.append(str(slot_child))
                slot_content = "".join(slot_content_parts).strip()

                named_slots[slot_name] = slot_content
            else:
                # This is default content
                default_content_parts.append(str(child))

        default_content = "".join(default_content_parts).strip()
        return named_slots, default_content if default_content else None

    def _parse_component_attributes(
        self,
        tag: Tag,
        component_def: Any,
        state: "_CompileState",
        tag_location: Optional[SourceLocation] = None,
        tag_occurrence: int = 0,
    ) -> Dict[str, Any]:
        """Parse and validate component attributes."""
        attrs = {}

        valid_attrs = {attr.name.lower(): attr.name for attr in component_def.attributes}
        for attr in component_def.attributes:
            if any(c.isupper() for c in attr.name):
                valid_attrs[attr.name.lower()] = attr.name

        valid_attrs.update({"class": "class", "id": "id", "style": "style"})

        for attr_name, attr_value in tag.attrs.items():
            if isinstance(attr_value, list):
                attr_value = " ".join(attr_value)
            else:
                attr_value = str(attr_value) if attr_value is not None else ""

            if attr_name.startswith(":"):
                # Validate dynamic attribute expression
                is_valid, expr_error = validate_expression(attr_value)
                if not is_valid and expr_error:
                    attr_location = _find_attribute_location(
                        state.source, tag.name, attr_name, tag_occurrence
                    )
                    location = attr_location or tag_location

                    suggestion = expr_error.suggestion
                    error_msg = f"Invalid expression in '{attr_name}': {expr_error.message}"
                    if expr_error.position:
                        error_msg += f" at position {expr_error.position}"

                    raise ComponentError(
                        error_msg,
                        location=location,
                        suggestion=suggestion,
                    )
                attrs[attr_name] = attr_value
            elif attr_name.startswith("@"):
                attrs[attr_name] = attr_value
            elif self._is_generic_html_attribute(attr_name):
                attrs[attr_name] = attr_value
            else:
                clean_name = attr_name.lower()
                if clean_name in valid_attrs:
                    correct_name = valid_attrs[clean_name]
                    attrs[correct_name] = attr_value
                else:
                    available = sorted(set(valid_attrs.values()))

                    # Find location of the attribute
                    attr_location = _find_attribute_location(
                        state.source, tag.name, attr_name, tag_occurrence
                    )
                    # Fall back to tag location if attribute not found
                    location = attr_location or tag_location

                    # Try to find a suggestion
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
                            # Map back to original casing
                            for avail in available:
                                if avail.lower() == close_matches[0]:
                                    suggestion = avail
                                    break

                    raise ComponentError(
                        f"Unknown attribute '{attr_name}' on component '{tag.name}'",
                        location=location,
                        suggestion=suggestion,
                    )

        return attrs

    def _is_generic_html_attribute(self, attr_name: str) -> bool:
        """Check if an attribute is a generic HTML attribute or utility attribute."""
        generic_prefixes = ["data-", "aria-", "hx-"]
        for prefix in generic_prefixes:
            if attr_name.startswith(prefix):
                return True
        # Utility attributes used by _attribute_mixin.j2
        utility_attrs = {"text-style", "margin", "padding"}
        return attr_name in utility_attrs

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
                    context_items.append(f'"{clean_key}": {value}')
            elif key.startswith("@"):
                escaped_value = value.replace('"', '\\"')
                context_items.append(f"'{key}': \"{escaped_value}\"")
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

        return (
            f"{set_stmts_str}"
            f"{{% set _component_context = {{{context_str}}} %}}"
            f'{{% include "{template_path}" with context %}}'
        )

    def _generate_id(self, state: "_CompileState") -> str:
        """
        Generate a deterministic unique ID for variable names.

        Uses a position-based hash combining the template ID and a per-compile
        counter, ensuring reproducible output for the same input template.
        """
        state.placeholder_counter += 1
        hash_input = f"{state.template_id}:{state.placeholder_counter}"
        hash_bytes = hashlib.sha256(hash_input.encode()).hexdigest()[:8]
        return hash_bytes

    def _restore_jinja_tags(self, html: str, state: "_CompileState") -> str:
        """Restore Jinja2 placeholders with actual Jinja2 tags."""
        import html as html_module

        max_iterations = 10
        iteration = 0

        while "JINJA2_PLACEHOLDER_" in html and iteration < max_iterations:
            replaced_any = False
            for placeholder, jinja_code in state.placeholders.items():
                if placeholder in html:
                    html = html.replace(placeholder, jinja_code)
                    replaced_any = True

            if not replaced_any:
                logger.warning("Orphaned placeholders found after %d iterations", iteration)
                break

            iteration += 1

        html = html_module.unescape(html)
        return html


def setup_components(
    jinja_env: Environment,
    theme: Optional[str] = None,
    htmx: bool = False,
    user_css_files: Optional[List[str]] = None,
    user_js_files: Optional[List[str]] = None,
    static_url_prefix: str = "/static/lotc/",
    registry_path: Optional[str] = None,
    validate_data: bool = True,
) -> Environment:
    """
    Setup Lord of the Components in a Jinja2 environment.

    Args:
        jinja_env: The Jinja2 environment to configure
        theme: Optional theme name to use
        htmx: Whether to include HTMX library
        user_css_files: List of additional CSS files to include
        user_js_files: List of additional JS files to include
        static_url_prefix: URL prefix for static assets
        registry_path: Optional path to generated registry.json file
        validate_data: Whether to validate dynamic data structures

    Returns:
        Configured Jinja2 environment
    """
    import os
    from pathlib import Path

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

    jinja_env.globals["get_component_assets"] = lambda: _get_component_assets(
        static_url_prefix, htmx, user_css_files, user_js_files
    )
    jinja_env.globals["lotc_theme"] = theme or "default"
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
