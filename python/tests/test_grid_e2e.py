"""End-to-end tests for the grid component.

Tests the full pipeline: <c-grid .../> -> preprocessor -> Jinja2 template -> HTML output.

The grid renders two nested divs:
  - Outer: rvo-layout-grid-container (+ custom class)
  - Inner: rvo-layout-grid with column/gap/division classes
"""

import re


def normalize_whitespace(html: str) -> str:
    """Collapse all whitespace sequences to single spaces, strip outer whitespace."""
    return re.sub(r"\s+", " ", html).strip()


class TestGridBasic:
    """Test basic grid rendering."""

    def test_renders_two_nested_divs(self, render):
        html = render('<c-grid>Content</c-grid>')
        norm = normalize_whitespace(html)
        assert norm.count("<div") == 2
        assert norm.count("</div>") == 2

    def test_outer_container_class(self, render):
        html = render('<c-grid>Content</c-grid>')
        assert "rvo-layout-grid-container" in html

    def test_inner_grid_class(self, render):
        html = render('<c-grid>Content</c-grid>')
        assert "rvo-layout-grid" in html

    def test_data_lotc_component_attribute(self, render):
        html = render('<c-grid>Content</c-grid>')
        assert 'data-lotc-component="grid"' in html

    def test_children_passed_through(self, render):
        html = render('<c-grid>Hello grid</c-grid>')
        assert "Hello grid" in html


class TestGridColumns:
    """Test column count variants."""

    def test_default_columns_one(self, render):
        html = render('<c-grid>Content</c-grid>')
        assert "rvo-layout-grid-columns--one" in html

    def test_columns_one(self, render):
        html = render('<c-grid columns="one">Content</c-grid>')
        assert "rvo-layout-grid-columns--one" in html

    def test_columns_two(self, render):
        html = render('<c-grid columns="two">Content</c-grid>')
        assert "rvo-layout-grid-columns--two" in html

    def test_columns_three(self, render):
        html = render('<c-grid columns="three">Content</c-grid>')
        assert "rvo-layout-grid-columns--three" in html

    def test_columns_four(self, render):
        html = render('<c-grid columns="four">Content</c-grid>')
        assert "rvo-layout-grid-columns--four" in html

    def test_columns_five(self, render):
        html = render('<c-grid columns="five">Content</c-grid>')
        assert "rvo-layout-grid-columns--five" in html

    def test_columns_six(self, render):
        html = render('<c-grid columns="six">Content</c-grid>')
        assert "rvo-layout-grid-columns--six" in html

    def test_columns_seven(self, render):
        html = render('<c-grid columns="seven">Content</c-grid>')
        assert "rvo-layout-grid-columns--seven" in html

    def test_columns_eight(self, render):
        html = render('<c-grid columns="eight">Content</c-grid>')
        assert "rvo-layout-grid-columns--eight" in html

    def test_columns_nine(self, render):
        html = render('<c-grid columns="nine">Content</c-grid>')
        assert "rvo-layout-grid-columns--nine" in html

    def test_columns_ten(self, render):
        html = render('<c-grid columns="ten">Content</c-grid>')
        assert "rvo-layout-grid-columns--ten" in html

    def test_columns_eleven(self, render):
        html = render('<c-grid columns="eleven">Content</c-grid>')
        assert "rvo-layout-grid-columns--eleven" in html

    def test_columns_twelve(self, render):
        html = render('<c-grid columns="twelve">Content</c-grid>')
        assert "rvo-layout-grid-columns--twelve" in html

    def test_columns_three_excludes_other_columns(self, render):
        html = render('<c-grid columns="three">Content</c-grid>')
        assert "rvo-layout-grid-columns--three" in html
        assert "rvo-layout-grid-columns--one" not in html
        assert "rvo-layout-grid-columns--two" not in html
        assert "rvo-layout-grid-columns--four" not in html


class TestGridGap:
    """Test gap size variants."""

    def test_default_gap_md(self, render):
        html = render('<c-grid>Content</c-grid>')
        assert "rvo-layout-gap--md" in html

    def test_gap_0(self, render):
        html = render('<c-grid gap="0">Content</c-grid>')
        assert "rvo-layout-gap--0" in html

    def test_gap_3xs(self, render):
        html = render('<c-grid gap="3xs">Content</c-grid>')
        assert "rvo-layout-gap--3xs" in html

    def test_gap_2xs(self, render):
        html = render('<c-grid gap="2xs">Content</c-grid>')
        assert "rvo-layout-gap--2xs" in html

    def test_gap_xs(self, render):
        html = render('<c-grid gap="xs">Content</c-grid>')
        assert "rvo-layout-gap--xs" in html

    def test_gap_sm(self, render):
        html = render('<c-grid gap="sm">Content</c-grid>')
        assert "rvo-layout-gap--sm" in html

    def test_gap_lg(self, render):
        html = render('<c-grid gap="lg">Content</c-grid>')
        assert "rvo-layout-gap--lg" in html

    def test_gap_xl(self, render):
        html = render('<c-grid gap="xl">Content</c-grid>')
        assert "rvo-layout-gap--xl" in html

    def test_gap_2xl(self, render):
        html = render('<c-grid gap="2xl">Content</c-grid>')
        assert "rvo-layout-gap--2xl" in html

    def test_gap_3xl(self, render):
        html = render('<c-grid gap="3xl">Content</c-grid>')
        assert "rvo-layout-gap--3xl" in html

    def test_gap_4xl(self, render):
        html = render('<c-grid gap="4xl">Content</c-grid>')
        assert "rvo-layout-gap--4xl" in html

    def test_gap_5xl(self, render):
        html = render('<c-grid gap="5xl">Content</c-grid>')
        assert "rvo-layout-gap--5xl" in html

    def test_gap_lg_excludes_other_gaps(self, render):
        html = render('<c-grid gap="lg">Content</c-grid>')
        assert "rvo-layout-gap--lg" in html
        assert "rvo-layout-gap--md" not in html
        assert "rvo-layout-gap--xl" not in html


class TestGridDivision:
    """Test custom division (grid-template-columns) support."""

    def test_division_adds_class(self, render):
        html = render('<c-grid division="2fr 1fr">Content</c-grid>')
        assert "rvo-layout-grid--division" in html

    def test_division_adds_style(self, render):
        html = render('<c-grid division="2fr 1fr">Content</c-grid>')
        assert 'style="--division: 2fr 1fr;"' in html

    def test_no_division_no_class(self, render):
        html = render('<c-grid>Content</c-grid>')
        assert "rvo-layout-grid--division" not in html

    def test_no_division_no_style(self, render):
        html = render('<c-grid>Content</c-grid>')
        assert "--division" not in html

    def test_division_with_columns(self, render):
        html = render('<c-grid columns="two" division="2fr 1fr">Content</c-grid>')
        assert "rvo-layout-grid-columns--two" in html
        assert "rvo-layout-grid--division" in html
        assert 'style="--division: 2fr 1fr;"' in html


class TestGridCombined:
    """Test combining multiple props."""

    def test_columns_and_gap(self, render):
        html = render('<c-grid columns="three" gap="lg">Content</c-grid>')
        assert "rvo-layout-grid-columns--three" in html
        assert "rvo-layout-gap--lg" in html

    def test_all_props(self, render):
        html = render('<c-grid columns="four" gap="xl" division="1fr 2fr 1fr 1fr">Content</c-grid>')
        assert "rvo-layout-grid-columns--four" in html
        assert "rvo-layout-gap--xl" in html
        assert "rvo-layout-grid--division" in html
        assert "--division: 1fr 2fr 1fr 1fr;" in html


class TestGridCustomClass:
    """Test custom class attribute."""

    def test_custom_class_on_container(self, render):
        html = render('<c-grid class="my-grid">Content</c-grid>')
        norm = normalize_whitespace(html)
        # Custom class should be on the outer container div
        assert "rvo-layout-grid-container" in norm
        assert "my-grid" in norm

    def test_custom_class_with_columns(self, render):
        html = render('<c-grid columns="two" class="extra-class">Content</c-grid>')
        assert "extra-class" in html
        assert "rvo-layout-grid-columns--two" in html


class TestGridGenericAttributes:
    """Test generic attribute passthrough."""

    def test_data_attribute(self, render):
        html = render('<c-grid data-testid="grid-1">Content</c-grid>')
        assert 'data-testid="grid-1"' in html

    def test_aria_attribute(self, render):
        html = render('<c-grid aria-label="Content grid">Content</c-grid>')
        assert 'aria-label="Content grid"' in html


class TestGridUtilityClasses:
    """Test utility class support."""

    def test_margin_utility(self, render):
        html = render('<c-grid margin="lg">Content</c-grid>')
        assert "rvo-margin--lg" in html


class TestGridWithChildren:
    """Test grid with child components."""

    def test_grid_with_cards(self, render):
        html = render(
            '<c-grid columns="three" gap="lg">'
            '<c-card title="Card 1">Content 1</c-card>'
            '<c-card title="Card 2">Content 2</c-card>'
            '<c-card title="Card 3">Content 3</c-card>'
            '</c-grid>'
        )
        norm = normalize_whitespace(html)
        assert "rvo-layout-grid-columns--three" in norm
        assert "rvo-card" in norm
        assert "Card 1" in norm
        assert "Card 2" in norm
        assert "Card 3" in norm

    def test_grid_with_buttons(self, render):
        html = render(
            '<c-grid columns="two" gap="md">'
            '<c-button name="Action 1"/>'
            '<c-button name="Action 2"/>'
            '</c-grid>'
        )
        norm = normalize_whitespace(html)
        assert "rvo-layout-grid-columns--two" in norm
        assert "Action 1" in norm
        assert "Action 2" in norm

    def test_grid_with_plain_html(self, render):
        html = render(
            '<c-grid columns="four">'
            '<div>Item 1</div>'
            '<div>Item 2</div>'
            '<div>Item 3</div>'
            '<div>Item 4</div>'
            '</c-grid>'
        )
        norm = normalize_whitespace(html)
        assert "rvo-layout-grid-columns--four" in norm
        assert "Item 1" in norm
        assert "Item 4" in norm
