"""End-to-end tests for the page component.

Tests the full pipeline: <c-page .../> -> preprocessor -> Jinja2 template -> HTML output.

The page component is special: it renders a full HTML document (<!DOCTYPE html>)
rather than a single element. It wraps the entire page structure including
<html>, <head>, and <body> tags.
"""

import re


def normalize_whitespace(html: str) -> str:
    """Collapse all whitespace sequences to single spaces, strip outer whitespace."""
    return re.sub(r"\s+", " ", html).strip()


class TestPageBasic:
    """Test basic page rendering."""

    def test_renders_doctype(self, render):
        html = render('<c-page title="Test Page"/>')
        assert "<!DOCTYPE html>" in html

    def test_renders_html_element(self, render):
        html = render('<c-page title="Test Page"/>')
        assert "<html" in html
        assert "</html>" in html

    def test_renders_head_element(self, render):
        html = render('<c-page title="Test Page"/>')
        assert "<head>" in html
        assert "</head>" in html

    def test_renders_body_element(self, render):
        html = render('<c-page title="Test Page"/>')
        assert "<body" in html
        assert "</body>" in html

    def test_data_lotc_component_attribute(self, render):
        html = render('<c-page title="Test Page"/>')
        assert 'data-lotc-component="page"' in html

    def test_viewport_meta(self, render):
        html = render('<c-page title="Test Page"/>')
        assert 'name="viewport"' in html
        assert "width=device-width, initial-scale=1.0" in html


class TestPageTitle:
    """Test page title rendering."""

    def test_title_in_head(self, render):
        html = render('<c-page title="My Application"/>')
        assert "<title>My Application</title>" in html

    def test_title_with_special_characters(self, render):
        html = render('<c-page title="Page &amp; More"/>')
        # BeautifulSoup unescapes &amp; to & during preprocessing
        assert "Page &" in html
        assert "<title>" in html


class TestPageLang:
    """Test HTML lang attribute."""

    def test_default_lang_en(self, render):
        html = render('<c-page title="Test"/>')
        assert 'lang="en"' in html

    def test_custom_lang_nl(self, render):
        html = render('<c-page title="Test" lang="nl"/>')
        assert 'lang="nl"' in html

    def test_custom_lang_de(self, render):
        html = render('<c-page title="Test" lang="de"/>')
        assert 'lang="de"' in html


class TestPageCharset:
    """Test charset meta tag."""

    def test_default_charset_utf8(self, render):
        html = render('<c-page title="Test"/>')
        assert 'charset="utf-8"' in html

    def test_custom_charset(self, render):
        html = render('<c-page title="Test" charset="iso-8859-1"/>')
        assert 'charset="iso-8859-1"' in html


class TestPageDescription:
    """Test meta description."""

    def test_no_description_by_default(self, render):
        html = render('<c-page title="Test"/>')
        assert 'name="description"' not in html

    def test_description_meta(self, render):
        html = render('<c-page title="Test" description="About us page"/>')
        assert 'name="description"' in html
        assert 'content="About us page"' in html


class TestPageTheme:
    """Test theme class on body."""

    def test_no_theme_by_default(self, render):
        html = render('<c-page title="Test"/>')
        # Body should not have a class attribute when no theme/body-class/class
        norm = normalize_whitespace(html)
        # Find the <body> tag - it should not have class
        body_match = re.search(r"<body([^>]*)>", norm)
        assert body_match is not None
        assert "-theme" not in body_match.group(1)

    def test_theme_class_on_body(self, render):
        html = render('<c-page title="Test" theme="rvo"/>')
        assert "rvo-theme" in html

    def test_theme_default_class(self, render):
        html = render('<c-page title="Test" theme="default"/>')
        assert "default-theme" in html


class TestPageBodyClass:
    """Test body-class prop."""

    def test_body_class_applied(self, render):
        html = render('<c-page title="Test" body-class="rvo-theme"/>')
        assert "rvo-theme" in html

    def test_body_class_with_theme(self, render):
        html = render('<c-page title="Test" theme="rvo" body-class="extra-class"/>')
        assert "rvo-theme" in html
        assert "extra-class" in html


class TestPageHead:
    """Test additional head content."""

    def test_head_content_injected(self, render):
        html = render(
            '<c-page title="Test" head="&lt;link rel=&quot;icon&quot; href=&quot;/favicon.ico&quot;&gt;"/>'
        )
        assert 'rel="icon"' in html


class TestPageCustomClass:
    """Test custom class attribute."""

    def test_custom_class_on_body(self, render):
        html = render('<c-page title="Test" class="my-page"/>')
        assert "my-page" in html

    def test_custom_class_combined_with_theme(self, render):
        html = render('<c-page title="Test" theme="rvo" class="custom-page"/>')
        assert "rvo-theme" in html
        assert "custom-page" in html


class TestPageContent:
    """Test page body content."""

    def test_content_between_tags(self, render):
        html = render('<c-page title="Test"><h1>Welcome</h1></c-page>')
        assert "<h1>Welcome</h1>" in html

    def test_content_in_body(self, render):
        html = render('<c-page title="Test"><p>Hello world</p></c-page>')
        # Content should be between <body> and </body>
        body_start = html.index("<body")
        body_end = html.index("</body>")
        body_content = html[body_start:body_end]
        assert "Hello world" in body_content

    def test_nested_components(self, render):
        html = render(
            '<c-page title="Test">'
            '<c-heading type="h1" name="Welcome"/>'
            "</c-page>"
        )
        assert "Welcome" in html
        assert "utrecht-heading-1" in html

    def test_multiple_nested_components(self, render):
        html = render(
            '<c-page title="Test">'
            '<c-heading type="h1" name="Title"/>'
            '<c-paragraph name="Some text"/>'
            "</c-page>"
        )
        assert "Title" in html
        assert "Some text" in html
        assert "utrecht-heading-1" in html
        assert "rvo-paragraph" in html

    def test_empty_page(self, render):
        html = render('<c-page title="Empty"/>')
        # Should still render the full document structure
        assert "<!DOCTYPE html>" in html
        assert "<body" in html
        assert "</body>" in html
