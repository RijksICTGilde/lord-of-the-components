"""Unit tests for extension.py helpers, build_include, generate_id, and setup_components."""

import json
import tempfile
from unittest.mock import MagicMock

import pytest
from jinja2 import Environment, FileSystemLoader

from lord_of_the_components.extension import (
    ComponentError,
    ComponentExtension,
    SourceLocation,
    _CompileState,
    _get_component_assets,
    setup_components,
)

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
# _build_include
# ---------------------------------------------------------------------------


class TestBuildInclude:
    @pytest.fixture
    def extension(self):
        env = Environment()
        env.add_extension(ComponentExtension)
        return env.extensions[ComponentExtension.identifier]

    @pytest.fixture
    def state(self):
        return _CompileState()

    def test_simple_component_no_attrs(self, extension, state):
        result = extension._build_include("button", {}, None, state)
        assert '{% include "components/button.html.j2" with context %}' in result
        assert "_component_context" in result

    def test_string_attribute(self, extension, state):
        result = extension._build_include("button", {"variant": "primary"}, None, state)
        assert '"variant": "primary"' in result

    def test_dynamic_attribute(self, extension, state):
        result = extension._build_include("button", {":variant": "item.variant"}, None, state)
        assert '"variant": item.variant' in result

    def test_dynamic_boolean_true(self, extension, state):
        result = extension._build_include("button", {":disabled": "true"}, None, state)
        assert '"disabled": True' in result

    def test_dynamic_boolean_false(self, extension, state):
        result = extension._build_include("button", {":disabled": "false"}, None, state)
        assert '"disabled": False' in result

    def test_event_attribute(self, extension, state):
        result = extension._build_include("button", {"@click": "handleClick()"}, None, state)
        assert "'@click'" in result
        assert "handleClick()" in result

    def test_boolean_attribute_true(self, extension, state):
        result = extension._build_include("button", {"disabled": ""}, None, state)
        assert '"disabled": True' in result

    def test_boolean_attribute_false_string(self, extension, state):
        result = extension._build_include("button", {"disabled": "false"}, None, state)
        assert '"disabled": False' in result

    def test_content_creates_capture_var(self, extension, state):
        result = extension._build_include("button", {}, "Click me", state)
        assert "{% set _captured_content_" in result
        assert "Click me" in result
        assert "{% endset %}" in result
        assert '"content":' in result

    def test_named_slots(self, extension, state):
        result = extension._build_include(
            "card", {}, None, state, named_slots={"header": "Title", "footer": "End"}
        )
        assert "{% set _slot_header_" in result
        assert "{% set _slot_footer_" in result
        assert '"slots":' in result
        assert '"header":' in result
        assert '"footer":' in result

    def test_escaped_double_quotes_in_value(self, extension, state):
        result = extension._build_include("button", {"title": 'Say "hello"'}, None, state)
        assert 'Say \\"hello\\"' in result

    def test_template_path_is_correct(self, extension, state):
        result = extension._build_include("alert", {}, None, state)
        assert 'components/alert.html.j2' in result


# ---------------------------------------------------------------------------
# _generate_id (per-compile counter)
# ---------------------------------------------------------------------------


class TestGenerateId:
    @pytest.fixture
    def extension(self):
        env = Environment()
        env.add_extension(ComponentExtension)
        return env.extensions[ComponentExtension.identifier]

    def test_counts_from_one(self, extension):
        state = _CompileState()
        assert extension._generate_id(state) == "1"
        assert extension._generate_id(state) == "2"

    def test_fresh_state_restarts(self, extension):
        # Each compile gets its own state, so ids restart deterministically.
        assert extension._generate_id(_CompileState()) == "1"
        assert extension._generate_id(_CompileState()) == "1"

    def test_different_for_sequential_calls(self, extension):
        state = _CompileState()
        assert extension._generate_id(state) != extension._generate_id(state)








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
        source = '<c-button type="primary">A</c-button><c-button type="secondary">B</c-button>'
        result = extension.preprocess(source, "test.html")
        assert result.count("components/button.html.j2") == 2

    def test_preprocessor_state_resets_between_calls(self, extension):
        # First call
        extension.preprocess('<c-button type="primary">A</c-button>', "test1.html")
        # Second call should start fresh
        result = extension.preprocess('<c-button type="secondary">B</c-button>', "test2.html")
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


# ---------------------------------------------------------------------------
# Extension edge cases: uncovered defensive code paths
# ---------------------------------------------------------------------------


class TestPreprocessGenericExceptionWrapping:
    """A non-ComponentError raised while emitting is wrapped as RuntimeError."""

    def _ext(self):
        env = Environment()
        env.add_extension(ComponentExtension)
        return env.extensions[ComponentExtension.identifier]

    def test_generic_exception_wrapped_as_runtime_error(self):
        ext = self._ext()

        def boom(*args, **kwargs):
            raise ValueError("something went wrong internally")

        ext._emit = boom
        with pytest.raises(RuntimeError, match="Component preprocessing failed"):
            ext.preprocess("<c-button>Click</c-button>", "broken.html")

    def test_generic_exception_includes_template_name(self):
        ext = self._ext()

        def boom(*args, **kwargs):
            raise TypeError("bad type")

        ext._emit = boom
        with pytest.raises(RuntimeError, match="broken-template.html"):
            ext.preprocess("<c-button>Click</c-button>", "broken-template.html")

    def test_generic_exception_preserves_cause(self):
        ext = self._ext()
        original_error = ValueError("root cause")

        def boom(*args, **kwargs):
            raise original_error

        ext._emit = boom
        with pytest.raises(RuntimeError) as exc_info:
            ext.preprocess("<c-button>Click</c-button>", "test.html")

        assert exc_info.value.__cause__ is original_error






class TestSetupNonListSearchpath:
    """Tests for extension.py:626-627 — non-list searchpath fallback."""

    def test_non_list_searchpath_converted_to_list(self):
        env = Environment()
        loader = MagicMock()
        loader.searchpath = "/some/path"  # String, not list
        env.loader = loader
        env.add_extension(ComponentExtension)

        setup_components(env)

        # Should have been converted to a list containing both paths
        assert isinstance(loader.searchpath, list)
        assert loader.searchpath[0] == "/some/path"
        assert any("templates" in p for p in loader.searchpath)


class TestConcurrentPreprocess:
    """Regression test for the stateless-per-compile refactor (plan v7 D8/T0.3).

    The extension instance is shared across the whole Environment, so two
    templates compiling at the same time (a threaded server) must not corrupt
    each other's placeholders/counters. Before the refactor these lived on the
    instance; now they live in a per-call _CompileState.
    """

    def test_concurrent_compiles_are_isolated(self):
        from concurrent.futures import ThreadPoolExecutor

        env = Environment()
        env.add_extension(ComponentExtension)
        ext = env.extensions[ComponentExtension.identifier]

        source_a = '<c-card><c-button type="primary">Alpha</c-button></c-card>'
        source_b = (
            '<c-button type="secondary">Bravo</c-button>'
            '<c-button type="tertiary">Charlie</c-button>'
        )

        # Reference output, computed serially.
        expected_a = ext.preprocess(source_a, "a.html")
        expected_b = ext.preprocess(source_b, "b.html")
        assert expected_a != expected_b

        def compile_one(i):
            if i % 2 == 0:
                return "a", ext.preprocess(source_a, "a.html")
            return "b", ext.preprocess(source_b, "b.html")

        with ThreadPoolExecutor(max_workers=8) as pool:
            results = list(pool.map(compile_one, range(200)))

        for kind, output in results:
            assert output == (expected_a if kind == "a" else expected_b)
