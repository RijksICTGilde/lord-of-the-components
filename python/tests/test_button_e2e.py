"""End-to-end tests for the button component.

Tests the full pipeline: <c-button .../> -> preprocessor -> Jinja2 template -> HTML output.
"""

import re


def normalize_whitespace(html: str) -> str:
    """Collapse all whitespace sequences to single spaces, strip outer whitespace."""
    return re.sub(r"\s+", " ", html).strip()


class TestButtonTypeVariants:
    """Test all type/variant CSS class mappings."""

    def test_primary_button(self, render):
        html = render('<c-button type="primary" name="Click"/>').strip()
        assert "utrecht-button--primary-action" in html
        assert "Click" in html
        assert "</button>" in html

    def test_secondary_button(self, render):
        html = render('<c-button type="secondary" name="Click"/>')
        assert "utrecht-button--secondary-action" in html

    def test_tertiary_button(self, render):
        html = render('<c-button type="tertiary" name="Click"/>')
        assert "utrecht-button--rvo-tertiary-action" in html

    def test_quaternary_button(self, render):
        html = render('<c-button type="quaternary" name="Click"/>')
        assert "utrecht-button--rvo-quaternary-action" in html

    def test_subtle_button(self, render):
        html = render('<c-button type="subtle" name="Click"/>')
        assert "utrecht-button--subtle" in html

    def test_warning_button(self, render):
        html = render('<c-button type="warning" name="Click"/>')
        assert "utrecht-button--primary-action" in html
        assert "utrecht-button--warning" in html

    def test_warning_subtle_button(self, render):
        html = render('<c-button type="warning-subtle" name="Click"/>')
        assert "utrecht-button--subtle" in html
        assert "utrecht-button--warning" in html

    def test_default_type_is_primary(self, render):
        html = render('<c-button name="Click"/>')
        assert "utrecht-button--primary-action" in html


class TestButtonSizeVariants:
    """Test size CSS class mappings."""

    def test_size_xs(self, render):
        html = render('<c-button size="xs" name="Click"/>')
        assert "utrecht-button--rvo-xs" in html

    def test_size_sm(self, render):
        html = render('<c-button size="sm" name="Click"/>')
        assert "utrecht-button--rvo-sm" in html

    def test_size_md(self, render):
        html = render('<c-button size="md" name="Click"/>')
        assert "utrecht-button--rvo-md" in html

    def test_default_size_is_md(self, render):
        html = render('<c-button name="Click"/>')
        assert "utrecht-button--rvo-md" in html


class TestButtonBooleanProps:
    """Test boolean prop behavior."""

    def test_disabled_button(self, render):
        html = render('<c-button disabled name="Click"/>')
        norm = normalize_whitespace(html)
        assert "disabled" in norm
        # disabled should be an HTML attribute, not a class
        assert "utrecht-button--disabled" not in html

    def test_active_button(self, render):
        html = render('<c-button active name="Click"/>')
        assert "utrecht-button--active" in html

    def test_loading_button(self, render):
        html = render('<c-button loading name="Click"/>')
        assert "utrecht-button--busy" in html

    def test_full_width_button(self, render):
        html = render('<c-button full-width name="Click"/>')
        assert "utrecht-button--rvo-full-width" in html


class TestButtonIconPositions:
    """Test icon position rendering."""

    def test_icon_before(self, render):
        html = render('<c-button show-icon="before" icon="delta-naar-rechts" name="Go"/>')
        assert "utrecht-button--icon-before" in html
        assert "rvo-icon-delta-naar-rechts" in html
        # Icon span should come before the label
        norm = normalize_whitespace(html)
        icon_pos = norm.find("rvo-icon-delta-naar-rechts")
        label_pos = norm.find("Go")
        assert icon_pos < label_pos

    def test_icon_after(self, render):
        html = render('<c-button show-icon="after" icon="delta-naar-rechts" name="Go"/>')
        assert "utrecht-button--icon-after" in html
        assert "rvo-icon-delta-naar-rechts" in html
        # Icon span should come after the label
        norm = normalize_whitespace(html)
        icon_pos = norm.find("rvo-icon-delta-naar-rechts")
        label_pos = norm.find("Go")
        assert icon_pos > label_pos

    def test_no_icon_by_default(self, render):
        html = render('<c-button name="Click"/>')
        assert "utrecht-button--icon-before" not in html
        assert "utrecht-button--icon-after" not in html


class TestButtonContent:
    """Test content handling (name prop vs content between tags)."""

    def test_name_prop_renders_as_label(self, render):
        html = render('<c-button name="Submit"/>')
        assert "Submit" in html

    def test_content_between_tags_overrides_name(self, render):
        html = render('<c-button name="Fallback">Custom Label</c-button>')
        assert "Custom Label" in html

    def test_content_with_html(self, render):
        html = render('<c-button><strong>Bold</strong> text</c-button>')
        assert "<strong>Bold</strong>" in html


class TestButtonHtmlAttributes:
    """Test HTML attribute rendering."""

    def test_html_type_attribute(self, render):
        html = render('<c-button html-type="submit" name="Go"/>')
        assert 'type="submit"' in html

    def test_default_html_type_is_button(self, render):
        html = render('<c-button name="Click"/>')
        assert 'type="button"' in html

    def test_base_class_always_present(self, render):
        html = render('<c-button name="Click"/>')
        assert "utrecht-button" in html

    def test_data_lotc_component_attribute(self, render):
        html = render('<c-button name="Click"/>')
        assert 'data-lotc-component="button"' in html


class TestButtonEvents:
    """Test event attribute passthrough."""

    def test_click_event(self, render):
        html = render('<c-button @click="handleClick()" name="Click"/>')
        assert 'onclick="handleClick()"' in html


class TestButtonGenericAttributes:
    """Test data-* and aria-* passthrough."""

    def test_data_attribute(self, render):
        html = render('<c-button data-testid="btn-1" name="Click"/>')
        assert 'data-testid="btn-1"' in html

    def test_aria_attribute(self, render):
        html = render('<c-button aria-label="Close dialog" name="X"/>')
        assert 'aria-label="Close dialog"' in html


class TestButtonUtilityClasses:
    """Test utility class integration (text-style, margin, padding)."""

    def test_text_style_utility(self, render):
        html = render('<c-button text-style="bold" name="Click"/>')
        assert "rvo-text--bold" in html

    def test_margin_utility(self, render):
        html = render('<c-button margin="md" name="Click"/>')
        assert "rvo-margin--md" in html

    def test_padding_utility(self, render):
        html = render('<c-button padding="lg" name="Click"/>')
        assert "rvo-padding--lg" in html


class TestButtonCustomClass:
    """Test custom class attribute."""

    def test_custom_class_appended(self, render):
        html = render('<c-button class="my-custom" name="Click"/>')
        assert "my-custom" in html
        # Base class should also be present
        assert "utrecht-button" in html
