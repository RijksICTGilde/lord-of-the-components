"""End-to-end tests for the em component.

Tests the full pipeline: <c-em .../> -> preprocessor -> Jinja2 template -> HTML output.
"""

import re


def normalize_whitespace(html: str) -> str:
    """Collapse all whitespace sequences to single spaces, strip outer whitespace."""
    return re.sub(r"\s+", " ", html).strip()


class TestEmBasic:
    """Test basic em rendering."""

    def test_renders_span_element(self, render):
        html = render('<c-em label="Italic text"/>')
        norm = normalize_whitespace(html)
        assert "<span" in norm
        assert "</span>" in norm

    def test_base_class(self, render):
        html = render('<c-em label="Italic"/>')
        assert "rvo-text--italic" in html

    def test_name_prop_renders_text(self, render):
        html = render('<c-em label="Emphasized"/>')
        assert "Emphasized" in html

    def test_data_lotc_component_attribute(self, render):
        html = render('<c-em label="Test"/>')
        assert 'data-lotc-component="em"' in html

    def test_content_between_tags_overrides_name(self, render):
        html = render('<c-em label="Fallback">Custom italic</c-em>')
        assert "Custom italic" in html

    def test_content_with_html(self, render):
        html = render("<c-em>Italic with <strong>bold</strong></c-em>")
        assert "<strong>bold</strong>" in html


class TestEmAttributes:
    """Test HTML attribute rendering."""

    def test_data_attribute_passthrough(self, render):
        html = render('<c-em data-testid="em-1" label="Italic"/>')
        assert 'data-testid="em-1"' in html


class TestEmCustomClass:
    """Test custom class attribute."""

    def test_custom_class_appended(self, render):
        html = render('<c-em class="my-em" label="Italic"/>')
        assert "my-em" in html
        assert "rvo-text--italic" in html


class TestEmUtilityClasses:
    """Test utility class support."""

    def test_margin_utility(self, render):
        html = render('<c-em margin="sm" label="Italic"/>')
        assert "rvo-margin--sm" in html
