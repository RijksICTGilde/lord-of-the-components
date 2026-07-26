"""End-to-end tests for the icon component.

Tests the full pipeline: <c-icon .../> -> preprocessor -> Jinja2 template -> HTML output.
"""

import re


def normalize_whitespace(html: str) -> str:
    """Collapse all whitespace sequences to single spaces, strip outer whitespace."""
    return re.sub(r"\s+", " ", html).strip()


class TestIconBasic:
    """Test basic icon rendering."""

    def test_renders_span_element(self, render):
        html = render('<c-icon icon="home"/>')
        norm = normalize_whitespace(html)
        assert "<span" in norm
        assert "</span>" in norm

    def test_base_classes(self, render):
        html = render('<c-icon icon="home"/>')
        norm = normalize_whitespace(html)
        assert "utrecht-icon" in norm
        assert "rvo-icon" in norm

    def test_icon_name_class(self, render):
        html = render('<c-icon icon="home"/>')
        assert "rvo-icon-home" in html

    def test_different_icon_name(self, render):
        # `search` is a semantic alias -> RVO icon `zoek` (definitions/icons.ts).
        html = render('<c-icon icon="search"/>')
        assert "rvo-icon-zoek" in html

    def test_data_lotc_component_attribute(self, render):
        html = render('<c-icon icon="home"/>')
        assert 'data-lotc-component="icon"' in html

    def test_role_img_attribute(self, render):
        html = render('<c-icon icon="home"/>')
        assert 'role="img"' in html


class TestIconSizes:
    """Test icon size variants."""

    def test_default_size_is_md(self, render):
        html = render('<c-icon icon="home"/>')
        assert "rvo-icon--md" in html

    def test_size_xs(self, render):
        html = render('<c-icon icon="home" size="xs"/>')
        assert "rvo-icon--xs" in html

    def test_size_sm(self, render):
        html = render('<c-icon icon="home" size="sm"/>')
        assert "rvo-icon--sm" in html

    def test_size_lg(self, render):
        html = render('<c-icon icon="home" size="lg"/>')
        assert "rvo-icon--lg" in html

    def test_size_xl(self, render):
        html = render('<c-icon icon="home" size="xl"/>')
        assert "rvo-icon--xl" in html

    def test_size_2xl(self, render):
        html = render('<c-icon icon="home" size="2xl"/>')
        assert "rvo-icon--2xl" in html

    def test_size_3xl(self, render):
        html = render('<c-icon icon="home" size="3xl"/>')
        assert "rvo-icon--3xl" in html

    def test_size_4xl(self, render):
        html = render('<c-icon icon="home" size="4xl"/>')
        assert "rvo-icon--4xl" in html

    def test_size_md_does_not_have_other_sizes(self, render):
        html = render('<c-icon icon="home" size="md"/>')
        assert "rvo-icon--md" in html
        assert "rvo-icon--xs" not in html
        assert "rvo-icon--lg" not in html


class TestIconColor:
    """Test icon color variants."""

    def test_no_color_by_default(self, render):
        html = render('<c-icon icon="home"/>')
        assert "rvo-icon--hemelblauw" not in html

    def test_color_hemelblauw(self, render):
        html = render('<c-icon icon="home" color="hemelblauw"/>')
        assert "rvo-icon--hemelblauw" in html

    def test_color_wit(self, render):
        html = render('<c-icon icon="home" color="wit"/>')
        assert "rvo-icon--wit" in html

    def test_color_donkerblauw(self, render):
        html = render('<c-icon icon="home" color="donkerblauw"/>')
        assert "rvo-icon--donkerblauw" in html


class TestIconAriaLabel:
    """Test aria-label attribute."""

    def test_aria_label_from_prop(self, render):
        html = render('<c-icon icon="home" aria-label="Home"/>')
        assert 'aria-label="Home"' in html

    def test_aria_label_empty_by_default(self, render):
        html = render('<c-icon icon="home"/>')
        # aria-label should be present but empty when not provided
        assert 'aria-label=""' in html


class TestIconGenericAttributes:
    """Test generic attribute passthrough."""

    def test_data_attribute(self, render):
        html = render('<c-icon icon="home" data-testid="icon-1"/>')
        assert 'data-testid="icon-1"' in html

    def test_aria_describedby_attribute(self, render):
        html = render('<c-icon icon="home" aria-describedby="desc"/>')
        assert 'aria-describedby="desc"' in html


class TestIconCustomClass:
    """Test custom class attribute."""

    def test_custom_class_appended(self, render):
        html = render('<c-icon icon="home" class="my-icon"/>')
        assert "my-icon" in html
        assert "utrecht-icon" in html
        assert "rvo-icon" in html


class TestIconUtilityClasses:
    """Test utility class support."""

    def test_margin_utility(self, render):
        html = render('<c-icon icon="home" margin="sm"/>')
        assert "rvo-margin--sm" in html


class TestIconNoContent:
    """Test that icon renders as self-closing (no content)."""

    def test_no_inner_content(self, render):
        html = render('<c-icon icon="home"/>')
        norm = normalize_whitespace(html)
        # The span should be empty
        assert "></span>" in norm or "> </span>" in norm
