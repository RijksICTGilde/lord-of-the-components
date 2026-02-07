"""End-to-end tests for the hero component.

Tests the full pipeline: <c-hero .../> -> preprocessor -> Jinja2 template -> HTML output.
"""

import re


def normalize_whitespace(html: str) -> str:
    """Collapse all whitespace sequences to single spaces, strip outer whitespace."""
    return re.sub(r"\s+", " ", html).strip()


class TestHeroBasic:
    """Test basic hero rendering."""

    def test_renders_section_element(self, render):
        html = render('<c-hero title="Welcome"/>')
        norm = normalize_whitespace(html)
        assert "<section" in norm
        assert "</section>" in norm

    def test_base_class(self, render):
        html = render('<c-hero title="Welcome"/>')
        assert "rvo-hero" in html

    def test_data_lotc_component_attribute(self, render):
        html = render('<c-hero title="Welcome"/>')
        assert 'data-lotc-component="hero"' in html

    def test_renders_without_props(self, render):
        html = render("<c-hero/>")
        assert "rvo-hero" in html
        assert "<section" in html


class TestHeroSize:
    """Test hero size variants."""

    def test_default_size_md(self, render):
        html = render("<c-hero/>")
        assert "rvo-hero--md" in html

    def test_size_sm(self, render):
        html = render('<c-hero size="sm"/>')
        assert "rvo-hero--sm" in html

    def test_size_md(self, render):
        html = render('<c-hero size="md"/>')
        assert "rvo-hero--md" in html

    def test_size_lg(self, render):
        html = render('<c-hero size="lg"/>')
        assert "rvo-hero--lg" in html

    def test_sm_does_not_have_other_sizes(self, render):
        html = render('<c-hero size="sm"/>')
        assert "rvo-hero--sm" in html
        assert "rvo-hero--md" not in html
        assert "rvo-hero--lg" not in html


class TestHeroTitle:
    """Test hero title rendering."""

    def test_title_rendered(self, render):
        html = render('<c-hero title="Welcome"/>')
        assert "Welcome" in html

    def test_title_in_h1(self, render):
        html = render('<c-hero title="Welcome"/>')
        norm = normalize_whitespace(html)
        assert "<h1" in norm
        assert "Welcome" in norm

    def test_title_has_heading_class(self, render):
        html = render('<c-hero title="Welcome"/>')
        assert "utrecht-heading-1" in html
        assert "rvo-hero__title" in html

    def test_no_title_no_h1(self, render):
        html = render("<c-hero/>")
        assert "<h1" not in html
        assert "rvo-hero__title" not in html


class TestHeroSubtitle:
    """Test hero subtitle rendering."""

    def test_subtitle_rendered(self, render):
        html = render('<c-hero title="Hi" subtitle="Sub text"/>')
        assert "Sub text" in html

    def test_subtitle_in_paragraph(self, render):
        html = render('<c-hero subtitle="Sub text"/>')
        norm = normalize_whitespace(html)
        assert "rvo-hero__subtitle" in norm
        assert "rvo-text--lg" in norm

    def test_no_subtitle_no_subtitle_element(self, render):
        html = render('<c-hero title="Hi"/>')
        assert "rvo-hero__subtitle" not in html

    def test_title_and_subtitle_together(self, render):
        html = render('<c-hero title="Main" subtitle="Sub"/>')
        assert "rvo-hero__title" in html
        assert "rvo-hero__subtitle" in html
        assert "Main" in html
        assert "Sub" in html


class TestHeroImage:
    """Test hero image rendering."""

    def test_image_rendered(self, render):
        html = render('<c-hero image="/hero.jpg"/>')
        assert '<img' in html
        assert 'src="/hero.jpg"' in html

    def test_image_class(self, render):
        html = render('<c-hero image="/hero.jpg"/>')
        assert "rvo-hero__image" in html

    def test_image_container(self, render):
        html = render('<c-hero image="/hero.jpg"/>')
        assert "rvo-hero__image-container" in html

    def test_image_adds_with_image_class(self, render):
        html = render('<c-hero image="/hero.jpg"/>')
        assert "rvo-hero--with-image" in html

    def test_no_image_no_with_image_class(self, render):
        html = render('<c-hero title="Test"/>')
        assert "rvo-hero--with-image" not in html

    def test_no_image_no_img_element(self, render):
        html = render('<c-hero title="Test"/>')
        assert "<img" not in html

    def test_image_alt_text(self, render):
        html = render('<c-hero image="/hero.jpg" image-alt="Banner image"/>')
        assert 'alt="Banner image"' in html

    def test_image_default_alt_empty(self, render):
        html = render('<c-hero image="/hero.jpg"/>')
        assert 'alt=""' in html


class TestHeroOverlay:
    """Test hero overlay prop."""

    def test_overlay_adds_class(self, render):
        html = render("<c-hero overlay/>")
        assert "rvo-hero--overlay" in html

    def test_no_overlay_no_class(self, render):
        html = render('<c-hero title="Test"/>')
        assert "rvo-hero--overlay" not in html


class TestHeroContent:
    """Test hero content section."""

    def test_content_section(self, render):
        html = render('<c-hero title="Test"/>')
        assert "rvo-hero__content" in html

    def test_children_rendered(self, render):
        html = render("<c-hero>Extra content here</c-hero>")
        assert "Extra content here" in html

    def test_children_in_text_div(self, render):
        html = render("<c-hero>Extra content</c-hero>")
        assert "rvo-hero__text" in html

    def test_children_with_html(self, render):
        html = render("<c-hero><p>Paragraph content</p></c-hero>")
        assert "<p>Paragraph content</p>" in html

    def test_no_content_no_content_section(self, render):
        """When no title, subtitle, or children, no content section rendered."""
        html = render("<c-hero/>")
        assert "rvo-hero__content" not in html


class TestHeroClass:
    """Test custom CSS class support."""

    def test_custom_class(self, render):
        html = render('<c-hero class="my-hero"/>')
        assert "rvo-hero" in html
        assert "my-hero" in html

    def test_multiple_custom_classes(self, render):
        html = render('<c-hero class="foo bar"/>')
        assert "foo" in html
        assert "bar" in html


class TestHeroGenericAttributes:
    """Test generic attribute passthrough."""

    def test_data_attribute(self, render):
        html = render('<c-hero data-testid="main-hero"/>')
        assert 'data-testid="main-hero"' in html

    def test_aria_attribute(self, render):
        html = render('<c-hero aria-label="Hero section"/>')
        assert 'aria-label="Hero section"' in html


class TestHeroCombined:
    """Test combined usage with multiple props."""

    def test_full_hero(self, render):
        html = render(
            '<c-hero title="Welcome" subtitle="To our site" '
            'image="/hero.jpg" image-alt="Banner" size="lg" class="my-hero">'
            "Additional info"
            "</c-hero>"
        )
        norm = normalize_whitespace(html)
        assert "rvo-hero" in norm
        assert "rvo-hero--lg" in norm
        assert "rvo-hero--with-image" in norm
        assert "my-hero" in norm
        assert "Welcome" in norm
        assert "To our site" in norm
        assert 'src="/hero.jpg"' in norm
        assert 'alt="Banner"' in norm
        assert "Additional info" in norm
