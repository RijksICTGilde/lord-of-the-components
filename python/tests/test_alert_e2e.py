"""End-to-end tests for the alert component.

Tests the full pipeline: <c-alert .../> -> preprocessor -> Jinja2 template -> HTML output.
"""

import re


def normalize_whitespace(html: str) -> str:
    """Collapse all whitespace sequences to single spaces, strip outer whitespace."""
    return re.sub(r"\s+", " ", html).strip()


class TestAlertBasic:
    """Test basic alert rendering."""

    def test_renders_div_element(self, render):
        html = render('<c-alert type="info">Some info</c-alert>')
        norm = normalize_whitespace(html)
        assert "<div" in norm
        assert "</div>" in norm

    def test_base_class(self, render):
        html = render('<c-alert type="info">Info</c-alert>')
        assert "rvo-alert" in html

    def test_data_lotc_component_attribute(self, render):
        html = render('<c-alert type="info">Info</c-alert>')
        assert 'data-lotc-component="alert"' in html

    def test_content_between_tags(self, render):
        html = render("<c-alert>Some alert content</c-alert>")
        assert "Some alert content" in html

    def test_content_with_html(self, render):
        html = render("<c-alert>Alert with <em>emphasis</em></c-alert>")
        assert "<em>emphasis</em>" in html


class TestAlertType:
    """Test alert type/kind variants."""

    def test_default_type_info(self, render):
        html = render("<c-alert>Test</c-alert>")
        assert "rvo-alert--info" in html

    def test_type_info(self, render):
        html = render('<c-alert type="info">Test</c-alert>')
        assert "rvo-alert--info" in html

    def test_type_success(self, render):
        html = render('<c-alert type="success">Test</c-alert>')
        assert "rvo-alert--success" in html

    def test_type_warning(self, render):
        html = render('<c-alert type="warning">Test</c-alert>')
        assert "rvo-alert--warning" in html

    def test_type_error(self, render):
        html = render('<c-alert type="error">Test</c-alert>')
        assert "rvo-alert--error" in html

    def test_info_does_not_have_other_types(self, render):
        html = render('<c-alert type="info">Test</c-alert>')
        assert "rvo-alert--info" in html
        assert "rvo-alert--success" not in html
        assert "rvo-alert--warning" not in html
        assert "rvo-alert--error" not in html

    def test_error_does_not_have_other_types(self, render):
        html = render('<c-alert type="error">Test</c-alert>')
        assert "rvo-alert--error" in html
        assert "rvo-alert--info" not in html
        assert "rvo-alert--success" not in html
        assert "rvo-alert--warning" not in html


class TestAlertStatusIcon:
    """Test status icon rendering per type."""

    def test_info_icon(self, render):
        html = render('<c-alert type="info">Test</c-alert>')
        assert "rvo-icon-info" in html
        assert "rvo-status-icon-info" in html

    def test_warning_icon_dutch_name(self, render):
        html = render('<c-alert type="warning">Test</c-alert>')
        assert "rvo-icon-waarschuwing" in html
        assert "rvo-status-icon-waarschuwing" in html

    def test_error_icon_dutch_name(self, render):
        html = render('<c-alert type="error">Test</c-alert>')
        assert "rvo-icon-foutmelding" in html
        assert "rvo-status-icon-foutmelding" in html

    def test_success_icon_dutch_name(self, render):
        html = render('<c-alert type="success">Test</c-alert>')
        assert "rvo-icon-bevestiging" in html
        assert "rvo-status-icon-bevestiging" in html

    def test_icon_has_role_img(self, render):
        html = render('<c-alert type="info">Test</c-alert>')
        assert 'role="img"' in html

    def test_icon_has_aria_label(self, render):
        html = render('<c-alert type="info">Test</c-alert>')
        assert 'aria-label="Info"' in html

    def test_icon_size_xl(self, render):
        html = render('<c-alert type="info">Test</c-alert>')
        assert "rvo-icon--xl" in html

    def test_icon_utrecht_class(self, render):
        html = render('<c-alert type="info">Test</c-alert>')
        assert "utrecht-icon" in html


class TestAlertHeading:
    """Test heading rendering."""

    def test_heading_renders_strong(self, render):
        html = render('<c-alert heading="Important notice">Content</c-alert>')
        assert "<strong>Important notice</strong>" in html

    def test_no_heading_by_default(self, render):
        html = render("<c-alert>Content only</c-alert>")
        assert "<strong>" not in html

    def test_heading_with_content(self, render):
        html = render(
            '<c-alert heading="Title">Body text</c-alert>'
        )
        assert "<strong>Title</strong>" in html
        assert "Body text" in html


class TestAlertPadding:
    """Test padding variants."""

    def test_default_padding_md(self, render):
        html = render("<c-alert>Test</c-alert>")
        assert "rvo-alert--padding-md" in html

    def test_padding_xs(self, render):
        html = render('<c-alert padding="xs">Test</c-alert>')
        assert "rvo-alert--padding-xs" in html

    def test_padding_sm(self, render):
        html = render('<c-alert padding="sm">Test</c-alert>')
        assert "rvo-alert--padding-sm" in html

    def test_padding_md(self, render):
        html = render('<c-alert padding="md">Test</c-alert>')
        assert "rvo-alert--padding-md" in html

    def test_padding_lg(self, render):
        html = render('<c-alert padding="lg">Test</c-alert>')
        assert "rvo-alert--padding-lg" in html

    def test_padding_xl(self, render):
        html = render('<c-alert padding="xl">Test</c-alert>')
        assert "rvo-alert--padding-xl" in html

    def test_padding_2xl(self, render):
        html = render('<c-alert padding="2xl">Test</c-alert>')
        assert "rvo-alert--padding-2xl" in html

    def test_xs_does_not_have_other_paddings(self, render):
        html = render('<c-alert padding="xs">Test</c-alert>')
        assert "rvo-alert--padding-xs" in html
        assert "rvo-alert--padding-md" not in html
        assert "rvo-alert--padding-lg" not in html


class TestAlertMaxWidth:
    """Test max-width constraint."""

    def test_no_max_width_by_default(self, render):
        html = render("<c-alert>Test</c-alert>")
        assert "rvo-alert--layout" not in html
        assert "rvo-max-width-layout" not in html

    def test_max_width_sm(self, render):
        html = render('<c-alert max-width="sm">Test</c-alert>')
        assert "rvo-alert--layout" in html
        assert "rvo-max-width-layout--sm" in html

    def test_max_width_md(self, render):
        html = render('<c-alert max-width="md">Test</c-alert>')
        assert "rvo-alert--layout" in html
        assert "rvo-max-width-layout--md" in html

    def test_max_width_lg(self, render):
        html = render('<c-alert max-width="lg">Test</c-alert>')
        assert "rvo-alert--layout" in html
        assert "rvo-max-width-layout--lg" in html

    def test_max_width_on_container(self, render):
        """Max-width class should be on the inner container, not the outer div."""
        html = render('<c-alert max-width="md">Test</c-alert>')
        norm = normalize_whitespace(html)
        # The container div should have the max-width class
        assert "rvo-alert__container rvo-max-width-layout--md" in norm


class TestAlertClosable:
    """Test closable button rendering."""

    def test_no_close_button_by_default(self, render):
        html = render("<c-alert>Test</c-alert>")
        assert "rvo-button__close" not in html

    def test_closable_renders_close_button(self, render):
        html = render("<c-alert closable>Test</c-alert>")
        assert "rvo-button__close" in html

    def test_close_button_is_subtle(self, render):
        html = render("<c-alert closable>Test</c-alert>")
        assert "utrecht-button--subtle" in html

    def test_close_button_aria_label(self, render):
        html = render("<c-alert closable>Test</c-alert>")
        assert 'aria-label="Sluiten"' in html

    def test_close_button_has_kruis_icon(self, render):
        html = render("<c-alert closable>Test</c-alert>")
        assert "rvo-icon-kruis" in html


class TestAlertStructure:
    """Test the overall HTML structure."""

    def test_container_div(self, render):
        html = render("<c-alert>Test</c-alert>")
        assert "rvo-alert__container" in html

    def test_alert_text_section(self, render):
        html = render("<c-alert>Test</c-alert>")
        assert "rvo-alert-text" in html

    def test_content_inside_text_div(self, render):
        html = render("<c-alert>Alert content here</c-alert>")
        norm = normalize_whitespace(html)
        # Content should be wrapped in a div inside rvo-alert-text
        assert "rvo-alert-text" in norm
        assert "Alert content here" in norm


class TestAlertAttributes:
    """Test HTML attribute rendering."""

    def test_data_attribute_passthrough(self, render):
        html = render('<c-alert data-testid="alert-1">Test</c-alert>')
        assert 'data-testid="alert-1"' in html

    def test_aria_attribute_passthrough(self, render):
        html = render('<c-alert aria-describedby="desc">Test</c-alert>')
        assert 'aria-describedby="desc"' in html


class TestAlertCustomClass:
    """Test custom class attribute."""

    def test_custom_class_appended(self, render):
        html = render('<c-alert class="my-alert">Test</c-alert>')
        assert "my-alert" in html
        assert "rvo-alert" in html


class TestAlertCombined:
    """Test combined prop scenarios."""

    def test_full_alert(self, render):
        html = render(
            '<c-alert type="error" heading="Something went wrong" '
            'padding="lg" closable>Please try again later.</c-alert>'
        )
        assert "rvo-alert--error" in html
        assert "rvo-alert--padding-lg" in html
        assert "<strong>Something went wrong</strong>" in html
        assert "Please try again later." in html
        assert "rvo-button__close" in html
        assert "rvo-icon-foutmelding" in html

    def test_success_with_max_width(self, render):
        html = render(
            '<c-alert type="success" heading="Done!" '
            'max-width="md">Operation completed.</c-alert>'
        )
        assert "rvo-alert--success" in html
        assert "rvo-alert--layout" in html
        assert "rvo-max-width-layout--md" in html
        assert "<strong>Done!</strong>" in html
        assert "rvo-icon-bevestiging" in html
