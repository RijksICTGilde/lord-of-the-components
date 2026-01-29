"""
Data validation for component attributes.

Validates complex data structures passed to components via dynamic attributes.
Also validates expression syntax for dynamic attribute bindings (:attr="expression").
"""

import ast
import re
from dataclasses import dataclass
from typing import Any, List, Optional, Tuple, Type, Union


@dataclass
class ValidationError:
    """Represents a validation error."""

    path: str
    message: str
    value: Any


@dataclass
class ValidationResult:
    """Result of data validation."""

    valid: bool
    errors: List[ValidationError]

    @classmethod
    def success(cls) -> "ValidationResult":
        return cls(valid=True, errors=[])

    @classmethod
    def failure(cls, errors: List[ValidationError]) -> "ValidationResult":
        return cls(valid=False, errors=errors)


# =============================================================================
# SCHEMA DEFINITIONS
# =============================================================================


@dataclass
class ItemSchema:
    """Schema for items in lists (e.g., menu items, select options)."""

    label_key: str = "label"
    value_key: str = "value"
    required_keys: Optional[List[str]] = None
    optional_keys: Optional[List[str]] = None
    children_key: Optional[str] = None  # For nested items like menus


@dataclass
class ColumnSchema:
    """Schema for table columns."""

    key_key: str = "key"
    label_key: str = "label"
    required_keys: Optional[List[str]] = None


@dataclass
class StepSchema:
    """Schema for progress steps."""

    label_key: str = "label"
    state_key: str = "state"
    valid_states: Optional[List[str]] = None


# =============================================================================
# VALIDATORS
# =============================================================================


class DataValidator:
    """Validates data structures for component attributes."""

    def __init__(self) -> None:
        self._errors: List[ValidationError] = []

    def validate_items(
        self,
        items: Any,
        schema: Optional[ItemSchema] = None,
        path: str = "items",
    ) -> ValidationResult:
        """
        Validate an items array (for selects, menus, lists, etc.).

        Args:
            items: The items to validate
            schema: Optional schema defining expected structure
            path: Path for error messages
        """
        self._errors = []
        schema = schema or ItemSchema()

        if not isinstance(items, list):
            self._add_error(path, "Expected a list", items)
            return self._result()

        for i, item in enumerate(items):
            item_path = f"{path}[{i}]"
            self._validate_item(item, schema, item_path)

        return self._result()

    def validate_columns(
        self,
        columns: Any,
        schema: Optional[ColumnSchema] = None,
        path: str = "columns",
    ) -> ValidationResult:
        """
        Validate a columns array (for tables).

        Args:
            columns: The columns to validate
            schema: Optional schema defining expected structure
            path: Path for error messages
        """
        self._errors = []
        schema = schema or ColumnSchema()

        if not isinstance(columns, list):
            self._add_error(path, "Expected a list", columns)
            return self._result()

        for i, column in enumerate(columns):
            col_path = f"{path}[{i}]"

            # Accept string shorthand
            if isinstance(column, str):
                continue

            if not isinstance(column, dict):
                self._add_error(col_path, "Expected string or dict", column)
                continue

            # Check required keys
            required = schema.required_keys or [schema.key_key]
            for key in required:
                if key not in column:
                    self._add_error(col_path, f"Missing required key '{key}'", column)

        return self._result()

    def validate_steps(
        self,
        steps: Any,
        schema: Optional[StepSchema] = None,
        path: str = "steps",
    ) -> ValidationResult:
        """
        Validate a steps array (for progress trackers).

        Args:
            steps: The steps to validate
            schema: Optional schema defining expected structure
            path: Path for error messages
        """
        self._errors = []
        schema = schema or StepSchema()
        valid_states = schema.valid_states or ["pending", "current", "complete", "error"]

        if not isinstance(steps, list):
            self._add_error(path, "Expected a list", steps)
            return self._result()

        for i, step in enumerate(steps):
            step_path = f"{path}[{i}]"

            if not isinstance(step, dict):
                self._add_error(step_path, "Expected a dict", step)
                continue

            # Check label
            if schema.label_key not in step:
                self._add_error(step_path, f"Missing required key '{schema.label_key}'", step)

            # Check state if present
            if schema.state_key in step:
                state = step[schema.state_key]
                if state not in valid_states:
                    self._add_error(
                        f"{step_path}.{schema.state_key}",
                        f"Invalid state '{state}'. Valid states: {', '.join(valid_states)}",
                        state,
                    )

        return self._result()

    def validate_type(
        self,
        value: Any,
        expected_type: Union[Type, tuple],
        path: str = "value",
    ) -> ValidationResult:
        """
        Validate that a value is of the expected type.

        Args:
            value: The value to validate
            expected_type: Expected type or tuple of types
            path: Path for error messages
        """
        self._errors = []

        if not isinstance(value, expected_type):
            type_names = (
                expected_type.__name__
                if isinstance(expected_type, type)
                else " or ".join(t.__name__ for t in expected_type)
            )
            self._add_error(path, f"Expected {type_names}", value)

        return self._result()

    def _validate_item(self, item: Any, schema: ItemSchema, path: str) -> None:
        """Validate a single item."""
        if not isinstance(item, dict):
            self._add_error(path, "Expected a dict", item)
            return

        # Check required keys
        required = schema.required_keys or [schema.label_key]
        for key in required:
            if key not in item:
                self._add_error(path, f"Missing required key '{key}'", item)

        # Validate nested children
        if schema.children_key and schema.children_key in item:
            children = item[schema.children_key]
            if isinstance(children, list):
                for i, child in enumerate(children):
                    child_path = f"{path}.{schema.children_key}[{i}]"
                    self._validate_item(child, schema, child_path)
            else:
                self._add_error(
                    f"{path}.{schema.children_key}",
                    "Expected a list for children",
                    children,
                )

    def _add_error(self, path: str, message: str, value: Any) -> None:
        """Add a validation error."""
        self._errors.append(ValidationError(path=path, message=message, value=value))

    def _result(self) -> ValidationResult:
        """Create validation result."""
        if self._errors:
            return ValidationResult.failure(self._errors)
        return ValidationResult.success()


# =============================================================================
# CONVENIENCE FUNCTIONS
# =============================================================================


def validate_items(
    items: Any,
    label_key: str = "label",
    value_key: str = "value",
    children_key: Optional[str] = None,
) -> ValidationResult:
    """
    Validate an items array.

    Args:
        items: The items to validate
        label_key: Key for item label
        value_key: Key for item value
        children_key: Key for nested children (for menus)

    Returns:
        ValidationResult with errors if invalid
    """
    validator = DataValidator()
    schema = ItemSchema(
        label_key=label_key,
        value_key=value_key,
        children_key=children_key,
    )
    return validator.validate_items(items, schema)


def validate_columns(
    columns: Any,
    key_key: str = "key",
    label_key: str = "label",
) -> ValidationResult:
    """
    Validate a columns array.

    Args:
        columns: The columns to validate
        key_key: Key for column key
        label_key: Key for column label

    Returns:
        ValidationResult with errors if invalid
    """
    validator = DataValidator()
    schema = ColumnSchema(key_key=key_key, label_key=label_key)
    return validator.validate_columns(columns, schema)


def validate_steps(
    steps: Any,
    label_key: str = "label",
    state_key: str = "state",
    valid_states: Optional[List[str]] = None,
) -> ValidationResult:
    """
    Validate a steps array.

    Args:
        steps: The steps to validate
        label_key: Key for step label
        state_key: Key for step state
        valid_states: List of valid state values

    Returns:
        ValidationResult with errors if invalid
    """
    validator = DataValidator()
    schema = StepSchema(
        label_key=label_key,
        state_key=state_key,
        valid_states=valid_states,
    )
    return validator.validate_steps(steps, schema)


def validate_generic_size(value: str) -> ValidationResult:
    """Validate a generic size value."""
    valid = ["xs", "sm", "md", "lg", "xl"]
    if value not in valid:
        return ValidationResult.failure([
            ValidationError(
                path="size",
                message=f"Invalid size '{value}'. Valid sizes: {', '.join(valid)}",
                value=value,
            )
        ])
    return ValidationResult.success()


def validate_generic_color(value: str) -> ValidationResult:
    """Validate a generic color value."""
    valid = ["primary", "secondary", "success", "warning", "error", "info"]
    if value not in valid:
        return ValidationResult.failure([
            ValidationError(
                path="color",
                message=f"Invalid color '{value}'. Valid colors: {', '.join(valid)}",
                value=value,
            )
        ])
    return ValidationResult.success()


# =============================================================================
# EXPRESSION VALIDATION
# =============================================================================


@dataclass
class ExpressionError:
    """Represents an expression syntax error."""

    expression: str
    message: str
    position: Optional[int] = None
    suggestion: Optional[str] = None


def validate_expression(expression: str) -> Tuple[bool, Optional[ExpressionError]]:
    """
    Validate a Jinja2/Python expression for syntax correctness.

    This validates expressions used in dynamic attribute bindings like:
      :variant="item.variant"
      :disabled="is_loading or not is_valid"
      :items="get_menu_items()"

    Args:
        expression: The expression string to validate

    Returns:
        A tuple of (is_valid, error_or_none)
    """
    if not expression or not expression.strip():
        return False, ExpressionError(
            expression=expression,
            message="Empty expression",
        )

    expression = expression.strip()

    # Check for common Jinja2 syntax mistakes that would indicate
    # the user is mixing up syntax
    jinja_pattern_errors = _check_jinja_syntax_mistakes(expression)
    if jinja_pattern_errors:
        return False, jinja_pattern_errors

    # Check for unbalanced brackets/parentheses
    balance_error = _check_bracket_balance(expression)
    if balance_error:
        return False, balance_error

    # Try to parse as Python expression
    try:
        ast.parse(expression, mode="eval")
        return True, None
    except SyntaxError as e:
        # Try to provide a helpful error message
        error_msg = str(e.msg) if e.msg else "Invalid syntax"
        position = e.offset

        suggestion = _suggest_expression_fix(expression, error_msg)

        return False, ExpressionError(
            expression=expression,
            message=error_msg,
            position=position,
            suggestion=suggestion,
        )


def _check_jinja_syntax_mistakes(expression: str) -> Optional[ExpressionError]:
    """Check for common Jinja2 syntax mistakes in expressions."""
    # Check for {{ }} - user may be wrapping expression in Jinja tags
    if "{{" in expression or "}}" in expression:
        return ExpressionError(
            expression=expression,
            message="Expression should not contain {{ }} delimiters",
            suggestion=re.sub(r"\{\{|\}\}", "", expression).strip(),
        )

    # Check for {% %} - control structures not allowed in expressions
    if "{%" in expression or "%}" in expression:
        return ExpressionError(
            expression=expression,
            message="Expression should not contain {% %} control structures",
        )

    # Check for |safe, |e, etc. at the wrong level (these are fine in Jinja context)
    # We allow filters in expressions as they work in eval context

    return None


def _check_bracket_balance(expression: str) -> Optional[ExpressionError]:
    """Check for unbalanced brackets in the expression."""
    brackets = {"(": ")", "[": "]", "{": "}"}
    closing = {v: k for k, v in brackets.items()}
    stack: List[Tuple[str, int]] = []

    in_string = False
    string_char = None

    for i, char in enumerate(expression):
        # Track string state
        if char in ('"', "'") and (i == 0 or expression[i - 1] != "\\"):
            if not in_string:
                in_string = True
                string_char = char
            elif char == string_char:
                in_string = False
                string_char = None
            continue

        if in_string:
            continue

        if char in brackets:
            stack.append((char, i))
        elif char in closing:
            if not stack:
                return ExpressionError(
                    expression=expression,
                    message=f"Unmatched closing '{char}'",
                    position=i + 1,
                )
            if stack[-1][0] != closing[char]:
                expected = brackets[stack[-1][0]]
                return ExpressionError(
                    expression=expression,
                    message=f"Mismatched brackets: expected '{expected}' but found '{char}'",
                    position=i + 1,
                )
            stack.pop()

    if stack:
        unclosed = stack[-1]
        expected = brackets[unclosed[0]]
        return ExpressionError(
            expression=expression,
            message=f"Unclosed '{unclosed[0]}' - missing '{expected}'",
            position=unclosed[1] + 1,
        )

    # Check for unclosed string
    if in_string:
        return ExpressionError(
            expression=expression,
            message=f"Unclosed string (missing {string_char})",
        )

    return None


def _suggest_expression_fix(expression: str, error_msg: str) -> Optional[str]:
    """Try to suggest a fix for common expression errors."""
    # Common typos and fixes
    if "=" in expression and "==" not in expression:
        # User might have meant == instead of =
        fixed = expression.replace("=", "==", 1)
        try:
            ast.parse(fixed, mode="eval")
            return fixed
        except SyntaxError:
            pass

    # Check for common keyword mistakes
    lower_expr = expression.lower()
    if " and " not in lower_expr and " && " in expression:
        return expression.replace("&&", "and")
    if " or " not in lower_expr and " || " in expression:
        return expression.replace("||", "or")
    if " not " not in lower_expr and expression.startswith("!"):
        return "not " + expression[1:]

    return None


def validate_dynamic_attribute(
    attr_name: str, attr_value: str
) -> Tuple[bool, Optional[ExpressionError]]:
    """
    Validate a dynamic attribute binding.

    Dynamic attributes start with ':' and contain expressions:
      :variant="item.variant"
      :disabled="is_loading"

    Args:
        attr_name: The attribute name (with or without ':' prefix)
        attr_value: The expression value

    Returns:
        A tuple of (is_valid, error_or_none)
    """
    # Strip the colon prefix if present
    clean_name = attr_name.lstrip(":")

    is_valid, error = validate_expression(attr_value)

    if error:
        error.expression = f":{clean_name}=\"{attr_value}\""

    return is_valid, error
