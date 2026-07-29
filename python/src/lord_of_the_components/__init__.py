"""
Lord of the Components - Python Integration

Implementation-agnostic component system with c- prefixed tagnames.
"""

from .extension import ComponentError, ComponentExtension, SourceLocation, setup_components
from .registry import AttributeDefinition, ComponentDefinition, ComponentRegistry
from .validation import (
    DataValidator,
    ExpressionError,
    ValidationError,
    ValidationResult,
    validate_columns,
    validate_dynamic_attribute,
    validate_expression,
    validate_generic_color,
    validate_generic_size,
    validate_items,
    validate_steps,
)

__version__ = "0.1.0"

__all__ = [
    # Extension
    "ComponentExtension",
    "ComponentError",
    "SourceLocation",
    "setup_components",
    # Registry
    "ComponentRegistry",
    "ComponentDefinition",
    "AttributeDefinition",
    # Validation
    "DataValidator",
    "ValidationResult",
    "ValidationError",
    "ExpressionError",
    "validate_items",
    "validate_columns",
    "validate_steps",
    "validate_generic_size",
    "validate_generic_color",
    "validate_expression",
    "validate_dynamic_attribute",
    # Path helpers
    "get_static_files_path",
    "get_static_roots",
    "get_templates_path",
]


def get_static_files_path() -> str:
    """Get the path to static files for serving assets."""
    import os
    return os.path.join(os.path.dirname(__file__), "static")


def get_static_roots() -> list[str]:
    """All filesystem roots that back the ``/static/lotc/`` URL space.

    ``<c-page>`` emits ``<link>``/``<script>`` tags under ``/static/lotc/...``
    for the core styles (layout.css, app-components.css) and every design system
    you activated (its CSS/JS bundle). Those files live in different installed
    packages, so serve *all* of these roots under your app's ``/static/lotc/``
    route — a request for ``/static/lotc/<rest>`` maps to ``<root>/lotc/<rest>``,
    first match wins.

    Returns the core static dir first, then each installed design system's own
    static dir (systems without bundled assets, e.g. bgnldd, are skipped). See
    the Flask/FastAPI examples in ``examples/`` for the three-line wiring.
    """
    from .design_system import discover_design_systems

    roots = [get_static_files_path()]
    for ds in discover_design_systems().values():
        if ds.static_path is not None:
            roots.append(str(ds.static_path))
    return roots


def get_templates_path() -> str:
    """Get the path to component templates."""
    import os
    return os.path.join(os.path.dirname(__file__), "templates")
