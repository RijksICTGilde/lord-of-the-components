"""End-to-end tests for the strong component.

Tests the full pipeline: <c-strong .../> -> preprocessor -> Jinja2 template -> HTML output.
"""

import re


def normalize_whitespace(html: str) -> str:
    """Collapse all whitespace sequences to single spaces, strip outer whitespace."""
    return re.sub(r"\s+", " ", html).strip()


class TestStrongBasic:
    """Test basic strong rendering."""

    def test_renders_span_element(self, render):
        html = render('<c-strong name="Bold text"/>')
        norm = normalize_whitespace(html)
        assert "<span" in norm
        assert "</span>" in norm

    def test_base_class(self, render):
        html = render('<c-strong name="Bold"/>')
        assert "rvo-text--bold" in html

    def test_name_prop_renders_text(self, render):
        html = render('<c-strong name="Important"/>')
        assert "Important" in html

    def test_data_lotc_component_attribute(self, render):
        html = render('<c-strong name="Test"/>')
        assert 'data-lotc-component="strong"' in html

    def test_content_between_tags_overrides_name(self, render):
        html = render("<c-strong name=\"Fallback\">Custom bold</c-strong>")
        assert "Custom bold" in html

    def test_content_with_html(self, render):
        html = render("<c-strong>Bold with <em>italic</em></c-strong>")
        assert "<em>italic</em>" in html


class TestStrongAttributes:
    """Test HTML attribute rendering."""

    def test_data_attribute_passthrough(self, render):
        html = render('<c-strong data-testid="strong-1" name="Bold"/>')
        assert 'data-testid="strong-1"' in html


class TestStrongCustomClass:
    """Test custom class attribute."""

    def test_custom_class_appended(self, render):
        html = render('<c-strong class="my-strong" name="Bold"/>')
        assert "my-strong" in html
        assert "rvo-text--bold" in html


class TestStrongUtilityClasses:
    """Test utility class support."""

    def test_margin_utility(self, render):
        html = render('<c-strong margin="sm" name="Bold"/>')
        assert "rvo-margin--sm" in html
