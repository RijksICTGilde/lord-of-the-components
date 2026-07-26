"""End-to-end tests for the link component.

Tests the full pipeline: <c-link .../> -> preprocessor -> Jinja2 template -> HTML output.
"""

import re


def normalize_whitespace(html: str) -> str:
    """Collapse all whitespace sequences to single spaces, strip outer whitespace."""
    return re.sub(r"\s+", " ", html).strip()


class TestLinkBasic:
    """Test basic link rendering."""

    def test_renders_a_element(self, render):
        html = render('<c-link href="/page" label="Click here"/>')
        norm = normalize_whitespace(html)
        assert "<a" in norm
        assert "</a>" in norm

    def test_base_class(self, render):
        html = render('<c-link href="/page" label="Click"/>')
        assert "rvo-link" in html

    def test_name_prop_renders_text(self, render):
        html = render('<c-link href="/page" label="Go to page"/>')
        assert "Go to page" in html

    def test_href_attribute(self, render):
        html = render('<c-link href="https://example.com" label="Link"/>')
        assert 'href="https://example.com"' in html

    def test_data_lotc_component_attribute(self, render):
        html = render('<c-link href="/page" label="Link"/>')
        assert 'data-lotc-component="link"' in html

    def test_content_between_tags_overrides_name(self, render):
        html = render('<c-link href="/page" label="Fallback">Custom text</c-link>')
        assert "Custom text" in html

    def test_content_with_html(self, render):
        html = render(
            '<c-link href="/page">Click <strong>here</strong></c-link>'
        )
        assert "<strong>here</strong>" in html


class TestLinkColor:
    """Test link color variants."""

    def test_default_color_no_extra_class(self, render):
        """hemelblauw is default and doesn't get an explicit color class."""
        html = render('<c-link href="#" label="Link"/>')
        assert "rvo-link--donkerblauw" not in html
        assert "rvo-link--lintblauw" not in html

    def test_color_donkerblauw(self, render):
        html = render('<c-link href="#" color="donkerblauw" label="Link"/>')
        assert "rvo-link--donkerblauw" in html

    def test_color_lintblauw(self, render):
        html = render('<c-link href="#" color="lintblauw" label="Link"/>')
        assert "rvo-link--lintblauw" in html

    def test_color_wit(self, render):
        html = render('<c-link href="#" color="wit" label="Link"/>')
        assert "rvo-link--wit" in html

    def test_color_zwart(self, render):
        html = render('<c-link href="#" color="zwart" label="Link"/>')
        assert "rvo-link--zwart" in html

    def test_color_grijs_700(self, render):
        html = render('<c-link href="#" color="grijs-700" label="Link"/>')
        assert "rvo-link--grijs-700" in html


class TestLinkWeight:
    """Test link weight variants."""

    def test_default_weight_bold_no_extra_class(self, render):
        """bold is default and doesn't get an explicit weight class."""
        html = render('<c-link href="#" label="Link"/>')
        assert "rvo-link--normal" not in html

    def test_weight_normal(self, render):
        html = render('<c-link href="#" weight="normal" label="Link"/>')
        assert "rvo-link--normal" in html


class TestLinkStates:
    """Test link state classes."""

    def test_active(self, render):
        html = render('<c-link href="#" active label="Link"/>')
        assert "rvo-link--active" in html

    def test_hover(self, render):
        html = render('<c-link href="#" hover label="Link"/>')
        assert "rvo-link--hover" in html

    def test_focus(self, render):
        html = render('<c-link href="#" focus label="Link"/>')
        assert "rvo-link--focus" in html

    def test_no_states_by_default(self, render):
        html = render('<c-link href="#" label="Link"/>')
        assert "rvo-link--active" not in html
        assert "rvo-link--hover" not in html
        assert "rvo-link--focus" not in html


class TestLinkNoUnderline:
    """Test no-underline boolean prop."""

    def test_no_underline(self, render):
        html = render('<c-link href="#" no-underline label="Link"/>')
        assert "rvo-link--no-underline" in html

    def test_no_underline_not_present_by_default(self, render):
        html = render('<c-link href="#" label="Link"/>')
        assert "rvo-link--no-underline" not in html


class TestLinkFullContainerLink:
    """Test full-container-link boolean prop."""

    def test_full_container_link(self, render):
        html = render('<c-link href="#" full-container-link label="Link"/>')
        assert "rvo-link--full-card-link" in html


class TestLinkIcon:
    """Test icon before/after."""

    def test_icon_before(self, render):
        html = render(
            '<c-link href="#" show-icon="before" icon="home" label="Home"/>'
        )
        norm = normalize_whitespace(html)
        assert "rvo-link--with-icon" in norm
        assert "rvo-icon-home" in norm
        assert "rvo-link__icon--before" in norm

    def test_icon_after(self, render):
        html = render(
            '<c-link href="#" show-icon="after" icon="chevron-right" label="Next"/>'
        )
        norm = normalize_whitespace(html)
        assert "rvo-link--with-icon" in norm
        assert "rvo-icon-chevron-right" in norm
        assert "rvo-link__icon--after" in norm

    def test_no_icon_by_default(self, render):
        html = render('<c-link href="#" label="Link"/>')
        assert "rvo-link--with-icon" not in html
        assert "rvo-link__icon--before" not in html
        assert "rvo-link__icon--after" not in html


class TestLinkTarget:
    """Test target attribute."""

    def test_target_blank(self, render):
        html = render('<c-link href="#" target="_blank" label="Link"/>')
        assert 'target="_blank"' in html

    def test_no_target_by_default(self, render):
        html = render('<c-link href="#" label="Link"/>')
        assert "target=" not in html


class TestLinkRole:
    """Test role attribute."""

    def test_role_button(self, render):
        html = render('<c-link href="#" role="button" label="Link"/>')
        assert 'role="button"' in html


class TestLinkAttributes:
    """Test HTML attribute rendering."""

    def test_data_attribute_passthrough(self, render):
        html = render('<c-link href="#" data-testid="link-1" label="Link"/>')
        assert 'data-testid="link-1"' in html

    def test_click_event(self, render):
        html = render('<c-link href="#" @click="handleClick()" label="Link"/>')
        assert 'onclick="handleClick()"' in html


class TestLinkCustomClass:
    """Test custom class attribute."""

    def test_custom_class_appended(self, render):
        html = render('<c-link href="#" class="my-link" label="Link"/>')
        assert "my-link" in html
        assert "rvo-link" in html
