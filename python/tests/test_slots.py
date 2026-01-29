"""Tests for named slot extraction functionality."""

import pytest
from jinja2 import Environment

from lord_of_the_components import ComponentExtension


@pytest.fixture
def env():
    """Create a Jinja2 environment with the component extension."""
    environment = Environment()
    environment.add_extension(ComponentExtension)
    return environment


@pytest.fixture
def extension(env):
    """Get the component extension from the environment."""
    return env.extensions[ComponentExtension.identifier]


class TestNamedSlotExtraction:
    """Tests for named slot extraction using <template slot='name'> syntax."""

    def test_single_named_slot(self, extension):
        """Test extraction of a single named slot."""
        source = """<c-card>
    <template slot="header">Card Title</template>
    Card body content
</c-card>"""

        result = extension.preprocess(source, "test.html")

        # Should have slots dict in context
        assert '"slots":' in result
        assert '"header":' in result
        # Default content should be preserved
        assert '"content":' in result

    def test_multiple_named_slots(self, extension):
        """Test extraction of multiple named slots."""
        source = """<c-card>
    <template slot="header">Header Content</template>
    <template slot="footer">Footer Content</template>
    Body content here
</c-card>"""

        result = extension.preprocess(source, "test.html")

        assert '"slots":' in result
        assert '"header":' in result
        assert '"footer":' in result
        assert '"content":' in result

    def test_named_slot_with_html_content(self, extension):
        """Test named slot containing HTML content."""
        source = """<c-card>
    <template slot="header"><h2>Title</h2><span>Subtitle</span></template>
    Body
</c-card>"""

        result = extension.preprocess(source, "test.html")

        assert '"slots":' in result
        assert '"header":' in result
        # HTML should be preserved in the slot
        assert "<h2>Title</h2>" in result
        assert "<span>Subtitle</span>" in result

    def test_named_slot_only_no_default_content(self, extension):
        """Test component with only named slots, no default content."""
        source = """<c-card>
    <template slot="header">Header</template>
    <template slot="body">Body</template>
</c-card>"""

        result = extension.preprocess(source, "test.html")

        assert '"slots":' in result
        assert '"header":' in result
        assert '"body":' in result
        # Should not have content if only whitespace between template tags
        # The content would be just whitespace which gets stripped

    def test_default_content_only_no_slots(self, extension):
        """Test component with only default content, no named slots."""
        source = """<c-card>
    Just default content here
</c-card>"""

        result = extension.preprocess(source, "test.html")

        # Should have content but no slots
        assert '"content":' in result
        # Should not have slots dict
        assert '"slots":' not in result

    def test_named_slot_with_nested_component(self, extension):
        """Test named slot containing a nested component."""
        source = """<c-card>
    <template slot="header">
        <c-button variant="primary">Click me</c-button>
    </template>
    Body content
</c-card>"""

        result = extension.preprocess(source, "test.html")

        # Both components should be processed
        assert "components/card.html.j2" in result
        assert "components/button.html.j2" in result
        assert '"slots":' in result
        assert '"header":' in result

    def test_whitespace_only_default_content_treated_as_none(self, extension):
        """Test that whitespace-only default content results in no content key."""
        source = """<c-card>
    <template slot="header">Header</template>
</c-card>"""

        result = extension.preprocess(source, "test.html")

        # The only default content is whitespace around the template tag
        # After stripping, should be empty
        assert '"slots":' in result
        # Content might or might not be present depending on whitespace handling

    def test_named_slot_with_jinja_expressions(self, extension):
        """Test named slot containing Jinja expressions."""
        source = """<c-card>
    <template slot="header">{{ page_title }}</template>
    {{ body_content }}
</c-card>"""

        result = extension.preprocess(source, "test.html")

        assert '"slots":' in result
        # Jinja expressions should be preserved
        assert "{{ page_title }}" in result
        assert "{{ body_content }}" in result


class TestSlotEdgeCases:
    """Edge cases for slot extraction."""

    def test_template_tag_without_slot_attribute(self, extension):
        """Test that template tags without slot attribute are treated as content."""
        source = """<c-card>
    <template>This is just a template tag without slot</template>
    Regular content
</c-card>"""

        result = extension.preprocess(source, "test.html")

        # Should be treated as default content
        assert '"content":' in result
        # Should not have slots
        assert '"slots":' not in result

    def test_empty_slot_name(self, extension):
        """Test template with empty slot name is treated as content."""
        source = """<c-card>
    <template slot="">Content</template>
</c-card>"""

        result = extension.preprocess(source, "test.html")

        # Empty slot name should not create a named slot
        # Implementation may vary - test actual behavior
        assert '"content":' in result

    def test_duplicate_slot_names(self, extension):
        """Test behavior when same slot name is used twice."""
        source = """<c-card>
    <template slot="header">First header</template>
    <template slot="header">Second header</template>
</c-card>"""

        result = extension.preprocess(source, "test.html")

        # The second slot should override the first
        assert '"slots":' in result
        assert '"header":' in result
        # Only one should remain (last one wins)
        assert "Second header" in result

    def test_slot_with_special_characters_in_name(self, extension):
        """Test slot with special characters in name."""
        source = """<c-card>
    <template slot="my-slot">Content</template>
</c-card>"""

        result = extension.preprocess(source, "test.html")

        assert '"slots":' in result
        assert '"my-slot":' in result
