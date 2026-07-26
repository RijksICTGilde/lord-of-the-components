"""End-to-end tests for the label component.

Tests the full pipeline: <c-label .../> -> preprocessor -> Jinja2 template -> HTML output.
"""

import re


def normalize_whitespace(html: str) -> str:
    """Collapse all whitespace sequences to single spaces, strip outer whitespace."""
    return re.sub(r"\s+", " ", html).strip()


class TestLabelBasic:
    """Test basic label rendering."""

    def test_renders_label_element(self, render):
        html = render('<c-label label="Email"/>')
        norm = normalize_whitespace(html)
        assert "<label" in norm
        assert "</label>" in norm

    def test_base_class(self, render):
        html = render('<c-label label="Email"/>')
        assert "rvo-label" in html

    def test_name_prop_renders_text(self, render):
        html = render('<c-label label="Email address"/>')
        assert "Email address" in html

    def test_data_lotc_component_attribute(self, render):
        html = render('<c-label label="Test"/>')
        assert 'data-lotc-component="label"' in html

    def test_content_between_tags_overrides_name(self, render):
        html = render('<c-label label="Fallback">Custom label</c-label>')
        assert "Custom label" in html

    def test_content_with_html(self, render):
        html = render("<c-label>Name <em>(required)</em></c-label>")
        assert "<em>(required)</em>" in html


class TestLabelSize:
    """Test label size variants."""

    def test_default_size_no_sm_class(self, render):
        """md is default and doesn't get an explicit sm class."""
        html = render('<c-label label="Email"/>')
        assert "rvo-label--sm" not in html

    def test_size_sm(self, render):
        html = render('<c-label size="sm" label="Email"/>')
        assert "rvo-label--sm" in html


class TestLabelType:
    """Test label type variants."""

    def test_default_type_no_extra_class(self, render):
        html = render('<c-label label="Email"/>')
        assert "rvo-label--optional" not in html
        assert "rvo-label--required" not in html

    def test_type_optional(self, render):
        html = render('<c-label type="optional" label="Nickname"/>')
        assert "rvo-label--optional" in html

    def test_type_required(self, render):
        html = render('<c-label type="required" label="Email"/>')
        assert "rvo-label--required" in html


class TestLabelAttributes:
    """Test HTML attribute rendering."""

    def test_id_attribute(self, render):
        html = render('<c-label id="email-label" label="Email"/>')
        assert 'id="email-label"' in html

    def test_for_attribute(self, render):
        html = render('<c-label for="email-input" label="Email"/>')
        assert 'for="email-input"' in html

    def test_no_id_when_not_set(self, render):
        html = render('<c-label label="Email"/>')
        # id should not be present (or empty)
        norm = normalize_whitespace(html)
        assert 'id=""' not in norm or "id=" not in norm

    def test_data_attribute_passthrough(self, render):
        html = render('<c-label data-testid="label-1" label="Email"/>')
        assert 'data-testid="label-1"' in html


class TestLabelCustomClass:
    """Test custom class attribute."""

    def test_custom_class_appended(self, render):
        html = render('<c-label class="my-label" label="Email"/>')
        assert "my-label" in html
        assert "rvo-label" in html


class TestLabelUtilityClasses:
    """Test utility class support."""

    def test_margin_utility(self, render):
        html = render('<c-label margin="sm" label="Email"/>')
        assert "rvo-margin--sm" in html
