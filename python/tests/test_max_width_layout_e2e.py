"""End-to-end tests for the max-width-layout component.

Tests the full pipeline: <c-max-width-layout .../> -> preprocessor -> Jinja2 template -> HTML output.
"""

import re


def normalize_whitespace(html: str) -> str:
    """Collapse all whitespace sequences to single spaces, strip outer whitespace."""
    return re.sub(r"\s+", " ", html).strip()


class TestMaxWidthLayoutBasic:
    """Test basic max-width-layout rendering."""

    def test_renders_div_element(self, render):
        html = render('<c-max-width-layout>Content</c-max-width-layout>')
        norm = normalize_whitespace(html)
        assert "<div" in norm
        assert "</div>" in norm

    def test_data_lotc_component_attribute(self, render):
        html = render('<c-max-width-layout>Content</c-max-width-layout>')
        assert 'data-lotc-component="max-width-layout"' in html

    def test_base_class(self, render):
        html = render('<c-max-width-layout>Content</c-max-width-layout>')
        assert "rvo-max-width-layout" in html

    def test_children_passed_through(self, render):
        html = render('<c-max-width-layout>Hello world</c-max-width-layout>')
        assert "Hello world" in html


class TestMaxWidthLayoutSize:
    """Test size variants."""

    def test_default_size_md(self, render):
        html = render('<c-max-width-layout>Content</c-max-width-layout>')
        assert "rvo-max-width-layout--md" in html

    def test_size_sm(self, render):
        html = render('<c-max-width-layout size="sm">Content</c-max-width-layout>')
        assert "rvo-max-width-layout--sm" in html
        assert "rvo-max-width-layout--md" not in html

    def test_size_md(self, render):
        html = render('<c-max-width-layout size="md">Content</c-max-width-layout>')
        assert "rvo-max-width-layout--md" in html

    def test_size_lg(self, render):
        html = render('<c-max-width-layout size="lg">Content</c-max-width-layout>')
        assert "rvo-max-width-layout--lg" in html
        assert "rvo-max-width-layout--md" not in html


class TestMaxWidthLayoutInlinePadding:
    """Test inline padding variants."""

    def test_default_inline_padding_none(self, render):
        html = render('<c-max-width-layout>Content</c-max-width-layout>')
        assert "rvo-max-width-layout-inline-padding--none" in html

    def test_inline_padding_none(self, render):
        html = render('<c-max-width-layout inline-padding="none">Content</c-max-width-layout>')
        assert "rvo-max-width-layout-inline-padding--none" in html

    def test_inline_padding_sm(self, render):
        html = render('<c-max-width-layout inline-padding="sm">Content</c-max-width-layout>')
        assert "rvo-max-width-layout-inline-padding--sm" in html

    def test_inline_padding_md(self, render):
        html = render('<c-max-width-layout inline-padding="md">Content</c-max-width-layout>')
        assert "rvo-max-width-layout-inline-padding--md" in html

    def test_inline_padding_lg(self, render):
        html = render('<c-max-width-layout inline-padding="lg">Content</c-max-width-layout>')
        assert "rvo-max-width-layout-inline-padding--lg" in html

    def test_inline_padding_sm_excludes_others(self, render):
        html = render('<c-max-width-layout inline-padding="sm">Content</c-max-width-layout>')
        assert "rvo-max-width-layout-inline-padding--sm" in html
        assert "rvo-max-width-layout-inline-padding--none" not in html
        assert "rvo-max-width-layout-inline-padding--md" not in html


class TestMaxWidthLayoutCentered:
    """Test centered/uncentered behavior."""

    def test_centered_by_default(self, render):
        html = render('<c-max-width-layout>Content</c-max-width-layout>')
        assert "rvo-max-width-layout--uncentered" not in html

    def test_uncentered_adds_class(self, render):
        html = render('<c-max-width-layout uncentered>Content</c-max-width-layout>')
        assert "rvo-max-width-layout--uncentered" in html


class TestMaxWidthLayoutCombined:
    """Test combining multiple props."""

    def test_size_and_inline_padding(self, render):
        html = render('<c-max-width-layout size="lg" inline-padding="md">Content</c-max-width-layout>')
        assert "rvo-max-width-layout--lg" in html
        assert "rvo-max-width-layout-inline-padding--md" in html

    def test_all_props(self, render):
        html = render('<c-max-width-layout size="sm" inline-padding="lg" uncentered>Content</c-max-width-layout>')
        assert "rvo-max-width-layout--sm" in html
        assert "rvo-max-width-layout-inline-padding--lg" in html
        assert "rvo-max-width-layout--uncentered" in html


class TestMaxWidthLayoutNesting:
    """Test max-width-layout with nested components."""

    def test_with_nested_button(self, render):
        html = render(
            '<c-max-width-layout size="md">'
            '<c-button name="Click me"/>'
            '</c-max-width-layout>'
        )
        assert "rvo-max-width-layout" in html
        assert "utrecht-button" in html
        assert "Click me" in html

    def test_with_nested_layout_row(self, render):
        html = render(
            '<c-max-width-layout size="lg">'
            '<c-layout-row gap="md">'
            '<c-layout-column size="md-6">Left</c-layout-column>'
            '<c-layout-column size="md-6">Right</c-layout-column>'
            '</c-layout-row>'
            '</c-max-width-layout>'
        )
        norm = normalize_whitespace(html)
        assert "rvo-max-width-layout--lg" in norm
        assert "rvo-layout-row" in norm
        assert "rvo-layout-column--md-6" in norm


class TestMaxWidthLayoutGenericAttributes:
    """Test generic attribute passthrough."""

    def test_data_attribute(self, render):
        html = render('<c-max-width-layout data-testid="container">Content</c-max-width-layout>')
        assert 'data-testid="container"' in html

    def test_aria_attribute(self, render):
        html = render('<c-max-width-layout aria-label="Main">Content</c-max-width-layout>')
        assert 'aria-label="Main"' in html


class TestMaxWidthLayoutCustomClass:
    """Test custom class attribute."""

    def test_custom_class_appended(self, render):
        html = render('<c-max-width-layout class="my-container">Content</c-max-width-layout>')
        assert "my-container" in html
        assert "rvo-max-width-layout" in html


class TestMaxWidthLayoutUtilityClasses:
    """Test utility class support."""

    def test_margin_utility(self, render):
        html = render('<c-max-width-layout margin="lg">Content</c-max-width-layout>')
        assert "rvo-margin--lg" in html

    def test_padding_utility(self, render):
        html = render('<c-max-width-layout padding="md">Content</c-max-width-layout>')
        assert "rvo-padding--md" in html
