"""
Lord of the Components - Python Integration

Implementation-agnostic component system with c- prefixed tagnames.
"""

from .extension import ComponentExtension, ComponentError, SourceLocation, setup_components
from .registry import ComponentRegistry, ComponentDefinition, AttributeDefinition
from .validation import (
    DataValidator,
    ValidationResult,
    ValidationError,
    ExpressionError,
    validate_items,
    validate_columns,
    validate_steps,
    validate_generic_size,
    validate_generic_color,
    validate_expression,
    validate_dynamic_attribute,
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
]
