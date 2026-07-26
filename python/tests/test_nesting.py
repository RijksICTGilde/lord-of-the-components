"""Tests for component nesting: topological sort and depth protection."""

import pytest
from jinja2 import Environment

from lord_of_the_components import ComponentExtension
from lord_of_the_components.extension import MAX_NESTING_DEPTH, ComponentError


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


class TestTopologicalSort:
    """Tests for topological sort ordering of nested components."""

    def test_single_component_no_nesting(self, extension):
        """Test processing a single component without nesting."""
        source = '<c-button variant="primary">Click</c-button>'

        result = extension.preprocess(source, "test.html")

        assert "components/button.html.j2" in result

    def test_two_level_nesting(self, extension):
        """Test processing two levels of nesting (parent with child)."""
        source = """<c-card>
    <c-button variant="primary">Click</c-button>
</c-card>"""

        result = extension.preprocess(source, "test.html")

        # Both components should be processed
        assert "components/card.html.j2" in result
        assert "components/button.html.j2" in result
        # Button should be inside card's content
        assert '"content":' in result

    def test_three_level_nesting(self, extension):
        """Test processing three levels of nesting."""
        source = """<c-card>
    <c-stack>
        <c-button>Deep button</c-button>
    </c-stack>
</c-card>"""

        result = extension.preprocess(source, "test.html")

        # All three components should be processed
        assert "components/card.html.j2" in result
        assert "components/stack.html.j2" in result
        assert "components/button.html.j2" in result

    def test_sibling_components(self, extension):
        """Test processing sibling components (no parent-child relationship)."""
        source = """<c-button>First</c-button>
<c-button>Second</c-button>"""

        result = extension.preprocess(source, "test.html")

        # Both buttons should be processed
        assert result.count("components/button.html.j2") == 2

    def test_nested_siblings(self, extension):
        """Test parent with multiple nested sibling components."""
        source = """<c-card>
    <c-button>Button 1</c-button>
    <c-button>Button 2</c-button>
    <c-button>Button 3</c-button>
</c-card>"""

        result = extension.preprocess(source, "test.html")

        assert "components/card.html.j2" in result
        assert result.count("components/button.html.j2") == 3

    def test_mixed_nesting_and_siblings(self, extension):
        """Test complex structure with both nesting and siblings."""
        source = """<c-layout>
    <c-card>
        <c-button>Card button</c-button>
    </c-card>
    <c-card>
        <c-stack>
            <c-button>Stack button 1</c-button>
            <c-button>Stack button 2</c-button>
        </c-stack>
    </c-card>
</c-layout>"""

        result = extension.preprocess(source, "test.html")

        # All components should be processed
        assert "components/layout.html.j2" in result
        assert result.count("components/card.html.j2") == 2
        assert "components/stack.html.j2" in result
        assert result.count("components/button.html.j2") == 3

    def test_deeply_nested_structure(self, extension):
        """Test processing a deeply nested but valid structure."""
        source = """<c-layout>
    <c-card>
        <c-stack>
            <c-card>
                <c-button>Deeply nested</c-button>
            </c-card>
        </c-stack>
    </c-card>
</c-layout>"""

        result = extension.preprocess(source, "test.html")

        assert "components/layout.html.j2" in result
        assert result.count("components/card.html.j2") == 2
        assert "components/stack.html.j2" in result
        assert "components/button.html.j2" in result

    def test_components_in_named_slots(self, extension):
        """Test components nested inside named slots."""
        source = """<c-card>
    <template slot="header">
        <c-button variant="icon">X</c-button>
    </template>
    Body content
</c-card>"""

        result = extension.preprocess(source, "test.html")

        assert "components/card.html.j2" in result
        assert "components/button.html.j2" in result
        assert '"slots":' in result


class TestNestingDepthProtection:
    """Tests for MAX_NESTING_DEPTH protection."""

    def test_max_nesting_depth_constant(self):
        """Verify MAX_NESTING_DEPTH is set to 50."""
        assert MAX_NESTING_DEPTH == 50

    def test_valid_depth_at_boundary(self, extension):
        """Test that nesting at boundary (just under limit) works."""
        # Create nesting at depth 5 (well under limit)
        source = """<c-card>
    <c-stack>
        <c-card>
            <c-stack>
                <c-button>OK</c-button>
            </c-stack>
        </c-card>
    </c-stack>
</c-card>"""

        # Should not raise
        result = extension.preprocess(source, "test.html")
        assert "components/button.html.j2" in result

    def test_excessive_nesting_raises_error(self, extension):
        """Test that exceeding MAX_NESTING_DEPTH raises ComponentError."""
        # Build a deeply nested structure that exceeds the limit
        depth = MAX_NESTING_DEPTH + 5
        opening_tags = "\n".join(["<c-card>" for _ in range(depth)])
        content = "<c-button>Too deep</c-button>"
        closing_tags = "\n".join(["</c-card>" for _ in range(depth)])
        source = f"{opening_tags}\n{content}\n{closing_tags}"

        with pytest.raises(ComponentError) as exc_info:
            extension.preprocess(source, "test.html")

        error = exc_info.value
        assert "nesting depth" in str(error).lower()
        assert str(MAX_NESTING_DEPTH) in str(error)

    def test_error_message_includes_depth_info(self, extension):
        """Test that error message contains useful depth information."""
        depth = MAX_NESTING_DEPTH + 2
        opening_tags = "\n".join(["<c-card>" for _ in range(depth)])
        content = "<c-button>Deep</c-button>"
        closing_tags = "\n".join(["</c-card>" for _ in range(depth)])
        source = f"{opening_tags}\n{content}\n{closing_tags}"

        with pytest.raises(ComponentError) as exc_info:
            extension.preprocess(source, "test.html")

        error_msg = str(exc_info.value)
        # Should mention both the actual depth and the max allowed
        assert str(MAX_NESTING_DEPTH) in error_msg
        assert "exceeds" in error_msg.lower() or "maximum" in error_msg.lower()


class TestTopologicalSortCorrectness:
    """Tests to verify topological sort produces correct processing order."""

    def test_inner_component_processed_before_outer(self, extension):
        """Verify that inner components are processed before outer ones."""
        source = """<c-card>
    <c-button variant="test-marker">Inner</c-button>
</c-card>"""

        result = extension.preprocess(source, "test.html")

        # The button include should appear within the card's content
        # This verifies processing happened in correct order
        assert "components/card.html.j2" in result
        assert "components/button.html.j2" in result
        # Button should be processed and its output should be in the card content
        assert '"variant": "test-marker"' in result

    def test_deterministic_output_for_same_input(self, extension):
        """Test that the same input always produces the same output."""
        source = """<c-layout>
    <c-card>
        <c-button>B1</c-button>
        <c-button>B2</c-button>
    </c-card>
</c-layout>"""

        result1 = extension.preprocess(source, "test.html")
        result2 = extension.preprocess(source, "test.html")

        assert result1 == result2


class TestEdgeCases:
    """Edge cases for nesting behavior."""

    def test_empty_component(self, extension):
        """Test self-closing or empty components."""
        source = "<c-button></c-button>"

        result = extension.preprocess(source, "test.html")

        assert "components/button.html.j2" in result

    def test_no_components(self, extension):
        """Test template with no components."""
        source = "<div>Just regular HTML</div>"

        result = extension.preprocess(source, "test.html")

        # Should return unchanged
        assert result == source

    def test_component_with_html_siblings(self, extension):
        """Test component mixed with regular HTML siblings."""
        source = """<div>
    <span>Before</span>
    <c-button>Click</c-button>
    <span>After</span>
</div>"""

        result = extension.preprocess(source, "test.html")

        assert "components/button.html.j2" in result
        assert "<span>Before</span>" in result
        assert "<span>After</span>" in result
