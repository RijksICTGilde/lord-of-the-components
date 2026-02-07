"""End-to-end tests for the heading component.

Tests the full pipeline: <c-heading .../> -> preprocessor -> Jinja2 template -> HTML output.
"""

import re


def normalize_whitespace(html: str) -> str:
    """Collapse all whitespace sequences to single spaces, strip outer whitespace."""
    return re.sub(r"\s+", " ", html).strip()


class TestHeadingLevels:
    """Test all heading levels (h1-h6) render correct HTML tags and CSS classes."""

    def test_h1(self, render):
        html = render('<c-heading type="h1" name="Title"/>')
        norm = normalize_whitespace(html)
        assert "<h1" in norm
        assert "</h1>" in norm
        assert "utrecht-heading-1" in norm
        assert "Title" in norm

    def test_h2(self, render):
        html = render('<c-heading type="h2" name="Subtitle"/>')
        norm = normalize_whitespace(html)
        assert "<h2" in norm
        assert "</h2>" in norm
        assert "utrecht-heading-2" in norm

    def test_h3(self, render):
        html = render('<c-heading type="h3" name="Section"/>')
        norm = normalize_whitespace(html)
        assert "<h3" in norm
        assert "</h3>" in norm
        assert "utrecht-heading-3" in norm

    def test_h4(self, render):
        html = render('<c-heading type="h4" name="Subsection"/>')
        norm = normalize_whitespace(html)
        assert "<h4" in norm
        assert "</h4>" in norm
        assert "utrecht-heading-4" in norm

    def test_h5(self, render):
        html = render('<c-heading type="h5" name="Minor"/>')
        norm = normalize_whitespace(html)
        assert "<h5" in norm
        assert "</h5>" in norm
        assert "utrecht-heading-5" in norm

    def test_h6(self, render):
        html = render('<c-heading type="h6" name="Smallest"/>')
        norm = normalize_whitespace(html)
        assert "<h6" in norm
        assert "</h6>" in norm
        assert "utrecht-heading-6" in norm

    def test_default_type_is_h1(self, render):
        html = render('<c-heading name="Default"/>')
        norm = normalize_whitespace(html)
        assert "<h1" in norm
        assert "</h1>" in norm
        assert "utrecht-heading-1" in norm


class TestHeadingContent:
    """Test content handling (name prop vs content between tags)."""

    def test_name_prop_renders_as_text(self, render):
        html = render('<c-heading name="Page Title"/>')
        assert "Page Title" in html

    def test_content_between_tags_overrides_name(self, render):
        html = render('<c-heading name="Fallback">Custom Title</c-heading>')
        assert "Custom Title" in html

    def test_content_with_html(self, render):
        html = render('<c-heading type="h2"><em>Emphasized</em> heading</c-heading>')
        assert "<em>Emphasized</em>" in html


class TestHeadingAttributes:
    """Test HTML attribute rendering."""

    def test_data_lotc_component_attribute(self, render):
        html = render('<c-heading name="Test"/>')
        assert 'data-lotc-component="heading"' in html

    def test_data_attribute_passthrough(self, render):
        html = render('<c-heading data-testid="heading-1" name="Test"/>')
        assert 'data-testid="heading-1"' in html

    def test_aria_attribute_passthrough(self, render):
        html = render('<c-heading aria-label="Main heading" name="Test"/>')
        assert 'aria-label="Main heading"' in html


class TestHeadingCustomClass:
    """Test custom class attribute."""

    def test_custom_class_appended(self, render):
        html = render('<c-heading class="my-heading" name="Test"/>')
        assert "my-heading" in html
        assert "utrecht-heading-1" in html


class TestHeadingNoExtraClasses:
    """Test that only the correct heading level class is applied."""

    def test_h2_does_not_have_h1_class(self, render):
        html = render('<c-heading type="h2" name="Test"/>')
        assert "utrecht-heading-2" in html
        assert "utrecht-heading-1" not in html
