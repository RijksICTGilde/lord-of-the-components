"""End-to-end tests for the footer component.

Tests the full pipeline: <c-footer .../> -> preprocessor -> Jinja2 template -> HTML output.
"""

import re


def normalize_whitespace(html: str) -> str:
    """Collapse all whitespace sequences to single spaces, strip outer whitespace."""
    return re.sub(r"\s+", " ", html).strip()


class TestFooterBasic:
    """Test basic footer rendering."""

    def test_renders_footer_element(self, render):
        html = render("<c-footer>Content</c-footer>")
        norm = normalize_whitespace(html)
        assert "<footer" in norm
        assert "</footer>" in norm

    def test_base_class(self, render):
        html = render("<c-footer>Content</c-footer>")
        assert "rvo-footer" in html

    def test_data_lotc_component_attribute(self, render):
        html = render("<c-footer>Content</c-footer>")
        assert 'data-lotc-component="footer"' in html

    def test_renders_without_content(self, render):
        html = render("<c-footer/>")
        assert "rvo-footer" in html
        assert "<footer" in html


class TestFooterContainer:
    """Test footer container structure."""

    def test_has_container(self, render):
        html = render("<c-footer>Content</c-footer>")
        assert "rvo-footer__container" in html

    def test_container_is_div(self, render):
        html = render("<c-footer>Content</c-footer>")
        norm = normalize_whitespace(html)
        # Container should be a div inside the footer
        assert '<div class="rvo-footer__container">' in norm


class TestFooterMaxWidth:
    """Test footer max-width prop."""

    def test_max_width_sm(self, render):
        html = render('<c-footer max-width="sm">Content</c-footer>')
        assert "rvo-footer__container--sm" in html

    def test_max_width_md(self, render):
        html = render('<c-footer max-width="md">Content</c-footer>')
        assert "rvo-footer__container--md" in html

    def test_max_width_lg(self, render):
        html = render('<c-footer max-width="lg">Content</c-footer>')
        assert "rvo-footer__container--lg" in html

    def test_no_max_width_no_modifier(self, render):
        html = render("<c-footer>Content</c-footer>")
        assert "rvo-footer__container--sm" not in html
        assert "rvo-footer__container--md" not in html
        assert "rvo-footer__container--lg" not in html

    def test_max_width_on_container(self, render):
        html = render('<c-footer max-width="md">Content</c-footer>')
        norm = normalize_whitespace(html)
        assert "rvo-footer__container rvo-footer__container--md" in norm


class TestFooterPayOff:
    """Test footer pay-off prop."""

    def test_pay_off_rendered(self, render):
        html = render('<c-footer pay-off="© 2024 My Org">Content</c-footer>')
        # HTML entity gets decoded by preprocessor
        assert "2024 My Org" in html

    def test_pay_off_in_payoff_div(self, render):
        html = render('<c-footer pay-off="My Payoff">Content</c-footer>')
        assert "rvo-footer__payoff" in html
        assert "My Payoff" in html

    def test_no_pay_off_no_payoff_div(self, render):
        html = render("<c-footer>Content</c-footer>")
        assert "rvo-footer__payoff" not in html

    def test_pay_off_after_content(self, render):
        html = render(
            '<c-footer pay-off="Bottom text">Main content</c-footer>'
        )
        norm = normalize_whitespace(html)
        content_pos = norm.index("Main content")
        payoff_pos = norm.index("Bottom text")
        assert content_pos < payoff_pos


class TestFooterContent:
    """Test content between tags (children)."""

    def test_children_rendered(self, render):
        html = render("<c-footer>Footer links here</c-footer>")
        assert "Footer links here" in html

    def test_children_with_html(self, render):
        html = render(
            "<c-footer><ul><li>Link 1</li><li>Link 2</li></ul></c-footer>"
        )
        assert "<ul>" in html
        assert "<li>Link 1</li>" in html

    def test_children_inside_container(self, render):
        html = render("<c-footer>My content</c-footer>")
        norm = normalize_whitespace(html)
        container_start = norm.index("rvo-footer__container")
        content_pos = norm.index("My content")
        footer_end = norm.rindex("</footer>")
        assert container_start < content_pos < footer_end


class TestFooterClass:
    """Test custom CSS class support."""

    def test_custom_class(self, render):
        html = render('<c-footer class="my-footer">Content</c-footer>')
        assert "rvo-footer" in html
        assert "my-footer" in html

    def test_multiple_custom_classes(self, render):
        html = render('<c-footer class="foo bar">Content</c-footer>')
        assert "foo" in html
        assert "bar" in html

    def test_custom_class_on_footer_not_container(self, render):
        html = render('<c-footer class="custom">Content</c-footer>')
        norm = normalize_whitespace(html)
        # Custom class should be on the footer element, not the container
        assert 'rvo-footer custom"' in norm or 'custom rvo-footer' in norm or \
               '<footer class="rvo-footer custom"' in norm


class TestFooterGenericAttributes:
    """Test generic attribute passthrough."""

    def test_data_attribute(self, render):
        html = render(
            '<c-footer data-testid="main-footer">Content</c-footer>'
        )
        assert 'data-testid="main-footer"' in html

    def test_aria_attribute(self, render):
        html = render(
            '<c-footer aria-label="Site footer">Content</c-footer>'
        )
        assert 'aria-label="Site footer"' in html


class TestFooterCombined:
    """Test combined usage."""

    def test_full_footer(self, render):
        html = render(
            '<c-footer max-width="md" pay-off="My Org" class="dark-footer">'
            "<p>Footer content</p>"
            "</c-footer>"
        )
        norm = normalize_whitespace(html)
        assert "rvo-footer" in norm
        assert "dark-footer" in norm
        assert "rvo-footer__container--md" in norm
        assert "Footer content" in norm
        assert "My Org" in norm
        assert "rvo-footer__payoff" in norm
