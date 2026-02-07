"""End-to-end tests for the layout-row component.

Tests the full pipeline: <c-layout-row .../> -> preprocessor -> Jinja2 template -> HTML output.
"""

import re


def normalize_whitespace(html: str) -> str:
    """Collapse all whitespace sequences to single spaces, strip outer whitespace."""
    return re.sub(r"\s+", " ", html).strip()


class TestLayoutRowBasic:
    """Test basic layout-row rendering."""

    def test_renders_div_element(self, render):
        html = render('<c-layout-row>Content</c-layout-row>')
        norm = normalize_whitespace(html)
        assert "<div" in norm
        assert "</div>" in norm

    def test_data_lotc_component_attribute(self, render):
        html = render('<c-layout-row>Content</c-layout-row>')
        assert 'data-lotc-component="layout-row"' in html

    def test_base_class(self, render):
        html = render('<c-layout-row>Content</c-layout-row>')
        assert "rvo-layout-row" in html

    def test_children_passed_through(self, render):
        html = render('<c-layout-row>Hello world</c-layout-row>')
        assert "Hello world" in html


class TestLayoutRowGap:
    """Test gap size variants."""

    def test_default_gap_md(self, render):
        html = render('<c-layout-row>Content</c-layout-row>')
        assert "rvo-layout-gap--md" in html

    def test_gap_0(self, render):
        html = render('<c-layout-row gap="0">Content</c-layout-row>')
        assert "rvo-layout-gap--0" in html

    def test_gap_xs(self, render):
        html = render('<c-layout-row gap="xs">Content</c-layout-row>')
        assert "rvo-layout-gap--xs" in html

    def test_gap_sm(self, render):
        html = render('<c-layout-row gap="sm">Content</c-layout-row>')
        assert "rvo-layout-gap--sm" in html

    def test_gap_lg(self, render):
        html = render('<c-layout-row gap="lg">Content</c-layout-row>')
        assert "rvo-layout-gap--lg" in html

    def test_gap_xl(self, render):
        html = render('<c-layout-row gap="xl">Content</c-layout-row>')
        assert "rvo-layout-gap--xl" in html

    def test_gap_2xl(self, render):
        html = render('<c-layout-row gap="2xl">Content</c-layout-row>')
        assert "rvo-layout-gap--2xl" in html

    def test_gap_3xl(self, render):
        html = render('<c-layout-row gap="3xl">Content</c-layout-row>')
        assert "rvo-layout-gap--3xl" in html

    def test_gap_md_excludes_other_gaps(self, render):
        html = render('<c-layout-row gap="md">Content</c-layout-row>')
        assert "rvo-layout-gap--md" in html
        assert "rvo-layout-gap--xs" not in html
        assert "rvo-layout-gap--lg" not in html


class TestLayoutRowVerticalSpacing:
    """Test vertical spacing variants."""

    def test_default_vertical_spacing_lg(self, render):
        html = render('<c-layout-row>Content</c-layout-row>')
        assert "rvo-layout-vertical--lg" in html

    def test_vertical_spacing_xs(self, render):
        html = render('<c-layout-row vertical-spacing="xs">Content</c-layout-row>')
        assert "rvo-layout-vertical--xs" in html

    def test_vertical_spacing_sm(self, render):
        html = render('<c-layout-row vertical-spacing="sm">Content</c-layout-row>')
        assert "rvo-layout-vertical--sm" in html

    def test_vertical_spacing_md(self, render):
        html = render('<c-layout-row vertical-spacing="md">Content</c-layout-row>')
        assert "rvo-layout-vertical--md" in html

    def test_vertical_spacing_xl(self, render):
        html = render('<c-layout-row vertical-spacing="xl">Content</c-layout-row>')
        assert "rvo-layout-vertical--xl" in html

    def test_vertical_spacing_2xl(self, render):
        html = render('<c-layout-row vertical-spacing="2xl">Content</c-layout-row>')
        assert "rvo-layout-vertical--2xl" in html

    def test_vertical_spacing_3xl(self, render):
        html = render('<c-layout-row vertical-spacing="3xl">Content</c-layout-row>')
        assert "rvo-layout-vertical--3xl" in html

    def test_vertical_spacing_center(self, render):
        html = render('<c-layout-row vertical-spacing="center">Content</c-layout-row>')
        assert "rvo-layout-align-content-center" in html
        assert "rvo-layout-vertical--center" not in html

    def test_vertical_spacing_center_excludes_size_class(self, render):
        html = render('<c-layout-row vertical-spacing="center">Content</c-layout-row>')
        assert "rvo-layout-vertical--" not in html


class TestLayoutRowCombined:
    """Test combining multiple props."""

    def test_gap_and_vertical_spacing(self, render):
        html = render('<c-layout-row gap="lg" vertical-spacing="sm">Content</c-layout-row>')
        assert "rvo-layout-gap--lg" in html
        assert "rvo-layout-vertical--sm" in html

    def test_gap_with_center_alignment(self, render):
        html = render('<c-layout-row gap="xl" vertical-spacing="center">Content</c-layout-row>')
        assert "rvo-layout-gap--xl" in html
        assert "rvo-layout-align-content-center" in html


class TestLayoutRowWithColumns:
    """Test layout-row containing layout-column children."""

    def test_row_with_two_columns(self, render):
        html = render(
            '<c-layout-row gap="md">'
            '<c-layout-column size="md-6">Left</c-layout-column>'
            '<c-layout-column size="md-6">Right</c-layout-column>'
            '</c-layout-row>'
        )
        norm = normalize_whitespace(html)
        assert "rvo-layout-row" in norm
        assert "rvo-layout-column--md-6" in norm
        assert "Left" in norm
        assert "Right" in norm

    def test_row_with_three_columns(self, render):
        html = render(
            '<c-layout-row gap="lg">'
            '<c-layout-column size="lg-4">Col 1</c-layout-column>'
            '<c-layout-column size="lg-4">Col 2</c-layout-column>'
            '<c-layout-column size="lg-4">Col 3</c-layout-column>'
            '</c-layout-row>'
        )
        assert "rvo-layout-column--lg-4" in html
        assert "Col 1" in html
        assert "Col 2" in html
        assert "Col 3" in html


class TestLayoutRowGenericAttributes:
    """Test generic attribute passthrough."""

    def test_data_attribute(self, render):
        html = render('<c-layout-row data-testid="row-1">Content</c-layout-row>')
        assert 'data-testid="row-1"' in html

    def test_aria_attribute(self, render):
        html = render('<c-layout-row aria-label="Grid row">Content</c-layout-row>')
        assert 'aria-label="Grid row"' in html


class TestLayoutRowCustomClass:
    """Test custom class attribute."""

    def test_custom_class_appended(self, render):
        html = render('<c-layout-row class="my-row">Content</c-layout-row>')
        assert "my-row" in html
        assert "rvo-layout-row" in html


class TestLayoutRowUtilityClasses:
    """Test utility class support."""

    def test_margin_utility(self, render):
        html = render('<c-layout-row margin="lg">Content</c-layout-row>')
        assert "rvo-margin--lg" in html
