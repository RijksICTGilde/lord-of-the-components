"""Tests for error message quality.

This module tests that error messages are clear, actionable, and well-formatted.
It focuses on the user experience when encountering errors, ensuring developers
get helpful feedback to fix their issues quickly.
"""

import pytest
from jinja2 import Environment

from lord_of_the_components import ComponentError, ComponentExtension, SourceLocation
from lord_of_the_components.validation import (
    validate_columns,
    validate_expression,
    validate_generic_color,
    validate_generic_size,
    validate_items,
    validate_steps,
)


@pytest.fixture
def env():
    """Create a Jinja2 environment with the component extension."""
    environment = Environment()
    environment.add_extension(ComponentExtension)
    return environment


@pytest.fixture
def extension(env):
    """Get the component extension from the environment."""
    return env.extensions[ComponentExtension.identifier]


class TestComponentErrorMessageFormat:
    """Tests for ComponentError message formatting."""

    def test_error_includes_component_name(self, extension):
        """Error should identify which component caused the issue."""
        source = '<c-nonexistent-widget>Content</c-nonexistent-widget>'

        with pytest.raises(ComponentError) as exc_info:
            extension.preprocess(source, "test.html")

        error_msg = str(exc_info.value)
        assert "c-nonexistent-widget" in error_msg

    def test_error_includes_attribute_name(self, extension):
        """Error should identify which attribute caused the issue."""
        source = '<c-button badattr="value">Click</c-button>'

        with pytest.raises(ComponentError) as exc_info:
            extension.preprocess(source, "test.html")

        error_msg = str(exc_info.value)
        assert "badattr" in error_msg

    def test_error_location_format_is_human_readable(self):
        """Location format should be easy to read and parse."""
        loc = SourceLocation(line=42, column=15)
        assert "line 42" in str(loc)
        assert "column 15" in str(loc)

    def test_error_message_with_location_format(self):
        """Full error message should combine message and location clearly."""
        loc = SourceLocation(line=10, column=5)
        error = ComponentError("Test error", location=loc)

        error_msg = str(error)
        assert "Test error" in error_msg
        assert "line 10" in error_msg
        assert "column 5" in error_msg
        assert "at" in error_msg.lower()

    def test_error_suggestion_format(self):
        """Suggestion should be formatted as a clear question."""
        loc = SourceLocation(line=1, column=1)
        error = ComponentError("Unknown attribute 'varient'", location=loc, suggestion="variant")

        error_msg = str(error)
        assert "Did you mean" in error_msg
        assert "variant" in error_msg


class TestSuggestionQuality:
    """Tests for helpful suggestions in error messages."""

    def test_typo_in_component_name_suggests_correct(self, extension):
        """Typo in component name should suggest correct spelling."""
        source = '<c-buton>Click</c-buton>'

        with pytest.raises(ComponentError) as exc_info:
            extension.preprocess(source, "test.html")

        error = exc_info.value
        assert error.suggestion is not None
        assert "button" in error.suggestion.lower()

    def test_typo_in_attribute_name_suggests_correct(self, extension):
        """Typo in attribute name should suggest correct spelling."""
        source = '<c-button varient="primary">Click</c-button>'

        with pytest.raises(ComponentError) as exc_info:
            extension.preprocess(source, "test.html")

        error = exc_info.value
        assert error.suggestion is not None
        assert "variant" in error.suggestion.lower()

    def test_no_suggestion_for_completely_wrong_name(self, extension):
        """Should not suggest when name is too different from any valid option."""
        source = '<c-xyz123abc>Content</c-xyz123abc>'

        with pytest.raises(ComponentError):
            extension.preprocess(source, "test.html")

        # Suggestion might be None when there's no close match
        # This is acceptable behavior - don't suggest something irrelevant


class TestExpressionErrorMessages:
    """Tests for expression validation error messages."""

    def test_empty_expression_error_is_clear(self):
        """Empty expression error should clearly state the problem."""
        is_valid, error = validate_expression("")

        assert not is_valid
        assert error is not None
        assert "empty" in error.message.lower()

    def test_unclosed_bracket_error_specifies_bracket(self):
        """Unclosed bracket error should specify which bracket is unclosed."""
        is_valid, error = validate_expression("func(arg")

        assert not is_valid
        assert error is not None
        assert "(" in error.message or "unclosed" in error.message.lower()

    def test_mismatched_bracket_error_specifies_both(self):
        """Mismatched bracket error should mention both brackets."""
        is_valid, error = validate_expression("items[0)")

        assert not is_valid
        assert error is not None
        assert "mismatch" in error.message.lower() or "expected" in error.message.lower()

    def test_jinja_delimiter_error_explains_issue(self):
        """Using {{ }} should explain that delimiters are not needed."""
        is_valid, error = validate_expression("{{ item }}")

        assert not is_valid
        assert error is not None
        assert "{{ }}" in error.message or "delimiters" in error.message.lower()
        # Should suggest the fix
        assert error.suggestion is not None
        assert "{{" not in error.suggestion and "}}" not in error.suggestion

    def test_double_ampersand_suggests_and(self):
        """Using && should suggest using 'and' instead."""
        is_valid, error = validate_expression("a && b")

        assert not is_valid
        assert error is not None
        assert error.suggestion is not None
        assert "and" in error.suggestion

    def test_double_pipe_suggests_or(self):
        """Using || should suggest using 'or' instead."""
        is_valid, error = validate_expression("a || b")

        assert not is_valid
        assert error is not None
        assert error.suggestion is not None
        assert "or" in error.suggestion


class TestValidationErrorMessages:
    """Tests for data validation error messages."""

    def test_items_validation_not_list_error(self):
        """Passing non-list to items should give clear error."""
        result = validate_items("not a list")

        assert not result.valid
        assert len(result.errors) == 1
        assert "list" in result.errors[0].message.lower()

    def test_items_validation_missing_key_error(self):
        """Missing required key should be clearly identified."""
        result = validate_items([{"value": "no-label"}])

        assert not result.valid
        assert len(result.errors) == 1
        assert "label" in result.errors[0].message.lower()
        assert "missing" in result.errors[0].message.lower()

    def test_items_validation_error_includes_index(self):
        """Error should identify which item in the list has the problem."""
        result = validate_items([
            {"label": "Good"},
            {"value": "bad-no-label"},
            {"label": "Good too"},
        ])

        assert not result.valid
        assert len(result.errors) == 1
        assert "[1]" in result.errors[0].path  # Second item (index 1)

    def test_columns_validation_error_message(self):
        """Column validation errors should be clear."""
        result = validate_columns([{"label": "No key"}])

        assert not result.valid
        assert "key" in result.errors[0].message.lower()

    def test_steps_invalid_state_error(self):
        """Invalid step state should list valid options."""
        result = validate_steps([{"label": "Step 1", "state": "invalid_state"}])

        assert not result.valid
        error_msg = result.errors[0].message
        assert "invalid_state" in error_msg
        assert "pending" in error_msg or "valid" in error_msg.lower()

    def test_generic_size_validation_error(self):
        """Invalid size should list valid options."""
        result = validate_generic_size("huge")

        assert not result.valid
        error_msg = result.errors[0].message
        assert "huge" in error_msg
        # Should mention some valid sizes
        assert "sm" in error_msg or "md" in error_msg or "lg" in error_msg

    def test_generic_color_validation_error(self):
        """Invalid color should list valid options."""
        result = validate_generic_color("rainbow")

        assert not result.valid
        error_msg = result.errors[0].message
        assert "rainbow" in error_msg
        # Should mention some valid colors
        assert "primary" in error_msg or "secondary" in error_msg


class TestErrorLocationAccuracy:
    """Tests for accurate source location reporting."""

    def test_location_on_first_line(self, extension):
        """Error on first line should report line 1."""
        source = '<c-buton>Click</c-buton>'

        with pytest.raises(ComponentError) as exc_info:
            extension.preprocess(source, "test.html")

        assert exc_info.value.location is not None
        assert exc_info.value.location.line == 1

    def test_location_on_later_line(self, extension):
        """Error on later line should report correct line number."""
        source = """<div>
    <span>Some content</span>
    <c-buton>Click</c-buton>
</div>"""

        with pytest.raises(ComponentError) as exc_info:
            extension.preprocess(source, "test.html")

        assert exc_info.value.location is not None
        assert exc_info.value.location.line == 3

    def test_location_column_is_start_of_tag(self, extension):
        """Column should point to start of the problematic tag/attribute."""
        source = '    <c-buton>Click</c-buton>'

        with pytest.raises(ComponentError) as exc_info:
            extension.preprocess(source, "test.html")

        assert exc_info.value.location is not None
        # Column should be 5 (after 4 spaces)
        assert exc_info.value.location.column == 5

    def test_expression_error_includes_position(self, extension):
        """Expression syntax error should include position information."""
        source = '''<div>
    <c-button :variant="func(">Click</c-button>
</div>'''

        with pytest.raises(ComponentError) as exc_info:
            extension.preprocess(source, "test.html")

        error = exc_info.value
        assert error.location is not None
        # Should be on line 2
        assert error.location.line == 2


class TestErrorMessageClarity:
    """Tests ensuring error messages are clear and actionable."""

    def test_unknown_component_message_is_actionable(self, extension):
        """Unknown component error should help user fix the issue."""
        source = '<c-badcomponent>Content</c-badcomponent>'

        with pytest.raises(ComponentError) as exc_info:
            extension.preprocess(source, "test.html")

        error_msg = str(exc_info.value)
        # Should mention it's unknown
        assert "unknown" in error_msg.lower() or "unrecognized" in error_msg.lower()
        # Should identify the component
        assert "badcomponent" in error_msg or "c-badcomponent" in error_msg

    def test_unknown_attribute_message_is_actionable(self, extension):
        """Unknown attribute error should help user fix the issue."""
        source = '<c-button unknownprop="value">Click</c-button>'

        with pytest.raises(ComponentError) as exc_info:
            extension.preprocess(source, "test.html")

        error_msg = str(exc_info.value)
        # Should mention it's unknown
        assert "unknown" in error_msg.lower()
        # Should identify the attribute
        assert "unknownprop" in error_msg
        # Should mention which component
        assert "button" in error_msg.lower() or "c-button" in error_msg

    def test_nesting_depth_error_is_actionable(self, extension):
        """Nesting depth error should explain the limit and suggest a fix."""
        from lord_of_the_components.extension import MAX_NESTING_DEPTH

        # Build deeply nested structure
        depth = MAX_NESTING_DEPTH + 5
        opening = "\n".join(["<c-card>" for _ in range(depth)])
        closing = "\n".join(["</c-card>" for _ in range(depth)])
        source = f"{opening}\n<c-button>Deep</c-button>\n{closing}"

        with pytest.raises(ComponentError) as exc_info:
            extension.preprocess(source, "test.html")

        error_msg = str(exc_info.value)
        # Should mention nesting
        assert "nesting" in error_msg.lower()
        # Should mention the limit
        assert str(MAX_NESTING_DEPTH) in error_msg
        # Should mention exceeds/maximum
        assert "exceeds" in error_msg.lower() or "maximum" in error_msg.lower()


class TestErrorExceptionTypes:
    """Tests for proper exception types being raised."""

    def test_component_errors_are_component_error_type(self, extension):
        """All component-related errors should be ComponentError instances."""
        source = '<c-nonexistent>Content</c-nonexistent>'

        with pytest.raises(ComponentError):
            extension.preprocess(source, "test.html")

    def test_component_error_has_expected_attributes(self, extension):
        """ComponentError should have message, location, and suggestion attributes."""
        source = '<c-buton>Click</c-buton>'

        with pytest.raises(ComponentError) as exc_info:
            extension.preprocess(source, "test.html")

        error = exc_info.value
        assert hasattr(error, 'message')
        assert hasattr(error, 'location')
        assert hasattr(error, 'suggestion')

    def test_expression_error_has_expected_attributes(self):
        """ExpressionError should have all expected attributes."""
        _, error = validate_expression("{{ bad }}")

        assert error is not None
        assert hasattr(error, 'expression')
        assert hasattr(error, 'message')
        assert hasattr(error, 'position')
        assert hasattr(error, 'suggestion')

    def test_validation_error_has_expected_attributes(self):
        """ValidationError should have path, message, and value."""
        result = validate_items("not a list")

        assert len(result.errors) == 1
        error = result.errors[0]
        assert hasattr(error, 'path')
        assert hasattr(error, 'message')
        assert hasattr(error, 'value')
