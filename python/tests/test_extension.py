"""Tests for the ComponentExtension with source location tracking."""

import pytest
from jinja2 import Environment

from lord_of_the_components import ComponentError, ComponentExtension, SourceLocation


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


class TestSourceLocation:
    """Tests for SourceLocation dataclass."""

    def test_str_representation(self):
        loc = SourceLocation(line=42, column=5)
        assert str(loc) == "line 42, column 5"

    def test_equality(self):
        loc1 = SourceLocation(line=10, column=20)
        loc2 = SourceLocation(line=10, column=20)
        assert loc1 == loc2


class TestComponentError:
    """Tests for ComponentError exception."""

    def test_basic_message(self):
        error = ComponentError("Something went wrong")
        assert str(error) == "Something went wrong"

    def test_message_with_location(self):
        loc = SourceLocation(line=42, column=5)
        error = ComponentError("Unknown attribute 'varient'", location=loc)
        assert str(error) == "Unknown attribute 'varient' at line 42, column 5"

    def test_message_with_suggestion(self):
        loc = SourceLocation(line=42, column=5)
        error = ComponentError(
            "Unknown attribute 'varient'",
            location=loc,
            suggestion="variant"
        )
        assert str(error) == "Unknown attribute 'varient' at line 42, column 5. Did you mean 'variant'?"

    def test_message_with_suggestion_no_location(self):
        error = ComponentError(
            "Unknown attribute 'varient'",
            suggestion="variant"
        )
        assert str(error) == "Unknown attribute 'varient'. Did you mean 'variant'?"


class TestUnknownComponentError:
    """Tests for errors when using unknown components."""

    def test_unknown_component_has_location(self, extension):
        source = """<div>
    <c-unknown-widget variant="primary">
        Hello
    </c-unknown-widget>
</div>"""

        with pytest.raises(ComponentError) as exc_info:
            extension.preprocess(source, "test.html")

        error = exc_info.value
        assert "Unknown component 'c-unknown-widget'" in str(error)
        assert error.location is not None
        assert error.location.line == 2
        assert error.location.column == 5

    def test_unknown_component_with_suggestion(self, extension):
        source = "<c-buton>Click</c-buton>"

        with pytest.raises(ComponentError) as exc_info:
            extension.preprocess(source, "test.html")

        error = exc_info.value
        assert "c-button" in str(error)  # Should suggest c-button


class TestUnknownAttributeError:
    """Tests for errors when using unknown attributes."""

    def test_unknown_attribute_has_location(self, extension):
        source = """<div>
    <c-button varient="primary">Click</c-button>
</div>"""

        with pytest.raises(ComponentError) as exc_info:
            extension.preprocess(source, "test.html")

        error = exc_info.value
        assert "Unknown attribute 'varient'" in str(error)
        assert error.location is not None
        assert error.location.line == 2
        # Column should point to the attribute, not the tag

    def test_unknown_attribute_with_suggestion(self, extension):
        source = '<c-button varient="primary">Click</c-button>'

        with pytest.raises(ComponentError) as exc_info:
            extension.preprocess(source, "test.html")

        error = exc_info.value
        assert "variant" in str(error)  # Should suggest variant

    def test_unknown_attribute_iconposition_suggests_camelcase(self, extension):
        source = '<c-button iconposition="before">Click</c-button>'

        # This should work because we normalize to lowercase
        result = extension.preprocess(source, "test.html")
        assert "components/button.html.j2" in result


class TestMultipleComponents:
    """Tests for tracking locations with multiple components."""

    def test_multiple_same_components_tracks_correct_occurrence(self, extension):
        source = """<c-button variant="primary">First</c-button>
<c-button varient="secondary">Second</c-button>"""

        with pytest.raises(ComponentError) as exc_info:
            extension.preprocess(source, "test.html")

        error = exc_info.value
        # The error should be on line 2 (the second button with the typo)
        assert error.location is not None
        assert error.location.line == 2


class TestExpressionValidation:
    """Tests for expression validation in dynamic attributes."""

    def test_valid_simple_expression(self, extension):
        """Test that valid expressions are accepted."""
        source = '<c-button :variant="item.variant">Click</c-button>'
        result = extension.preprocess(source, "test.html")
        assert "components/button.html.j2" in result
        assert "item.variant" in result

    def test_valid_boolean_expression(self, extension):
        """Test that boolean expressions are accepted."""
        source = '<c-button :disabled="is_loading or not is_valid">Click</c-button>'
        result = extension.preprocess(source, "test.html")
        assert "components/button.html.j2" in result

    def test_valid_function_call(self, extension):
        """Test that function calls in expressions are accepted."""
        source = '<c-button :variant="get_variant()">Click</c-button>'
        result = extension.preprocess(source, "test.html")
        assert "components/button.html.j2" in result

    def test_valid_list_expression(self, extension):
        """Test that list expressions are accepted."""
        source = '<c-button :class="[\'btn\', \'btn-primary\']">Click</c-button>'
        result = extension.preprocess(source, "test.html")
        assert "components/button.html.j2" in result

    def test_valid_dict_expression(self, extension):
        """Test that dict expressions are accepted."""
        source = '<c-button :style="{\'color\': \'red\'}">Click</c-button>'
        result = extension.preprocess(source, "test.html")
        assert "components/button.html.j2" in result

    def test_invalid_empty_expression(self, extension):
        """Test that empty expressions are rejected."""
        source = '<c-button :variant="">Click</c-button>'
        with pytest.raises(ComponentError) as exc_info:
            extension.preprocess(source, "test.html")
        assert "Empty expression" in str(exc_info.value)

    def test_invalid_unclosed_bracket(self, extension):
        """Test that unclosed brackets are detected."""
        source = '<c-button :variant="get_variant(">Click</c-button>'
        with pytest.raises(ComponentError) as exc_info:
            extension.preprocess(source, "test.html")
        assert "Unclosed" in str(exc_info.value) or "missing" in str(exc_info.value).lower()

    def test_invalid_mismatched_brackets(self, extension):
        """Test that mismatched brackets are detected."""
        source = '<c-button :variant="items[0)">Click</c-button>'
        with pytest.raises(ComponentError) as exc_info:
            extension.preprocess(source, "test.html")
        assert "Mismatched" in str(exc_info.value) or "bracket" in str(exc_info.value).lower()

    def test_invalid_jinja_delimiters(self, extension):
        """Test that {{ }} delimiters in expressions are rejected."""
        source = '<c-button :variant="{{ item.variant }}">Click</c-button>'
        with pytest.raises(ComponentError) as exc_info:
            extension.preprocess(source, "test.html")
        assert "should not contain {{ }}" in str(exc_info.value)

    def test_invalid_syntax_error_with_location(self, extension):
        """Test that syntax errors include location information."""
        source = '''<div>
    <c-button :variant="item..variant">Click</c-button>
</div>'''
        with pytest.raises(ComponentError) as exc_info:
            extension.preprocess(source, "test.html")
        error = exc_info.value
        assert error.location is not None
        assert error.location.line == 2

    def test_suggests_and_for_double_ampersand(self, extension):
        """Test that && is suggested to be replaced with 'and'."""
        source = '<c-button :disabled="a && b">Click</c-button>'
        with pytest.raises(ComponentError) as exc_info:
            extension.preprocess(source, "test.html")
        # Should suggest using 'and' instead of '&&'
        assert "and" in str(exc_info.value).lower() or exc_info.value.suggestion == "a and b"

    def test_suggests_or_for_double_pipe(self, extension):
        """Test that || is suggested to be replaced with 'or'."""
        source = '<c-button :disabled="a || b">Click</c-button>'
        with pytest.raises(ComponentError) as exc_info:
            extension.preprocess(source, "test.html")
        # Should suggest using 'or' instead of '||'
        assert "or" in str(exc_info.value).lower() or exc_info.value.suggestion == "a or b"


class TestSuccessfulPreprocessing:
    """Tests that valid templates still work correctly."""

    def test_valid_button(self, extension):
        source = '<c-button variant="primary">Click me</c-button>'
        result = extension.preprocess(source, "test.html")
        assert "components/button.html.j2" in result
        assert '"variant": "primary"' in result

    def test_valid_nested_components(self, extension):
        source = """<c-stack direction="vertical">
    <c-button variant="primary">First</c-button>
    <c-button variant="secondary">Second</c-button>
</c-stack>"""
        result = extension.preprocess(source, "test.html")
        assert "components/stack.html.j2" in result
        assert result.count("components/button.html.j2") == 2
