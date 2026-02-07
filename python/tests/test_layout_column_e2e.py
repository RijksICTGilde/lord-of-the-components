"""End-to-end tests for the layout-column component.

Tests the full pipeline: <c-layout-column .../> -> preprocessor -> Jinja2 template -> HTML output.
"""

import re


def normalize_whitespace(html: str) -> str:
    """Collapse all whitespace sequences to single spaces, strip outer whitespace."""
    return re.sub(r"\s+", " ", html).strip()


class TestLayoutColumnBasic:
    """Test basic layout-column rendering."""

    def test_renders_div_element(self, render):
        html = render('<c-layout-column>Content</c-layout-column>')
        norm = normalize_whitespace(html)
        assert "<div" in norm
        assert "</div>" in norm

    def test_data_lotc_component_attribute(self, render):
        html = render('<c-layout-column>Content</c-layout-column>')
        assert 'data-lotc-component="layout-column"' in html

    def test_base_class(self, render):
        html = render('<c-layout-column>Content</c-layout-column>')
        assert "rvo-layout-column" in html

    def test_children_passed_through(self, render):
        html = render('<c-layout-column>Hello world</c-layout-column>')
        assert "Hello world" in html

    def test_no_size_class_without_size_prop(self, render):
        html = render('<c-layout-column>Content</c-layout-column>')
        assert "rvo-layout-column--" not in html


class TestLayoutColumnXsSizes:
    """Test extra-small breakpoint column sizes."""

    def test_xs_1(self, render):
        html = render('<c-layout-column size="xs-1">Content</c-layout-column>')
        assert "rvo-layout-column--xs-1" in html

    def test_xs_6(self, render):
        html = render('<c-layout-column size="xs-6">Content</c-layout-column>')
        assert "rvo-layout-column--xs-6" in html

    def test_xs_12(self, render):
        html = render('<c-layout-column size="xs-12">Content</c-layout-column>')
        assert "rvo-layout-column--xs-12" in html


class TestLayoutColumnSmSizes:
    """Test small breakpoint column sizes."""

    def test_sm_3(self, render):
        html = render('<c-layout-column size="sm-3">Content</c-layout-column>')
        assert "rvo-layout-column--sm-3" in html

    def test_sm_6(self, render):
        html = render('<c-layout-column size="sm-6">Content</c-layout-column>')
        assert "rvo-layout-column--sm-6" in html

    def test_sm_12(self, render):
        html = render('<c-layout-column size="sm-12">Content</c-layout-column>')
        assert "rvo-layout-column--sm-12" in html


class TestLayoutColumnMdSizes:
    """Test medium breakpoint column sizes."""

    def test_md_4(self, render):
        html = render('<c-layout-column size="md-4">Content</c-layout-column>')
        assert "rvo-layout-column--md-4" in html

    def test_md_6(self, render):
        html = render('<c-layout-column size="md-6">Content</c-layout-column>')
        assert "rvo-layout-column--md-6" in html

    def test_md_8(self, render):
        html = render('<c-layout-column size="md-8">Content</c-layout-column>')
        assert "rvo-layout-column--md-8" in html

    def test_md_12(self, render):
        html = render('<c-layout-column size="md-12">Content</c-layout-column>')
        assert "rvo-layout-column--md-12" in html


class TestLayoutColumnLgSizes:
    """Test large breakpoint column sizes."""

    def test_lg_3(self, render):
        html = render('<c-layout-column size="lg-3">Content</c-layout-column>')
        assert "rvo-layout-column--lg-3" in html

    def test_lg_4(self, render):
        html = render('<c-layout-column size="lg-4">Content</c-layout-column>')
        assert "rvo-layout-column--lg-4" in html

    def test_lg_6(self, render):
        html = render('<c-layout-column size="lg-6">Content</c-layout-column>')
        assert "rvo-layout-column--lg-6" in html

    def test_lg_12(self, render):
        html = render('<c-layout-column size="lg-12">Content</c-layout-column>')
        assert "rvo-layout-column--lg-12" in html


class TestLayoutColumnSizeExclusivity:
    """Test that only the specified size class is applied."""

    def test_md_6_excludes_other_sizes(self, render):
        html = render('<c-layout-column size="md-6">Content</c-layout-column>')
        assert "rvo-layout-column--md-6" in html
        assert "rvo-layout-column--lg-" not in html
        assert "rvo-layout-column--sm-" not in html
        assert "rvo-layout-column--xs-" not in html


class TestLayoutColumnGenericAttributes:
    """Test generic attribute passthrough."""

    def test_data_attribute(self, render):
        html = render('<c-layout-column data-testid="col-1">Content</c-layout-column>')
        assert 'data-testid="col-1"' in html

    def test_aria_attribute(self, render):
        html = render('<c-layout-column aria-label="Column">Content</c-layout-column>')
        assert 'aria-label="Column"' in html


class TestLayoutColumnCustomClass:
    """Test custom class attribute."""

    def test_custom_class_appended(self, render):
        html = render('<c-layout-column class="my-col">Content</c-layout-column>')
        assert "my-col" in html
        assert "rvo-layout-column" in html


class TestLayoutColumnUtilityClasses:
    """Test utility class support."""

    def test_margin_utility(self, render):
        html = render('<c-layout-column margin="lg">Content</c-layout-column>')
        assert "rvo-margin--lg" in html
