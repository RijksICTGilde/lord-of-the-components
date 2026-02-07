"""End-to-end tests for the paragraph component.

Tests the full pipeline: <c-paragraph .../> -> preprocessor -> Jinja2 template -> HTML output.
"""

import re


def normalize_whitespace(html: str) -> str:
    """Collapse all whitespace sequences to single spaces, strip outer whitespace."""
    return re.sub(r"\s+", " ", html).strip()


class TestParagraphBasic:
    """Test basic paragraph rendering."""

    def test_renders_p_element(self, render):
        html = render('<c-paragraph name="Hello world"/>')
        norm = normalize_whitespace(html)
        assert "<p" in norm
        assert "</p>" in norm

    def test_base_class(self, render):
        html = render('<c-paragraph name="Hello"/>')
        assert "rvo-paragraph" in html

    def test_name_prop_renders_text(self, render):
        html = render('<c-paragraph name="Some text"/>')
        assert "Some text" in html

    def test_data_lotc_component_attribute(self, render):
        html = render('<c-paragraph name="Test"/>')
        assert 'data-lotc-component="paragraph"' in html

    def test_content_between_tags_overrides_name(self, render):
        html = render('<c-paragraph name="Fallback">Custom content</c-paragraph>')
        assert "Custom content" in html

    def test_content_with_html(self, render):
        html = render("<c-paragraph>Text with <em>emphasis</em></c-paragraph>")
        assert "<em>emphasis</em>" in html


class TestParagraphColor:
    """Test paragraph color variants."""

    def test_default_color_grijs_900(self, render):
        html = render('<c-paragraph name="Test"/>')
        assert "rvo-paragraph--grijs-900" in html

    def test_color_logoblauw(self, render):
        html = render('<c-paragraph color="logoblauw" name="Test"/>')
        assert "rvo-paragraph--logoblauw" in html

    def test_color_wit(self, render):
        html = render('<c-paragraph color="wit" name="Test"/>')
        assert "rvo-paragraph--wit" in html

    def test_color_zwart(self, render):
        html = render('<c-paragraph color="zwart" name="Test"/>')
        assert "rvo-paragraph--zwart" in html

    def test_color_grijs_500(self, render):
        html = render('<c-paragraph color="grijs-500" name="Test"/>')
        assert "rvo-paragraph--grijs-500" in html

    def test_color_grijs_900(self, render):
        html = render('<c-paragraph color="grijs-900" name="Test"/>')
        assert "rvo-paragraph--grijs-900" in html

    def test_logoblauw_does_not_have_other_colors(self, render):
        html = render('<c-paragraph color="logoblauw" name="Test"/>')
        assert "rvo-paragraph--logoblauw" in html
        assert "rvo-paragraph--grijs-900" not in html
        assert "rvo-paragraph--wit" not in html


class TestParagraphSize:
    """Test paragraph size variants."""

    def test_default_size_md(self, render):
        html = render('<c-paragraph name="Test"/>')
        assert "rvo-paragraph--md" in html

    def test_size_sm(self, render):
        html = render('<c-paragraph size="sm" name="Test"/>')
        assert "rvo-paragraph--sm" in html

    def test_size_md(self, render):
        html = render('<c-paragraph size="md" name="Test"/>')
        assert "rvo-paragraph--md" in html

    def test_size_lg(self, render):
        html = render('<c-paragraph size="lg" name="Test"/>')
        assert "rvo-paragraph--lg" in html

    def test_sm_does_not_have_other_sizes(self, render):
        html = render('<c-paragraph size="sm" name="Test"/>')
        assert "rvo-paragraph--sm" in html
        assert "rvo-paragraph--md" not in html
        assert "rvo-paragraph--lg" not in html


class TestParagraphNoSpacing:
    """Test no-spacing boolean prop."""

    def test_no_spacing(self, render):
        html = render('<c-paragraph no-spacing name="Test"/>')
        assert "rvo-paragraph--no-spacing" in html

    def test_no_spacing_not_present_by_default(self, render):
        html = render('<c-paragraph name="Test"/>')
        assert "rvo-paragraph--no-spacing" not in html


class TestParagraphAttributes:
    """Test HTML attribute rendering."""

    def test_data_attribute_passthrough(self, render):
        html = render('<c-paragraph data-testid="para-1" name="Test"/>')
        assert 'data-testid="para-1"' in html

    def test_aria_attribute_passthrough(self, render):
        html = render('<c-paragraph aria-label="Description" name="Test"/>')
        assert 'aria-label="Description"' in html


class TestParagraphCustomClass:
    """Test custom class attribute."""

    def test_custom_class_appended(self, render):
        html = render('<c-paragraph class="my-paragraph" name="Test"/>')
        assert "my-paragraph" in html
        assert "rvo-paragraph" in html


class TestParagraphUtilityClasses:
    """Test utility class support."""

    def test_margin_utility(self, render):
        html = render('<c-paragraph margin="sm" name="Test"/>')
        assert "rvo-margin--sm" in html

    def test_padding_utility(self, render):
        html = render('<c-paragraph padding="md" name="Test"/>')
        assert "rvo-padding--md" in html
