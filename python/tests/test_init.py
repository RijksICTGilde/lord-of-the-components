"""Unit tests for __init__.py path helpers and public API surface."""

import os

import lord_of_the_components
from lord_of_the_components import (
    get_static_files_path,
    get_static_roots,
    get_templates_path,
)


class TestGetStaticFilesPath:
    def test_returns_string(self):
        result = get_static_files_path()
        assert isinstance(result, str)

    def test_ends_with_static(self):
        result = get_static_files_path()
        assert result.endswith("static")

    def test_path_exists(self):
        result = get_static_files_path()
        assert os.path.isdir(result)

    def test_contains_package_directory(self):
        result = get_static_files_path()
        assert "lord_of_the_components" in result

    def test_static_dir_contains_lotc(self):
        result = get_static_files_path()
        lotc_dir = os.path.join(result, "lotc")
        assert os.path.isdir(lotc_dir)


class TestGetTemplatesPath:
    def test_returns_string(self):
        result = get_templates_path()
        assert isinstance(result, str)

    def test_ends_with_templates(self):
        result = get_templates_path()
        assert result.endswith("templates")

    def test_path_exists(self):
        result = get_templates_path()
        assert os.path.isdir(result)

    def test_contains_package_directory(self):
        result = get_templates_path()
        assert "lord_of_the_components" in result

    def test_templates_dir_contains_components(self):
        result = get_templates_path()
        components_dir = os.path.join(result, "components")
        assert os.path.isdir(components_dir)


class TestGetStaticRoots:
    def test_returns_list_of_existing_dirs(self):
        roots = get_static_roots()
        assert isinstance(roots, list) and roots
        assert all(os.path.isdir(r) for r in roots)

    def test_core_static_is_first(self):
        # Core (layout.css, app-components.css) is the first root.
        assert get_static_roots()[0] == get_static_files_path()

    def test_each_root_backs_the_lotc_url_space(self):
        # Every root serves files under /static/lotc/, i.e. has a lotc/ subdir.
        for r in get_static_roots():
            assert os.path.isdir(os.path.join(r, "lotc")), r

    def test_includes_an_installed_design_system_bundle(self):
        # With a design system installed (e.g. lotc-rvo), its bundle dir appears.
        roots = get_static_roots()
        assert len(roots) >= 2  # core + at least one design system
        assert any(os.path.isfile(os.path.join(r, "lotc", "dist", "lotc.css")) for r in roots)


class TestPublicAPI:
    def test_version_defined(self):
        assert hasattr(lord_of_the_components, "__version__")
        assert lord_of_the_components.__version__ == "0.1.0"

    def test_all_exports_importable(self):
        for name in lord_of_the_components.__all__:
            assert hasattr(lord_of_the_components, name), f"Missing export: {name}"
