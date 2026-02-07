"""End-to-end tests for the card component.

Tests the full pipeline: <c-card .../> -> preprocessor -> Jinja2 template -> HTML output.
"""

import re


def normalize_whitespace(html: str) -> str:
    """Collapse all whitespace sequences to single spaces, strip outer whitespace."""
    return re.sub(r"\s+", " ", html).strip()


class TestCardBasic:
    """Test basic card rendering."""

    def test_renders_div_element(self, render):
        html = render('<c-card title="Test"/>')
        norm = normalize_whitespace(html)
        assert "<div" in norm
        assert "</div>" in norm

    def test_base_class(self, render):
        html = render('<c-card title="Test"/>')
        assert "rvo-card" in html

    def test_data_lotc_component_attribute(self, render):
        html = render('<c-card title="Test"/>')
        assert 'data-lotc-component="card"' in html

    def test_title_renders_as_h3(self, render):
        html = render('<c-card title="My Card"/>')
        norm = normalize_whitespace(html)
        assert "<h3" in norm
        assert "utrecht-heading-3" in norm
        assert "My Card" in norm

    def test_content_between_tags(self, render):
        html = render('<c-card title="Test">Card body content</c-card>')
        assert "Card body content" in html

    def test_content_with_html(self, render):
        html = render('<c-card title="Test"><p>Paragraph</p></c-card>')
        assert "<p>Paragraph</p>" in html

    def test_no_title_omits_h3(self, render):
        html = render("<c-card>Just content</c-card>")
        assert "<h3" not in html
        assert "Just content" in html


class TestCardImage:
    """Test card image rendering."""

    def test_image_renders_container(self, render):
        html = render('<c-card title="Test" image="/photo.jpg"/>')
        norm = normalize_whitespace(html)
        assert "rvo-card__image-container" in norm
        assert 'src="/photo.jpg"' in norm

    def test_image_with_image_class(self, render):
        html = render('<c-card title="Test" image="/photo.jpg"/>')
        assert "rvo-card--with-image" in html

    def test_image_with_size_class(self, render):
        html = render('<c-card title="Test" image="/photo.jpg"/>')
        assert "rvo-card--with-image-md" in html

    def test_image_size_sm(self, render):
        html = render('<c-card title="Test" image="/photo.jpg" image-size="sm"/>')
        assert "rvo-card--with-image-sm" in html
        assert "rvo-card-img--sm" in html

    def test_image_size_md(self, render):
        html = render('<c-card title="Test" image="/photo.jpg" image-size="md"/>')
        assert "rvo-card--with-image-md" in html
        assert "rvo-card-img--md" in html

    def test_image_alt_text(self, render):
        html = render('<c-card title="Test" image="/photo.jpg" image-alt="A photo"/>')
        assert 'alt="A photo"' in html

    def test_image_alt_empty_by_default(self, render):
        html = render('<c-card title="Test" image="/photo.jpg"/>')
        assert 'alt=""' in html

    def test_no_image_omits_container(self, render):
        html = render('<c-card title="Test"/>')
        assert "rvo-card__image-container" not in html
        assert "rvo-card--with-image" not in html


class TestCardLayout:
    """Test card layout variants."""

    def test_default_layout_is_column(self, render):
        html = render('<c-card title="Test"/>')
        # Row-specific classes should not be present in default column layout
        assert "rvo-layout-row" not in html

    def test_row_layout(self, render):
        html = render('<c-card title="Test" layout="row"/>')
        norm = normalize_whitespace(html)
        assert "rvo-layout-row" in norm
        assert "rvo-layout-align-content-center" in norm
        assert "rvo-layout-gap--md" in norm

    def test_row_layout_image_container(self, render):
        html = render('<c-card title="Test" image="/photo.jpg" layout="row"/>')
        assert "rvo-card__image-container--row" in html


class TestCardInlineImage:
    """Test inline image rendering for row layout."""

    def test_inline_image_no_separate_container(self, render):
        html = render('<c-card title="Test" image="/photo.jpg" inline-image layout="row"/>')
        assert "rvo-card__image-container" not in html
        assert "rvo-card--with-image" not in html

    def test_inline_image_rendered_inside_content(self, render):
        html = render('<c-card title="Test" image="/photo.jpg" inline-image layout="row"/>')
        norm = normalize_whitespace(html)
        # Image should be inside content div
        content_start = norm.find("rvo-card__content")
        img_pos = norm.find('src="/photo.jpg"')
        assert content_start < img_pos


class TestCardLink:
    """Test card link behavior."""

    def test_title_with_link(self, render):
        html = render('<c-card title="Click Me" href="/page"/>')
        norm = normalize_whitespace(html)
        assert '<a href="/page"' in norm
        assert "rvo-card__link" in norm
        assert "Click Me" in norm

    def test_title_without_link(self, render):
        html = render('<c-card title="No Link"/>')
        assert "<a " not in html
        assert "No Link" in html

    def test_full_card_link_class(self, render):
        html = render('<c-card title="Test" href="/page" full-card-link/>')
        assert "rvo-card__full-card-link" in html

    def test_no_full_card_link_by_default(self, render):
        html = render('<c-card title="Test" href="/page"/>')
        assert "rvo-card__full-card-link" not in html


class TestCardLinkIndicator:
    """Test link indicator rendering."""

    def test_link_indicator_when_all_conditions_met(self, render):
        html = render(
            '<c-card title="Test" href="/page" full-card-link show-link-indicator/>'
        )
        norm = normalize_whitespace(html)
        assert "rvo-card--with-link-indicator" in norm
        assert "rvo-card__link-indicator" in norm
        assert "rvo-icon--delta-naar-rechts" in norm

    def test_no_indicator_without_href(self, render):
        html = render('<c-card title="Test" full-card-link show-link-indicator/>')
        assert "rvo-card__link-indicator" not in html

    def test_no_indicator_without_full_card_link(self, render):
        html = render('<c-card title="Test" href="/page" show-link-indicator/>')
        assert "rvo-card__link-indicator" not in html

    def test_no_indicator_without_show_link_indicator(self, render):
        html = render('<c-card title="Test" href="/page" full-card-link/>')
        assert "rvo-card__link-indicator" not in html


class TestCardOutline:
    """Test card outline styling."""

    def test_outline_class(self, render):
        html = render('<c-card title="Test" outline/>')
        assert "rvo-card--outline" in html

    def test_no_outline_by_default(self, render):
        html = render('<c-card title="Test"/>')
        assert "rvo-card--outline" not in html

    def test_outline_suppressed_with_background_image(self, render):
        html = render(
            '<c-card title="Test" outline background-image="/bg.jpg"/>'
        )
        assert "rvo-card--outline" not in html


class TestCardPadding:
    """Test card padding variants."""

    def test_padding_with_outline(self, render):
        html = render('<c-card title="Test" outline padding="lg"/>')
        assert "rvo-card--padding-lg" in html

    def test_padding_with_background_color(self, render):
        html = render('<c-card title="Test" background-color="grijs-100" padding="sm"/>')
        assert "rvo-card--padding-sm" in html

    def test_no_padding_class_without_outline_or_bg(self, render):
        html = render('<c-card title="Test" padding="lg"/>')
        assert "rvo-card--padding-lg" not in html

    def test_padding_none_suppresses_class(self, render):
        html = render('<c-card title="Test" outline padding="none"/>')
        assert "rvo-card--padding-" not in html

    def test_default_padding_md_with_outline(self, render):
        html = render('<c-card title="Test" outline/>')
        assert "rvo-card--padding-md" in html


class TestCardBackgroundImage:
    """Test background image rendering."""

    def test_background_image_container(self, render):
        html = render('<c-card title="Test" background-image="/bg.jpg"/>')
        norm = normalize_whitespace(html)
        assert "rvo-card__background-image-container" in norm
        assert 'src="/bg.jpg"' in norm
        assert "rvo-card__background-image" in norm

    def test_background_image_class(self, render):
        html = render('<c-card title="Test" background-image="/bg.jpg"/>')
        assert "rvo-card--with-background-image" in html

    def test_no_background_image_by_default(self, render):
        html = render('<c-card title="Test"/>')
        assert "rvo-card__background-image-container" not in html
        assert "rvo-card--with-background-image" not in html


class TestCardInvertedColors:
    """Test inverted colors styling."""

    def test_inverted_colors_class(self, render):
        html = render('<c-card title="Test" inverted-colors/>')
        assert "rvo-card--inverted-colors" in html

    def test_no_inverted_by_default(self, render):
        html = render('<c-card title="Test"/>')
        assert "rvo-card--inverted-colors" not in html


class TestCardGenericAttributes:
    """Test generic attribute passthrough."""

    def test_data_attribute(self, render):
        html = render('<c-card title="Test" data-testid="card-1"/>')
        assert 'data-testid="card-1"' in html

    def test_aria_attribute(self, render):
        html = render('<c-card title="Test" aria-label="Featured card"/>')
        assert 'aria-label="Featured card"' in html


class TestCardCustomClass:
    """Test custom class attribute."""

    def test_custom_class_appended(self, render):
        html = render('<c-card title="Test" class="my-card"/>')
        assert "my-card" in html
        assert "rvo-card" in html


class TestCardUtilityClasses:
    """Test utility class support."""

    def test_margin_utility(self, render):
        html = render('<c-card title="Test" margin="md"/>')
        assert "rvo-margin--md" in html
