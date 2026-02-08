"""Unit tests for __init__.py path helpers and public API surface."""

import os

import lord_of_the_components
from lord_of_the_components import get_static_files_path, get_templates_path


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


class TestPublicAPI:
    def test_version_defined(self):
        assert hasattr(lord_of_the_components, "__version__")
        assert lord_of_the_components.__version__ == "0.1.0"

    def test_all_exports_importable(self):
        for name in lord_of_the_components.__all__:
            assert hasattr(lord_of_the_components, name), f"Missing export: {name}"
