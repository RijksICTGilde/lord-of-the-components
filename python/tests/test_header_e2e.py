"""End-to-end tests for the header component.

Tests the full pipeline: <c-header .../> -> preprocessor -> Jinja2 template -> HTML output.
"""

import re


def normalize_whitespace(html: str) -> str:
    """Collapse all whitespace sequences to single spaces, strip outer whitespace."""
    return re.sub(r"\s+", " ", html).strip()


class TestHeaderBasic:
    """Test basic header rendering."""

    def test_renders_header_element(self, render):
        html = render('<c-header text="Test Org"/>')
        norm = normalize_whitespace(html)
        assert "<header" in norm
        assert "</header>" in norm

    def test_base_class(self, render):
        html = render('<c-header text="Test Org"/>')
        assert "rvo-header" in html

    def test_data_lotc_component_attribute(self, render):
        html = render('<c-header text="Test Org"/>')
        assert 'data-lotc-component="header"' in html

    def test_renders_without_props(self, render):
        html = render("<c-header/>")
        assert "rvo-header" in html
        assert "<header" in html


class TestHeaderLogoStructure:
    """Test the logo wrapper, link, and SVG structure."""

    def test_logo_wrapper(self, render):
        html = render('<c-header text="Test"/>')
        assert "rvo-header__logo-wrapper" in html

    def test_logo_link(self, render):
        html = render('<c-header text="Test"/>')
        assert "rvo-header__logo-link" in html
        assert "rvo-link" in html
        assert "rvo-link--no-underline" in html

    def test_logo_div(self, render):
        html = render('<c-header text="Test"/>')
        assert "rvo-logo" in html
        assert "rvo-header__logo-img" in html

    def test_logo_emblem(self, render):
        html = render('<c-header text="Test"/>')
        assert "rvo-logo__emblem" in html

    def test_logo_svg(self, render):
        html = render('<c-header text="Test"/>')
        assert "<svg" in html
        assert "Logo Rijksoverheid" in html

    def test_logo_wordmark(self, render):
        html = render('<c-header text="Test"/>')
        assert "rvo-logo__wordmark" in html


class TestHeaderText:
    """Test the text (organization name) prop."""

    def test_text_rendered(self, render):
        html = render('<c-header text="Rijksorganisatie"/>')
        assert "Rijksorganisatie" in html

    def test_text_in_title_element(self, render):
        html = render('<c-header text="Rijksorganisatie"/>')
        norm = normalize_whitespace(html)
        assert 'class="rvo-logo__title"' in norm
        assert "Rijksorganisatie" in norm

    def test_no_text_no_title_element(self, render):
        html = render("<c-header/>")
        assert "rvo-logo__title" not in html

    def test_text_with_special_chars(self, render):
        html = render('<c-header text="Org &amp; Dept"/>')
        # HTML entities are decoded by the preprocessor
        assert "Org &amp; Dept" in html or "Org & Dept" in html


class TestHeaderSubtitle:
    """Test the subtitle prop."""

    def test_subtitle_rendered(self, render):
        html = render(
            '<c-header text="RVO" subtitle="Ministerie van EZK"/>'
        )
        assert "Ministerie van EZK" in html

    def test_subtitle_in_subtitle_element(self, render):
        html = render(
            '<c-header text="RVO" subtitle="Ministerie van EZK"/>'
        )
        norm = normalize_whitespace(html)
        assert 'class="rvo-logo__subtitle"' in norm
        assert "Ministerie van EZK" in norm

    def test_no_subtitle_no_subtitle_element(self, render):
        html = render('<c-header text="RVO"/>')
        assert "rvo-logo__subtitle" not in html

    def test_text_and_subtitle_together(self, render):
        html = render(
            '<c-header text="RVO" subtitle="Ministerie van EZK"/>'
        )
        assert "rvo-logo__title" in html
        assert "rvo-logo__subtitle" in html
        assert "RVO" in html
        assert "Ministerie van EZK" in html


class TestHeaderLink:
    """Test the link prop."""

    def test_default_link(self, render):
        html = render('<c-header text="Test"/>')
        assert 'href="#"' in html

    def test_custom_link(self, render):
        html = render('<c-header text="Test" link="/home"/>')
        assert 'href="/home"' in html

    def test_link_on_logo_anchor(self, render):
        html = render('<c-header text="Test" link="/about"/>')
        norm = normalize_whitespace(html)
        assert 'href="/about"' in norm
        assert "rvo-header__logo-link" in norm


class TestHeaderClass:
    """Test custom CSS class support."""

    def test_custom_class(self, render):
        html = render('<c-header text="Test" class="my-header"/>')
        assert "rvo-header" in html
        assert "my-header" in html

    def test_multiple_custom_classes(self, render):
        html = render('<c-header text="Test" class="foo bar"/>')
        assert "foo" in html
        assert "bar" in html

    def test_custom_class_does_not_replace_base(self, render):
        html = render('<c-header text="Test" class="custom"/>')
        assert "rvo-header" in html
        assert "custom" in html


class TestHeaderContent:
    """Test content between tags (children)."""

    def test_children_rendered(self, render):
        html = render(
            '<c-header text="Test">Extra navigation content</c-header>'
        )
        assert "Extra navigation content" in html

    def test_children_with_html(self, render):
        html = render(
            '<c-header text="Test"><nav>Navigation</nav></c-header>'
        )
        assert "<nav>Navigation</nav>" in html

    def test_children_after_logo(self, render):
        html = render(
            '<c-header text="Test">My Nav</c-header>'
        )
        norm = normalize_whitespace(html)
        # Logo wrapper should come before children
        logo_pos = norm.index("rvo-header__logo-wrapper")
        nav_pos = norm.index("My Nav")
        assert logo_pos < nav_pos

    def test_no_children_no_extra_content(self, render):
        html = render('<c-header text="Test"/>')
        # Should still have logo but no extra content
        assert "rvo-header__logo-wrapper" in html


class TestHeaderGenericAttributes:
    """Test generic attribute passthrough."""

    def test_data_attribute(self, render):
        html = render('<c-header text="Test" data-testid="main-header"/>')
        assert 'data-testid="main-header"' in html

    def test_aria_attribute(self, render):
        html = render('<c-header text="Test" aria-label="Main header"/>')
        assert 'aria-label="Main header"' in html
