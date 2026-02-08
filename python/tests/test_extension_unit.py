"""Unit tests for extension.py helper functions, build_include, extract_slots, and setup_components."""

import json
import tempfile
from pathlib import Path
from unittest.mock import MagicMock

import pytest
from bs4 import BeautifulSoup, Tag
from jinja2 import Environment, FileSystemLoader

from lord_of_the_components.extension import (
    ComponentError,
    ComponentExtension,
    SourceLocation,
    _find_attribute_location,
    _find_tag_location,
    _get_component_assets,
    setup_components,
)


# ---------------------------------------------------------------------------
# _find_tag_location
# ---------------------------------------------------------------------------


class TestFindTagLocation:
    def test_single_tag_first_line(self):
        source = "<c-button>Click</c-button>"
        loc = _find_tag_location(source, "c-button")
        assert loc is not None
        assert loc.line == 1
        assert loc.column == 1

    def test_tag_on_second_line(self):
        source = "<div>\n  <c-button>Click</c-button>\n</div>"
        loc = _find_tag_location(source, "c-button")
        assert loc is not None
        assert loc.line == 2
        assert loc.column == 3

    def test_tag_with_attributes(self):
        source = '<c-button variant="primary">Click</c-button>'
        loc = _find_tag_location(source, "c-button")
        assert loc is not None
        assert loc.line == 1
        assert loc.column == 1

    def test_self_closing_tag(self):
        source = '<c-icon name="home"/>'
        loc = _find_tag_location(source, "c-icon")
        assert loc is not None
        assert loc.line == 1

    def test_occurrence_0_of_multiple(self):
        source = "<c-button>First</c-button>\n<c-button>Second</c-button>"
        loc = _find_tag_location(source, "c-button", occurrence=0)
        assert loc is not None
        assert loc.line == 1

    def test_occurrence_1_of_multiple(self):
        source = "<c-button>First</c-button>\n<c-button>Second</c-button>"
        loc = _find_tag_location(source, "c-button", occurrence=1)
        assert loc is not None
        assert loc.line == 2

    def test_occurrence_beyond_matches_returns_none(self):
        source = "<c-button>Click</c-button>"
        loc = _find_tag_location(source, "c-button", occurrence=5)
        assert loc is None

    def test_tag_not_found_returns_none(self):
        source = "<div>No components here</div>"
        loc = _find_tag_location(source, "c-button")
        assert loc is None

    def test_tag_name_case_insensitive(self):
        source = "<C-Button>Click</C-Button>"
        loc = _find_tag_location(source, "c-button")
        assert loc is not None
        assert loc.line == 1

    def test_deeply_indented_tag(self):
        source = "<div>\n  <div>\n    <div>\n      <c-alert>Warning</c-alert>\n    </div>\n  </div>\n</div>"
        loc = _find_tag_location(source, "c-alert")
        assert loc is not None
        assert loc.line == 4
        assert loc.column == 7

    def test_tag_preceded_by_text(self):
        source = "Some text <c-button>Click</c-button>"
        loc = _find_tag_location(source, "c-button")
        assert loc is not None
        assert loc.line == 1
        assert loc.column == 11

    def test_empty_source(self):
        loc = _find_tag_location("", "c-button")
        assert loc is None


# ---------------------------------------------------------------------------
# _find_attribute_location
# ---------------------------------------------------------------------------


class TestFindAttributeLocation:
    def test_attribute_on_same_line_as_tag(self):
        source = '<c-button variant="primary">Click</c-button>'
        loc = _find_attribute_location(source, "c-button", "variant")
        assert loc is not None
        assert loc.line == 1

    def test_attribute_on_different_line(self):
        source = '<c-button\n  variant="primary"\n>Click</c-button>'
        loc = _find_attribute_location(source, "c-button", "variant")
        assert loc is not None
        assert loc.line == 2

    def test_colon_prefixed_attribute(self):
        source = '<c-button :variant="item.variant">Click</c-button>'
        loc = _find_attribute_location(source, "c-button", ":variant")
        assert loc is not None
        assert loc.line == 1

    def test_at_prefixed_attribute(self):
        source = '<c-button @click="handle">Click</c-button>'
        loc = _find_attribute_location(source, "c-button", "@click")
        assert loc is not None
        assert loc.line == 1

    def test_attribute_not_found_returns_none(self):
        source = '<c-button variant="primary">Click</c-button>'
        loc = _find_attribute_location(source, "c-button", "nonexistent")
        assert loc is None

    def test_tag_not_found_returns_none(self):
        source = "<div>No components</div>"
        loc = _find_attribute_location(source, "c-button", "variant")
        assert loc is None

    def test_second_occurrence_of_tag(self):
        source = '<c-button variant="primary">A</c-button>\n<c-button variant="secondary">B</c-button>'
        loc = _find_attribute_location(source, "c-button", "variant", tag_occurrence=1)
        assert loc is not None
        assert loc.line == 2

    def test_occurrence_beyond_tags_returns_none(self):
        source = '<c-button variant="primary">Click</c-button>'
        loc = _find_attribute_location(source, "c-button", "variant", tag_occurrence=5)
        assert loc is None

    def test_multiple_attributes_finds_specific_one(self):
        source = '<c-button variant="primary" disabled>Click</c-button>'
        loc = _find_attribute_location(source, "c-button", "disabled")
        assert loc is not None
        assert loc.line == 1

    def test_fallback_to_clean_attr_for_colon_prefix(self):
        # When searching for ":variant" but it's stored as "variant" in the source
        source = '<c-button :variant="x">Click</c-button>'
        loc = _find_attribute_location(source, "c-button", "variant")
        assert loc is not None


# ---------------------------------------------------------------------------
# _is_generic_html_attribute
# ---------------------------------------------------------------------------


class TestIsGenericHtmlAttribute:
    @pytest.fixture
    def extension(self):
        env = Environment()
        env.add_extension(ComponentExtension)
        return env.extensions[ComponentExtension.identifier]

    def test_data_attribute(self, extension):
        assert extension._is_generic_html_attribute("data-testid") is True

    def test_aria_attribute(self, extension):
        assert extension._is_generic_html_attribute("aria-label") is True

    def test_hx_attribute(self, extension):
        assert extension._is_generic_html_attribute("hx-get") is True

    def test_text_style_utility(self, extension):
        assert extension._is_generic_html_attribute("text-style") is True

    def test_margin_utility(self, extension):
        assert extension._is_generic_html_attribute("margin") is True

    def test_padding_utility(self, extension):
        assert extension._is_generic_html_attribute("padding") is True

    def test_regular_attribute_is_not_generic(self, extension):
        assert extension._is_generic_html_attribute("variant") is False

    def test_class_is_not_generic(self, extension):
        assert extension._is_generic_html_attribute("class") is False

    def test_empty_string(self, extension):
        assert extension._is_generic_html_attribute("") is False


# ---------------------------------------------------------------------------
# _extract_slots
# ---------------------------------------------------------------------------


class TestExtractSlots:
    @pytest.fixture
    def extension(self):
        env = Environment()
        env.add_extension(ComponentExtension)
        return env.extensions[ComponentExtension.identifier]

    def _make_tag(self, html: str) -> Tag:
        """Parse HTML and return the first tag."""
        soup = BeautifulSoup(html, "html.parser")
        return soup.find(True)  # first tag

    def test_no_slots_no_content(self, extension):
        tag = self._make_tag("<c-button></c-button>")
        named_slots, default_content = extension._extract_slots(tag)
        assert named_slots == {}
        assert default_content is None

    def test_default_content_only(self, extension):
        tag = self._make_tag("<c-button>Click me</c-button>")
        named_slots, default_content = extension._extract_slots(tag)
        assert named_slots == {}
        assert default_content == "Click me"

    def test_named_slot(self, extension):
        tag = self._make_tag(
            '<c-card><template slot="header">My Title</template></c-card>'
        )
        named_slots, default_content = extension._extract_slots(tag)
        assert "header" in named_slots
        assert named_slots["header"] == "My Title"

    def test_multiple_named_slots(self, extension):
        tag = self._make_tag(
            '<c-card>'
            '<template slot="header">Header</template>'
            '<template slot="footer">Footer</template>'
            '</c-card>'
        )
        named_slots, default_content = extension._extract_slots(tag)
        assert len(named_slots) == 2
        assert named_slots["header"] == "Header"
        assert named_slots["footer"] == "Footer"

    def test_named_slot_with_default_content(self, extension):
        tag = self._make_tag(
            '<c-card>'
            '<template slot="header">Title</template>'
            'Default body content'
            '</c-card>'
        )
        named_slots, default_content = extension._extract_slots(tag)
        assert named_slots["header"] == "Title"
        assert default_content == "Default body content"

    def test_template_without_slot_is_default_content(self, extension):
        tag = self._make_tag(
            "<c-card><template>Not a slot</template></c-card>"
        )
        named_slots, default_content = extension._extract_slots(tag)
        assert named_slots == {}
        assert default_content is not None
        assert "Not a slot" in default_content

    def test_named_slot_with_html_content(self, extension):
        tag = self._make_tag(
            '<c-card><template slot="header"><strong>Bold</strong> text</template></c-card>'
        )
        named_slots, _ = extension._extract_slots(tag)
        assert "<strong>Bold</strong> text" in named_slots["header"]


# ---------------------------------------------------------------------------
# _build_include
# ---------------------------------------------------------------------------


class TestBuildInclude:
    @pytest.fixture
    def extension(self):
        env = Environment()
        env.add_extension(ComponentExtension)
        ext = env.extensions[ComponentExtension.identifier]
        ext._current_template_id = "test.html"
        ext._placeholder_counter = 0
        return ext

    def test_simple_component_no_attrs(self, extension):
        result = extension._build_include("button", {}, None)
        assert '{% include "components/button.html.j2" with context %}' in result
        assert "_component_context" in result

    def test_string_attribute(self, extension):
        result = extension._build_include("button", {"variant": "primary"}, None)
        assert '"variant": "primary"' in result

    def test_dynamic_attribute(self, extension):
        result = extension._build_include("button", {":variant": "item.variant"}, None)
        assert '"variant": item.variant' in result

    def test_dynamic_boolean_true(self, extension):
        result = extension._build_include("button", {":disabled": "true"}, None)
        assert '"disabled": True' in result

    def test_dynamic_boolean_false(self, extension):
        result = extension._build_include("button", {":disabled": "false"}, None)
        assert '"disabled": False' in result

    def test_event_attribute(self, extension):
        result = extension._build_include("button", {"@click": "handleClick()"}, None)
        assert "'@click'" in result
        assert "handleClick()" in result

    def test_boolean_attribute_true(self, extension):
        result = extension._build_include("button", {"disabled": ""}, None)
        assert '"disabled": True' in result

    def test_boolean_attribute_false_string(self, extension):
        result = extension._build_include("button", {"disabled": "false"}, None)
        assert '"disabled": False' in result

    def test_content_creates_capture_var(self, extension):
        result = extension._build_include("button", {}, "Click me")
        assert "{% set _captured_content_" in result
        assert "Click me" in result
        assert "{% endset %}" in result
        assert '"content":' in result

    def test_named_slots(self, extension):
        result = extension._build_include(
            "card", {}, None, named_slots={"header": "Title", "footer": "End"}
        )
        assert "{% set _slot_header_" in result
        assert "{% set _slot_footer_" in result
        assert '"slots":' in result
        assert '"header":' in result
        assert '"footer":' in result

    def test_escaped_double_quotes_in_value(self, extension):
        result = extension._build_include("button", {"title": 'Say "hello"'}, None)
        assert 'Say \\"hello\\"' in result

    def test_template_path_is_correct(self, extension):
        result = extension._build_include("alert", {}, None)
        assert 'components/alert.html.j2' in result


# ---------------------------------------------------------------------------
# _generate_id (deterministic)
# ---------------------------------------------------------------------------


class TestGenerateId:
    @pytest.fixture
    def extension(self):
        env = Environment()
        env.add_extension(ComponentExtension)
        ext = env.extensions[ComponentExtension.identifier]
        ext._current_template_id = "test.html"
        ext._placeholder_counter = 0
        return ext

    def test_returns_8_char_hex(self, extension):
        result = extension._generate_id()
        assert len(result) == 8
        int(result, 16)  # should not raise

    def test_deterministic_for_same_input(self):
        env1 = Environment()
        env1.add_extension(ComponentExtension)
        ext1 = env1.extensions[ComponentExtension.identifier]
        ext1._current_template_id = "same.html"
        ext1._placeholder_counter = 0

        env2 = Environment()
        env2.add_extension(ComponentExtension)
        ext2 = env2.extensions[ComponentExtension.identifier]
        ext2._current_template_id = "same.html"
        ext2._placeholder_counter = 0

        assert ext1._generate_id() == ext2._generate_id()

    def test_different_for_sequential_calls(self, extension):
        id1 = extension._generate_id()
        id2 = extension._generate_id()
        assert id1 != id2

    def test_different_for_different_templates(self):
        env = Environment()
        env.add_extension(ComponentExtension)

        ext = env.extensions[ComponentExtension.identifier]
        ext._current_template_id = "a.html"
        ext._placeholder_counter = 0
        id_a = ext._generate_id()

        ext._current_template_id = "b.html"
        ext._placeholder_counter = 0
        id_b = ext._generate_id()

        assert id_a != id_b


# ---------------------------------------------------------------------------
# _restore_jinja_tags
# ---------------------------------------------------------------------------


class TestRestoreJinjaTags:
    @pytest.fixture
    def extension(self):
        env = Environment()
        env.add_extension(ComponentExtension)
        ext = env.extensions[ComponentExtension.identifier]
        ext._jinja_placeholders = {}
        return ext

    def test_no_placeholders(self, extension):
        result = extension._restore_jinja_tags("<div>Hello</div>")
        assert result == "<div>Hello</div>"

    def test_single_placeholder(self, extension):
        extension._jinja_placeholders["JINJA2_PLACEHOLDER_abc"] = '{% include "x.html.j2" %}'
        result = extension._restore_jinja_tags("<div>JINJA2_PLACEHOLDER_abc</div>")
        assert '{% include "x.html.j2" %}' in result

    def test_multiple_placeholders(self, extension):
        extension._jinja_placeholders["JINJA2_PLACEHOLDER_1"] = "{% block a %}"
        extension._jinja_placeholders["JINJA2_PLACEHOLDER_2"] = "{% block b %}"
        result = extension._restore_jinja_tags("JINJA2_PLACEHOLDER_1 JINJA2_PLACEHOLDER_2")
        assert "{% block a %}" in result
        assert "{% block b %}" in result

    def test_html_entities_unescaped(self, extension):
        result = extension._restore_jinja_tags("&amp; &lt; &gt;")
        assert "& < >" == result

    def test_nested_placeholders(self, extension):
        # Placeholder that, when expanded, contains another placeholder
        extension._jinja_placeholders["JINJA2_PLACEHOLDER_outer"] = "before JINJA2_PLACEHOLDER_inner after"
        extension._jinja_placeholders["JINJA2_PLACEHOLDER_inner"] = "RESOLVED"
        result = extension._restore_jinja_tags("JINJA2_PLACEHOLDER_outer")
        assert "RESOLVED" in result

    def test_max_iterations_prevents_infinite_loop(self, extension):
        # Circular placeholders (pathological case) - should not hang
        extension._jinja_placeholders["JINJA2_PLACEHOLDER_a"] = "JINJA2_PLACEHOLDER_b"
        extension._jinja_placeholders["JINJA2_PLACEHOLDER_b"] = "JINJA2_PLACEHOLDER_a"
        # Should complete without hanging (max 10 iterations)
        result = extension._restore_jinja_tags("JINJA2_PLACEHOLDER_a")
        assert isinstance(result, str)


# ---------------------------------------------------------------------------
# _calculate_nesting_depth
# ---------------------------------------------------------------------------


class TestCalculateNestingDepth:
    @pytest.fixture
    def extension(self):
        env = Environment()
        env.add_extension(ComponentExtension)
        return env.extensions[ComponentExtension.identifier]

    def test_top_level_component_depth_0(self, extension):
        soup = BeautifulSoup("<c-button>Click</c-button>", "html.parser")
        tag = soup.find("c-button")
        tag_to_id = {id(tag): tag}
        assert extension._calculate_nesting_depth(tag, tag_to_id) == 0

    def test_nested_component_depth_1(self, extension):
        soup = BeautifulSoup(
            "<c-card><c-button>Click</c-button></c-card>", "html.parser"
        )
        card = soup.find("c-card")
        button = soup.find("c-button")
        tag_to_id = {id(card): card, id(button): button}
        assert extension._calculate_nesting_depth(button, tag_to_id) == 1

    def test_deeply_nested_depth_2(self, extension):
        soup = BeautifulSoup(
            "<c-page><c-card><c-button>Click</c-button></c-card></c-page>",
            "html.parser",
        )
        page = soup.find("c-page")
        card = soup.find("c-card")
        button = soup.find("c-button")
        tag_to_id = {id(page): page, id(card): card, id(button): button}
        assert extension._calculate_nesting_depth(button, tag_to_id) == 2
        assert extension._calculate_nesting_depth(card, tag_to_id) == 1
        assert extension._calculate_nesting_depth(page, tag_to_id) == 0

    def test_non_component_wrappers_not_counted(self, extension):
        soup = BeautifulSoup(
            "<c-card><div><span><c-button>Click</c-button></span></div></c-card>",
            "html.parser",
        )
        card = soup.find("c-card")
        button = soup.find("c-button")
        tag_to_id = {id(card): card, id(button): button}
        # Only c-card counts as a parent, not div/span
        assert extension._calculate_nesting_depth(button, tag_to_id) == 1


# ---------------------------------------------------------------------------
# _is_component_tag
# ---------------------------------------------------------------------------


class TestIsComponentTag:
    @pytest.fixture
    def extension(self):
        env = Environment()
        env.add_extension(ComponentExtension)
        return env.extensions[ComponentExtension.identifier]

    def test_valid_component_tag(self, extension):
        soup = BeautifulSoup("<c-button>x</c-button>", "html.parser")
        tag = soup.find("c-button")
        assert extension._is_component_tag(tag) is True

    def test_regular_html_tag(self, extension):
        soup = BeautifulSoup("<div>x</div>", "html.parser")
        tag = soup.find("div")
        assert extension._is_component_tag(tag) is False

    def test_navigable_string(self, extension):
        soup = BeautifulSoup("just text", "html.parser")
        text = soup.contents[0]
        assert extension._is_component_tag(text) is False

    def test_none(self, extension):
        assert extension._is_component_tag(None) is False

    def test_plain_object(self, extension):
        assert extension._is_component_tag("not a tag") is False


# ---------------------------------------------------------------------------
# _get_component_assets
# ---------------------------------------------------------------------------


class TestGetComponentAssets:
    def test_default_assets(self):
        result = _get_component_assets()
        assert "css_files" in result
        assert "js_files" in result
        assert "htmx_enabled" in result
        assert result["htmx_enabled"] is False
        assert any("lotc.css" in f for f in result["css_files"])
        assert any("lotc.js" in f for f in result["js_files"])

    def test_custom_static_url_prefix(self):
        result = _get_component_assets(static_url_prefix="/assets/")
        assert all(f.startswith("/assets/dist/") for f in result["css_files"])
        assert all(
            f.startswith("/assets/dist/") or f.startswith("http")
            for f in result["js_files"]
        )

    def test_htmx_enabled(self):
        result = _get_component_assets(htmx=True)
        assert result["htmx_enabled"] is True
        assert any("htmx" in f for f in result["js_files"])
        # htmx should be first in the list
        assert "htmx" in result["js_files"][0]

    def test_htmx_disabled(self):
        result = _get_component_assets(htmx=False)
        assert not any("htmx" in f for f in result["js_files"])

    def test_user_css_files_appended(self):
        result = _get_component_assets(user_css_files=["/my/custom.css"])
        assert "/my/custom.css" in result["css_files"]
        # User CSS should be after built-in CSS
        assert result["css_files"][-1] == "/my/custom.css"

    def test_user_js_files_appended(self):
        result = _get_component_assets(user_js_files=["/my/app.js"])
        assert "/my/app.js" in result["js_files"]
        assert result["js_files"][-1] == "/my/app.js"

    def test_includes_rvo_css_bundles(self):
        result = _get_component_assets()
        css = result["css_files"]
        assert any("design-tokens" in f for f in css)
        assert any("component-library-css" in f for f in css)
        assert any("css-button" in f for f in css)
        assert any("fonts" in f for f in css)
        assert any("icons" in f for f in css)

    def test_none_user_files_ignored(self):
        result = _get_component_assets(user_css_files=None, user_js_files=None)
        # Should just have the default files
        assert len(result["css_files"]) == 7
        assert len(result["js_files"]) == 1


# ---------------------------------------------------------------------------
# setup_components
# ---------------------------------------------------------------------------


class TestSetupComponents:
    def test_adds_extension_to_environment(self):
        env = Environment(loader=FileSystemLoader("/tmp"))
        setup_components(env)
        assert ComponentExtension.identifier in env.extensions

    def test_sets_theme_global(self):
        env = Environment(loader=FileSystemLoader("/tmp"))
        setup_components(env, theme="rvo")
        assert env.globals["lotc_theme"] == "rvo"

    def test_default_theme(self):
        env = Environment(loader=FileSystemLoader("/tmp"))
        setup_components(env)
        assert env.globals["lotc_theme"] == "default"

    def test_htmx_global_true(self):
        env = Environment(loader=FileSystemLoader("/tmp"))
        setup_components(env, htmx=True)
        assert env.globals["lotc_htmx"] is True

    def test_htmx_global_false(self):
        env = Environment(loader=FileSystemLoader("/tmp"))
        setup_components(env, htmx=False)
        assert env.globals["lotc_htmx"] is False

    def test_validate_data_global(self):
        env = Environment(loader=FileSystemLoader("/tmp"))
        setup_components(env, validate_data=False)
        assert env.globals["lotc_validate_data"] is False

    def test_returns_environment(self):
        env = Environment(loader=FileSystemLoader("/tmp"))
        result = setup_components(env)
        assert result is env

    def test_get_component_assets_callable(self):
        env = Environment(loader=FileSystemLoader("/tmp"))
        setup_components(env)
        assets_fn = env.globals["get_component_assets"]
        assets = assets_fn()
        assert "css_files" in assets
        assert "js_files" in assets

    def test_custom_static_url_prefix_propagated(self):
        env = Environment(loader=FileSystemLoader("/tmp"))
        setup_components(env, static_url_prefix="/cdn/lotc/")
        assets = env.globals["get_component_assets"]()
        assert all(
            f.startswith("/cdn/lotc/") or f.startswith("http")
            for f in assets["css_files"]
        )

    def test_custom_registry_path(self):
        # Create a minimal registry JSON in the format _load_from_file expects
        registry_data = {
            "components": [
                {"name": "test-comp", "props": [], "slots": []}
            ]
        }
        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".json", delete=False
        ) as f:
            json.dump(registry_data, f)
            f.flush()
            registry_path = f.name

        env = Environment(loader=FileSystemLoader("/tmp"))
        setup_components(env, registry_path=registry_path)
        ext = env.extensions[ComponentExtension.identifier]
        assert ext.registry.has_component("test-comp")

    def test_appends_templates_to_searchpath(self):
        env = Environment(loader=FileSystemLoader("/tmp"))
        original_len = len(env.loader.searchpath)
        setup_components(env)
        # Should have added the component templates path
        assert len(env.loader.searchpath) == original_len + 1
        assert any("templates" in p for p in env.loader.searchpath)

    def test_no_loader_does_not_crash(self):
        env = Environment()  # No loader
        setup_components(env)
        assert ComponentExtension.identifier in env.extensions


# ---------------------------------------------------------------------------
# preprocess edge cases
# ---------------------------------------------------------------------------


class TestPreprocessEdgeCases:
    @pytest.fixture
    def extension(self):
        env = Environment()
        env.add_extension(ComponentExtension)
        return env.extensions[ComponentExtension.identifier]

    def test_no_component_tags_returns_source_unchanged(self, extension):
        source = "<div>Hello world</div>"
        result = extension.preprocess(source, "test.html")
        assert result == source

    def test_empty_source(self, extension):
        result = extension.preprocess("", "test.html")
        assert result == ""

    def test_plain_text_without_html(self, extension):
        source = "Just plain text without any tags"
        result = extension.preprocess(source, "test.html")
        assert result == source

    def test_generic_html_attributes_accepted(self, extension):
        source = '<c-button data-testid="btn" aria-label="Submit">Click</c-button>'
        result = extension.preprocess(source, "test.html")
        assert "data-testid" in result
        assert "aria-label" in result

    def test_utility_attributes_accepted(self, extension):
        source = '<c-button margin="md" padding="lg">Click</c-button>'
        result = extension.preprocess(source, "test.html")
        assert '"margin"' in result
        assert '"padding"' in result

    def test_id_attribute_accepted(self, extension):
        source = '<c-button id="main-btn">Click</c-button>'
        result = extension.preprocess(source, "test.html")
        assert '"id": "main-btn"' in result

    def test_class_attribute_accepted(self, extension):
        source = '<c-button class="extra-class">Click</c-button>'
        result = extension.preprocess(source, "test.html")
        assert '"class": "extra-class"' in result

    def test_multiple_components_processed(self, extension):
        source = '<c-button variant="primary">A</c-button><c-button variant="secondary">B</c-button>'
        result = extension.preprocess(source, "test.html")
        assert result.count("components/button.html.j2") == 2

    def test_preprocessor_state_resets_between_calls(self, extension):
        # First call
        extension.preprocess('<c-button variant="primary">A</c-button>', "test1.html")
        # Second call should start fresh
        result = extension.preprocess('<c-button variant="secondary">B</c-button>', "test2.html")
        assert "components/button.html.j2" in result


# ---------------------------------------------------------------------------
# SourceLocation
# ---------------------------------------------------------------------------


class TestSourceLocationStr:
    def test_str(self):
        assert str(SourceLocation(line=1, column=1)) == "line 1, column 1"

    def test_repr(self):
        loc = SourceLocation(line=5, column=10)
        assert "5" in repr(loc)
        assert "10" in repr(loc)


# ---------------------------------------------------------------------------
# ComponentError edge cases
# ---------------------------------------------------------------------------


class TestComponentErrorEdgeCases:
    def test_message_attribute_preserved(self):
        error = ComponentError("test message")
        assert error.message == "test message"

    def test_location_attribute_preserved(self):
        loc = SourceLocation(line=1, column=1)
        error = ComponentError("msg", location=loc)
        assert error.location is loc

    def test_suggestion_attribute_preserved(self):
        error = ComponentError("msg", suggestion="fix")
        assert error.suggestion == "fix"

    def test_no_location_no_suggestion(self):
        error = ComponentError("plain error")
        assert error.location is None
        assert error.suggestion is None
        assert str(error) == "plain error"

    def test_inherits_from_exception(self):
        error = ComponentError("test")
        assert isinstance(error, Exception)
