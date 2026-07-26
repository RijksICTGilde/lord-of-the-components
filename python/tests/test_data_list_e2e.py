"""End-to-end tests for the data-list component.

Tests the full pipeline: <c-data-list .../> -> preprocessor -> Jinja2 template -> HTML output.
"""

import re


def normalize_whitespace(html: str) -> str:
    """Collapse all whitespace sequences to single spaces, strip outer whitespace."""
    return re.sub(r"\s+", " ", html).strip()


class TestDataListBasic:
    """Test basic data-list rendering."""

    def test_renders_dl_element(self, render):
        html = render(
            "<c-data-list>"
            '<dt class="rvo-data-list__term">Key</dt>'
            '<dd class="rvo-data-list__description">Value</dd>'
            "</c-data-list>"
        )
        norm = normalize_whitespace(html)
        assert "<dl" in norm
        assert "</dl>" in norm

    def test_base_class(self, render):
        html = render(
            "<c-data-list>"
            '<dt class="rvo-data-list__term">Key</dt>'
            '<dd class="rvo-data-list__description">Value</dd>'
            "</c-data-list>"
        )
        assert "rvo-data-list" in html

    def test_data_lotc_component_attribute(self, render):
        html = render(
            "<c-data-list>"
            '<dt class="rvo-data-list__term">Key</dt>'
            '<dd class="rvo-data-list__description">Value</dd>'
            "</c-data-list>"
        )
        assert 'data-lotc-component="data-list"' in html

    def test_empty_data_list(self, render):
        html = render("<c-data-list></c-data-list>")
        norm = normalize_whitespace(html)
        assert "<dl" in norm
        assert "</dl>" in norm
        assert "rvo-data-list" in html


class TestDataListContent:
    """Test content rendering between tags."""

    def test_single_key_value_pair(self, render):
        html = render(
            "<c-data-list>"
            '<dt class="rvo-data-list__term">Voornaam</dt>'
            '<dd class="rvo-data-list__description">Mees</dd>'
            "</c-data-list>"
        )
        assert "Voornaam" in html
        assert "Mees" in html
        assert "rvo-data-list__term" in html
        assert "rvo-data-list__description" in html

    def test_multiple_key_value_pairs(self, render):
        html = render(
            "<c-data-list>"
            '<dt class="rvo-data-list__term">Voornaam</dt>'
            '<dd class="rvo-data-list__description">Mees</dd>'
            '<dt class="rvo-data-list__term">Achternaam</dt>'
            '<dd class="rvo-data-list__description">de Vos</dd>'
            "</c-data-list>"
        )
        assert "Voornaam" in html
        assert "Mees" in html
        assert "Achternaam" in html
        assert "de Vos" in html

    def test_content_with_html(self, render):
        html = render(
            "<c-data-list>"
            '<dt class="rvo-data-list__term">Status</dt>'
            '<dd class="rvo-data-list__description"><strong>Active</strong></dd>'
            "</c-data-list>"
        )
        assert "<strong>Active</strong>" in html

    def test_content_with_link(self, render):
        html = render(
            "<c-data-list>"
            '<dt class="rvo-data-list__term">Website</dt>'
            '<dd class="rvo-data-list__description">'
            '<a href="https://example.com" class="rvo-link">Example</a>'
            "</dd>"
            "</c-data-list>"
        )
        assert 'href="https://example.com"' in html
        assert "rvo-link" in html
        assert "Example" in html

    def test_plain_text_content(self, render):
        html = render("<c-data-list>Some plain text content</c-data-list>")
        assert "Some plain text content" in html

    def test_three_pairs(self, render):
        html = render(
            "<c-data-list>"
            '<dt class="rvo-data-list__term">Voornaam</dt>'
            '<dd class="rvo-data-list__description">Mees</dd>'
            '<dt class="rvo-data-list__term">Achternaam</dt>'
            '<dd class="rvo-data-list__description">de Vos</dd>'
            '<dt class="rvo-data-list__term">Adres</dt>'
            '<dd class="rvo-data-list__description">Den Haag</dd>'
            "</c-data-list>"
        )
        assert "Voornaam" in html
        assert "Achternaam" in html
        assert "Adres" in html
        assert "Mees" in html
        assert "de Vos" in html
        assert "Den Haag" in html


class TestDataListAttributes:
    """Test HTML attribute rendering."""

    def test_data_attribute_passthrough(self, render):
        html = render(
            '<c-data-list data-testid="dl-1">'
            '<dt class="rvo-data-list__term">Key</dt>'
            '<dd class="rvo-data-list__description">Value</dd>'
            "</c-data-list>"
        )
        assert 'data-testid="dl-1"' in html

    def test_aria_attribute_passthrough(self, render):
        html = render(
            '<c-data-list aria-label="Personal details">'
            '<dt class="rvo-data-list__term">Key</dt>'
            '<dd class="rvo-data-list__description">Value</dd>'
            "</c-data-list>"
        )
        assert 'aria-label="Personal details"' in html

    def test_id_attribute_passthrough(self, render):
        html = render(
            '<c-data-list id="my-data-list">'
            '<dt class="rvo-data-list__term">Key</dt>'
            '<dd class="rvo-data-list__description">Value</dd>'
            "</c-data-list>"
        )
        assert 'id="my-data-list"' in html


class TestDataListCustomClass:
    """Test custom class attribute."""

    def test_custom_class_appended(self, render):
        html = render(
            '<c-data-list class="my-data-list">'
            '<dt class="rvo-data-list__term">Key</dt>'
            '<dd class="rvo-data-list__description">Value</dd>'
            "</c-data-list>"
        )
        assert "my-data-list" in html
        assert "rvo-data-list" in html

    def test_multiple_custom_classes(self, render):
        html = render(
            '<c-data-list class="custom-a custom-b">'
            '<dt class="rvo-data-list__term">Key</dt>'
            '<dd class="rvo-data-list__description">Value</dd>'
            "</c-data-list>"
        )
        assert "custom-a" in html
        assert "custom-b" in html
        assert "rvo-data-list" in html

    def test_custom_class_does_not_replace_base(self, render):
        html = render(
            '<c-data-list class="special">'
            '<dt class="rvo-data-list__term">Key</dt>'
            '<dd class="rvo-data-list__description">Value</dd>'
            "</c-data-list>"
        )
        norm = normalize_whitespace(html)
        assert "rvo-data-list" in norm
        assert "special" in norm


class TestDataListStructure:
    """Test the overall HTML structure."""

    def test_dl_wraps_content(self, render):
        html = render(
            "<c-data-list>"
            '<dt class="rvo-data-list__term">Key</dt>'
            '<dd class="rvo-data-list__description">Value</dd>'
            "</c-data-list>"
        )
        norm = normalize_whitespace(html)
        # dl should wrap dt/dd pairs
        dl_start = norm.find("<dl")
        dl_end = norm.find("</dl>")
        dt_pos = norm.find("<dt")
        dd_pos = norm.find("<dd")
        assert dl_start < dt_pos < dd_pos < dl_end

    def test_no_extra_wrapper_divs(self, render):
        """Data list should not have unnecessary wrapper divs."""
        html = render(
            "<c-data-list>"
            '<dt class="rvo-data-list__term">Key</dt>'
            '<dd class="rvo-data-list__description">Value</dd>'
            "</c-data-list>"
        )
        norm = normalize_whitespace(html)
        # Between <dl and </dl> there should be no <div>
        dl_start = norm.find(">", norm.find("<dl"))
        dl_end = norm.find("</dl>")
        inner = norm[dl_start + 1 : dl_end]
        assert "<div" not in inner


class TestDataListNesting:
    """Test data-list nested within other components."""

    def test_data_list_inside_card(self, render):
        html = render(
            '<c-card title="Details">'
            "<c-data-list>"
            '<dt class="rvo-data-list__term">Name</dt>'
            '<dd class="rvo-data-list__description">Test</dd>'
            "</c-data-list>"
            "</c-card>"
        )
        assert "rvo-card" in html
        assert "rvo-data-list" in html
        assert "Name" in html
        assert "Test" in html

    def test_data_list_inside_layout_flow(self, render):
        html = render(
            '<c-layout-flow gap="md">'
            "<c-data-list>"
            '<dt class="rvo-data-list__term">Key</dt>'
            '<dd class="rvo-data-list__description">Value</dd>'
            "</c-data-list>"
            "</c-layout-flow>"
        )
        assert "rvo-data-list" in html
        assert "Key" in html
        assert "Value" in html

    def test_nested_component_inside_dd(self, render):
        html = render(
            "<c-data-list>"
            '<dt class="rvo-data-list__term">Action</dt>'
            '<dd class="rvo-data-list__description">'
            '<c-button label="Edit"/>'
            "</dd>"
            "</c-data-list>"
        )
        assert "rvo-data-list" in html
        assert "utrecht-button" in html
        assert "Edit" in html


class TestDataListCombined:
    """Test combined scenarios."""

    def test_data_list_with_class_and_attributes(self, render):
        html = render(
            '<c-data-list class="compact" data-testid="info-list" '
            'aria-label="User information">'
            '<dt class="rvo-data-list__term">Email</dt>'
            '<dd class="rvo-data-list__description">user@example.com</dd>'
            '<dt class="rvo-data-list__term">Role</dt>'
            '<dd class="rvo-data-list__description">Administrator</dd>'
            "</c-data-list>"
        )
        assert "rvo-data-list" in html
        assert "compact" in html
        assert 'data-testid="info-list"' in html
        assert 'aria-label="User information"' in html
        assert "Email" in html
        assert "user@example.com" in html
        assert "Role" in html
        assert "Administrator" in html

    def test_multiple_data_lists(self, render):
        html = render(
            "<c-data-list>"
            '<dt class="rvo-data-list__term">First</dt>'
            '<dd class="rvo-data-list__description">A</dd>'
            "</c-data-list>"
            "<c-data-list>"
            '<dt class="rvo-data-list__term">Second</dt>'
            '<dd class="rvo-data-list__description">B</dd>'
            "</c-data-list>"
        )
        assert html.count("rvo-data-list") >= 2
        assert "First" in html
        assert "Second" in html
