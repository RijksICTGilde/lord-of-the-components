"""End-to-end tests for the layout-flow component.

Tests the full pipeline: <c-layout-flow .../> -> preprocessor -> Jinja2 template -> HTML output.
"""

import re


def normalize_whitespace(html: str) -> str:
    """Collapse all whitespace sequences to single spaces, strip outer whitespace."""
    return re.sub(r"\s+", " ", html).strip()


class TestLayoutFlowBasic:
    """Test basic layout-flow rendering."""

    def test_renders_div_element(self, render):
        html = render('<c-layout-flow>Content</c-layout-flow>')
        norm = normalize_whitespace(html)
        assert "<div" in norm
        assert "</div>" in norm

    def test_data_lotc_component_attribute(self, render):
        html = render('<c-layout-flow>Content</c-layout-flow>')
        assert 'data-lotc-component="layout-flow"' in html

    def test_base_max_width_layout_class(self, render):
        html = render('<c-layout-flow>Content</c-layout-flow>')
        assert "rvo-max-width-layout" in html

    def test_default_size_lg(self, render):
        html = render('<c-layout-flow>Content</c-layout-flow>')
        assert "rvo-max-width-layout--lg" in html

    def test_default_direction_column(self, render):
        html = render('<c-layout-flow>Content</c-layout-flow>')
        assert "rvo-layout-column" in html
        assert "rvo-layout-row" not in html

    def test_default_gap_md(self, render):
        html = render('<c-layout-flow>Content</c-layout-flow>')
        assert "rvo-layout-gap--md" in html

    def test_children_passed_through(self, render):
        html = render('<c-layout-flow>Hello world</c-layout-flow>')
        assert "Hello world" in html


class TestLayoutFlowSizes:
    """Test max-width layout size variants."""

    def test_size_sm(self, render):
        html = render('<c-layout-flow size="sm">Content</c-layout-flow>')
        assert "rvo-max-width-layout--sm" in html
        assert "rvo-max-width-layout--lg" not in html

    def test_size_md(self, render):
        html = render('<c-layout-flow size="md">Content</c-layout-flow>')
        assert "rvo-max-width-layout--md" in html
        assert "rvo-max-width-layout--lg" not in html

    def test_size_lg(self, render):
        html = render('<c-layout-flow size="lg">Content</c-layout-flow>')
        assert "rvo-max-width-layout--lg" in html


class TestLayoutFlowDirection:
    """Test direction (row/column) control."""

    def test_row_direction(self, render):
        html = render('<c-layout-flow row>Content</c-layout-flow>')
        assert "rvo-layout-row" in html
        assert "rvo-layout-column" not in html

    def test_column_direction_default(self, render):
        html = render('<c-layout-flow>Content</c-layout-flow>')
        assert "rvo-layout-column" in html
        assert "rvo-layout-row" not in html


class TestLayoutFlowGap:
    """Test gap size variants."""

    def test_gap_0(self, render):
        html = render('<c-layout-flow gap="0">Content</c-layout-flow>')
        assert "rvo-layout-gap--0" in html

    def test_gap_3xs(self, render):
        html = render('<c-layout-flow gap="3xs">Content</c-layout-flow>')
        assert "rvo-layout-gap--3xs" in html

    def test_gap_xs(self, render):
        html = render('<c-layout-flow gap="xs">Content</c-layout-flow>')
        assert "rvo-layout-gap--xs" in html

    def test_gap_sm(self, render):
        html = render('<c-layout-flow gap="sm">Content</c-layout-flow>')
        assert "rvo-layout-gap--sm" in html

    def test_gap_lg(self, render):
        html = render('<c-layout-flow gap="lg">Content</c-layout-flow>')
        assert "rvo-layout-gap--lg" in html

    def test_gap_xl(self, render):
        html = render('<c-layout-flow gap="xl">Content</c-layout-flow>')
        assert "rvo-layout-gap--xl" in html

    def test_gap_2xl(self, render):
        html = render('<c-layout-flow gap="2xl">Content</c-layout-flow>')
        assert "rvo-layout-gap--2xl" in html

    def test_gap_4xl(self, render):
        html = render('<c-layout-flow gap="4xl">Content</c-layout-flow>')
        assert "rvo-layout-gap--4xl" in html

    def test_gap_md_does_not_have_other_gaps(self, render):
        html = render('<c-layout-flow gap="md">Content</c-layout-flow>')
        assert "rvo-layout-gap--md" in html
        assert "rvo-layout-gap--xs" not in html
        assert "rvo-layout-gap--lg" not in html


class TestLayoutFlowWrap:
    """Test flex-wrap control."""

    def test_wrap_enabled(self, render):
        html = render('<c-layout-flow wrap>Content</c-layout-flow>')
        assert "rvo-layout--wrap" in html

    def test_no_wrap_by_default(self, render):
        html = render('<c-layout-flow>Content</c-layout-flow>')
        assert "rvo-layout--wrap" not in html


class TestLayoutFlowAlignment:
    """Test alignment and justification props."""

    def test_align_items_start(self, render):
        html = render('<c-layout-flow align-items="start">Content</c-layout-flow>')
        assert "rvo-layout-align-items-start" in html

    def test_align_items_center(self, render):
        html = render('<c-layout-flow align-items="center">Content</c-layout-flow>')
        assert "rvo-layout-align-items-center" in html

    def test_align_items_end(self, render):
        html = render('<c-layout-flow align-items="end">Content</c-layout-flow>')
        assert "rvo-layout-align-items-end" in html

    def test_align_content_space_between(self, render):
        html = render('<c-layout-flow align-content="space-between">Content</c-layout-flow>')
        assert "rvo-layout-align-content-space-between" in html

    def test_justify_items_center(self, render):
        html = render('<c-layout-flow justify-items="center">Content</c-layout-flow>')
        assert "rvo-layout-justify-items-center" in html

    def test_justify_content_space_between(self, render):
        html = render('<c-layout-flow justify-content="space-between">Content</c-layout-flow>')
        assert "rvo-layout-justify-content-space-between" in html

    def test_justify_content_end(self, render):
        html = render('<c-layout-flow justify-content="end">Content</c-layout-flow>')
        assert "rvo-layout-justify-content-end" in html

    def test_no_alignment_classes_by_default(self, render):
        html = render('<c-layout-flow>Content</c-layout-flow>')
        assert "rvo-layout-align-items" not in html
        assert "rvo-layout-align-content" not in html
        assert "rvo-layout-justify-items" not in html
        assert "rvo-layout-justify-content" not in html


class TestLayoutFlowCombined:
    """Test combining multiple props."""

    def test_row_with_gap_and_wrap(self, render):
        html = render('<c-layout-flow row wrap gap="lg">Content</c-layout-flow>')
        assert "rvo-layout-row" in html
        assert "rvo-layout--wrap" in html
        assert "rvo-layout-gap--lg" in html

    def test_all_alignment_props(self, render):
        html = render(
            '<c-layout-flow align-items="center" justify-content="space-between">'
            'Content</c-layout-flow>'
        )
        assert "rvo-layout-align-items-center" in html
        assert "rvo-layout-justify-content-space-between" in html


class TestLayoutFlowGenericAttributes:
    """Test generic attribute passthrough."""

    def test_data_attribute(self, render):
        html = render('<c-layout-flow data-testid="layout-1">Content</c-layout-flow>')
        assert 'data-testid="layout-1"' in html

    def test_aria_attribute(self, render):
        html = render('<c-layout-flow aria-label="Main layout">Content</c-layout-flow>')
        assert 'aria-label="Main layout"' in html


class TestLayoutFlowCustomClass:
    """Test custom class attribute."""

    def test_custom_class_appended(self, render):
        html = render('<c-layout-flow class="my-layout">Content</c-layout-flow>')
        assert "my-layout" in html
        assert "rvo-max-width-layout" in html


class TestLayoutFlowUtilityClasses:
    """Test utility class support."""

    def test_margin_utility(self, render):
        html = render('<c-layout-flow margin="lg">Content</c-layout-flow>')
        assert "rvo-margin--lg" in html
