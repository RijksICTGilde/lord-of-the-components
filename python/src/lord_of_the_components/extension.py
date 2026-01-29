"""
Jinja2 Component Extension using DOM-based parsing with BeautifulSoup.

Transforms custom component tags into standard Jinja2 includes:
<c-button variant="primary">Click me</c-button>
-> {% include "components/button.html.j2" with context %}
"""

import logging
import random
import string
from typing import Any, Dict, List, Optional

from bs4 import BeautifulSoup, NavigableString, Tag
from jinja2 import Environment
from jinja2.ext import Extension

from .registry import ComponentRegistry

logger = logging.getLogger(__name__)


class ComponentExtension(Extension):
    """
    Jinja2 extension that preprocesses component syntax using BeautifulSoup DOM parsing.
    """

    def __init__(self, environment: Environment) -> None:
        super().__init__(environment)
        self.registry = ComponentRegistry()
        self._jinja_placeholders: Dict[str, str] = {}

    def preprocess(
        self, source: str, name: Optional[str], filename: Optional[str] = None
    ) -> str:
        """
        Preprocess the template source to convert component syntax to Jinja2 includes.
        """
        template_id = filename or name or "<unknown>"
        logger.debug(f"Preprocessing template: {template_id}")
        self._jinja_placeholders.clear()

        try:
            soup = BeautifulSoup(source, features="html.parser")
            self._process_components_in_soup(soup)
            result = str(soup)
            result = self._restore_jinja_tags(result)
            logger.debug(f"Successfully processed template: {template_id}")
            return result

        except Exception as e:
            logger.error(f"Component preprocessing failed for template {template_id}: {e}")
            raise RuntimeError(
                f"Component preprocessing failed for template '{template_id}': {e}"
            ) from e

    def _process_components_in_soup(self, soup: BeautifulSoup) -> None:
        """
        Process all component tags in the BeautifulSoup tree.
        Works from the deepest components up (bottom-up processing).
        """
        processed = set()

        while True:
            found_any = False
            for tag in soup.find_all(self._is_component_tag):
                if id(tag) not in processed:
                    child_components = tag.find_all(self._is_component_tag)
                    if all(id(child) in processed for child in child_components):
                        self._process_single_component(tag)
                        processed.add(id(tag))
                        found_any = True
                        break

            if not found_any:
                break

    def _is_component_tag(self, tag: Any) -> bool:
        """Check if a tag is a component tag (starts with 'c-')."""
        if not hasattr(tag, "name"):
            return False
        return tag.name and tag.name.startswith("c-")

    def _process_single_component(self, tag: Tag) -> None:
        """
        Process a single component tag and replace it with Jinja2 include.
        """
        component_name = tag.name[2:]  # Remove 'c-' prefix

        if not self.registry.has_component(component_name):
            available = ", ".join(sorted(self.registry.get_all_component_names()))
            raise ValueError(
                f"Unknown component '{tag.name}'. Available components: {available}"
            )

        component_def = self.registry.get_component(component_name)
        attrs = self._parse_component_attributes(tag, component_def)

        content = None
        if tag.contents:
            content_parts = []
            for child in tag.contents:
                content_parts.append(str(child))
            content = "".join(content_parts).strip()

        include_str = self._build_include(component_name, attrs, content)

        placeholder = f"JINJA2_PLACEHOLDER_{self._generate_id()}"
        tag.replace_with(placeholder)
        self._jinja_placeholders[placeholder] = include_str

    def _parse_component_attributes(
        self, tag: Tag, component_def: Any
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
            elif attr_value is None:
                attr_value = ""
            else:
                attr_value = str(attr_value)

            if attr_name.startswith(":") or attr_name.startswith("@"):
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
                    raise ValueError(
                        f"Unknown attribute '{attr_name}' used in component '{tag.name}'. "
                        f"Available attributes for '{component_def.name}': {', '.join(available)}"
                    )

        return attrs

    def _is_generic_html_attribute(self, attr_name: str) -> bool:
        """Check if an attribute is a generic HTML attribute."""
        generic_prefixes = ["data-", "aria-", "hx-"]
        for prefix in generic_prefixes:
            if attr_name.startswith(prefix):
                return True
        return False

    def _build_include(
        self, component_name: str, attrs: Dict[str, Any], content: Optional[str]
    ) -> str:
        """Build the Jinja2 include statement."""
        template_path = f"components/{component_name}.html.j2"
        context_items = []

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
                str_value = str(value) if value is not None else ""
                escaped_value = str_value.replace('"', '\\"')
                context_items.append(f'"{key}": "{escaped_value}"')

        if content:
            var_suffix = self._generate_id()
            capture_var = f"_captured_content_{var_suffix}"
            content_part = f'"content": {capture_var}'
            context_str = ", ".join(context_items) if context_items else ""
            full_context = context_str + (", " if context_str else "") + content_part

            return (
                f"{{% set {capture_var} %}}{content}{{% endset %}}"
                f"{{% set _component_context = {{{full_context}}} %}}"
                f'{{% include "{template_path}" with context %}}'
            )
        else:
            context_str = ", ".join(context_items)
            return (
                f"{{% set _component_context = {{{context_str}}} %}}"
                f'{{% include "{template_path}" with context %}}'
            )

    def _generate_id(self) -> str:
        """Generate a unique ID for variable names."""
        return "".join(random.choices(string.ascii_lowercase, k=8))

    def _restore_jinja_tags(self, html: str) -> str:
        """Restore Jinja2 placeholders with actual Jinja2 tags."""
        import html as html_module

        max_iterations = 10
        iteration = 0

        while "JINJA2_PLACEHOLDER_" in html and iteration < max_iterations:
            replaced_any = False
            for placeholder, jinja_code in self._jinja_placeholders.items():
                if placeholder in html:
                    html = html.replace(placeholder, jinja_code)
                    replaced_any = True

            if not replaced_any:
                logger.warning(
                    f"Orphaned placeholders found after {iteration} iterations"
                )
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
    """Get the URLs for component CSS and JS assets."""
    css_files = [f"{static_url_prefix}tokens.css"]
    js_files: List[str] = []

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
