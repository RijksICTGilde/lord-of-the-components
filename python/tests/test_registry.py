"""Unit tests for ComponentRegistry, component definitions, and JSON loading."""

import json
import tempfile
from pathlib import Path

import pytest

from lord_of_the_components.registry import (
    AttributeDefinition,
    AttributeType,
    ComponentDefinition,
    ComponentRegistry,
    SlotDefinition,
)


# ---------------------------------------------------------------------------
# AttributeDefinition
# ---------------------------------------------------------------------------


class TestAttributeDefinition:
    def test_basic_string_attribute(self):
        attr = AttributeDefinition(name="title", type=AttributeType.STRING)
        assert attr.name == "title"
        assert attr.type == AttributeType.STRING
        assert attr.required is False
        assert attr.default is None

    def test_enum_attribute_with_values(self):
        attr = AttributeDefinition(
            name="variant",
            type=AttributeType.ENUM,
            enum_values=["primary", "secondary"],
        )
        assert attr.enum_values == ["primary", "secondary"]

    def test_enum_attribute_without_values_raises(self):
        with pytest.raises(ValueError, match="Enum attributes must specify enum_values"):
            AttributeDefinition(name="variant", type=AttributeType.ENUM)

    def test_boolean_attribute(self):
        attr = AttributeDefinition(
            name="disabled", type=AttributeType.BOOLEAN, default=False
        )
        assert attr.type == AttributeType.BOOLEAN
        assert attr.default is False

    def test_all_attribute_types(self):
        """Ensure all AttributeType enum members are valid."""
        expected = {
            "string", "boolean", "number", "enum",
            "object", "array", "generic-size", "generic-color",
        }
        actual = {t.value for t in AttributeType}
        assert actual == expected


# ---------------------------------------------------------------------------
# ComponentDefinition
# ---------------------------------------------------------------------------


class TestComponentDefinition:
    def test_get_attribute_found(self):
        attr = AttributeDefinition(name="variant", type=AttributeType.STRING)
        comp = ComponentDefinition(name="button", description="A button", attributes=[attr])
        assert comp.get_attribute("variant") is attr

    def test_get_attribute_not_found(self):
        comp = ComponentDefinition(name="button", description="A button", attributes=[])
        assert comp.get_attribute("missing") is None

    def test_has_attribute(self):
        attr = AttributeDefinition(name="size", type=AttributeType.STRING)
        comp = ComponentDefinition(name="button", description="", attributes=[attr])
        assert comp.has_attribute("size") is True
        assert comp.has_attribute("color") is False

    def test_defaults(self):
        comp = ComponentDefinition(name="x", description="")
        assert comp.category == "utility"
        assert comp.status == "experimental"
        assert comp.attributes == []
        assert comp.slots == []
        assert comp.depends_on is None


# ---------------------------------------------------------------------------
# ComponentRegistry — default components
# ---------------------------------------------------------------------------


class TestRegistryDefaults:
    def test_default_registry_has_components(self):
        reg = ComponentRegistry()
        names = reg.get_all_component_names()
        assert len(names) > 0
        assert "page" in names
        assert "button" in names

    def test_has_component(self):
        reg = ComponentRegistry()
        assert reg.has_component("page") is True
        assert reg.has_component("nonexistent") is False

    def test_get_component(self):
        reg = ComponentRegistry()
        comp = reg.get_component("button")
        assert comp is not None
        assert comp.name == "button"
        assert comp.category == "actions"

    def test_get_component_missing(self):
        reg = ComponentRegistry()
        assert reg.get_component("nonexistent") is None

    def test_get_component_metadata(self):
        reg = ComponentRegistry()
        meta = reg.get_component_metadata("page")
        assert meta is not None
        assert meta["name"] == "page"
        assert isinstance(meta["attributes"], list)
        assert isinstance(meta["slots"], list)

    def test_get_component_metadata_missing(self):
        reg = ComponentRegistry()
        assert reg.get_component_metadata("nonexistent") is None


# ---------------------------------------------------------------------------
# ComponentRegistry — JSON loading (array format)
# ---------------------------------------------------------------------------


def _write_registry(tmp_path: Path, data: dict) -> Path:
    """Write a registry JSON file and return its path."""
    path = tmp_path / "registry.json"
    path.write_text(json.dumps(data), encoding="utf-8")
    return path


class TestRegistryLoadFromFile:
    def test_load_array_format(self, tmp_path):
        """Load registry in the array format used by the real registry.json."""
        data = {
            "components": [
                {
                    "name": "alert",
                    "description": "Alert box",
                    "category": "feedback",
                    "status": "stable",
                    "attributes": [
                        {
                            "name": "type",
                            "type": "enum",
                            "enum_values": ["info", "warning", "error"],
                            "default": "info",
                        }
                    ],
                    "slots": [
                        {"name": "default", "required": True, "description": "Content"}
                    ],
                }
            ]
        }
        path = _write_registry(tmp_path, data)
        reg = ComponentRegistry(registry_path=path)

        assert reg.has_component("alert")
        comp = reg.get_component("alert")
        assert comp.description == "Alert box"
        assert comp.category == "feedback"
        assert len(comp.attributes) == 1
        assert comp.attributes[0].type == AttributeType.ENUM
        assert comp.attributes[0].enum_values == ["info", "warning", "error"]
        assert len(comp.slots) == 1
        assert comp.slots[0].name == "default"
        assert comp.slots[0].required is True

    def test_load_dict_format(self, tmp_path):
        """Load registry in the alternative dict format."""
        data = {
            "components": {
                "heading": {
                    "description": "A heading",
                    "attributes": [
                        {"name": "level", "type": "number", "default": 1}
                    ],
                }
            }
        }
        path = _write_registry(tmp_path, data)
        reg = ComponentRegistry(registry_path=path)

        assert reg.has_component("heading")
        comp = reg.get_component("heading")
        assert comp.attributes[0].type == AttributeType.NUMBER

    def test_load_props_key_fallback(self, tmp_path):
        """Attributes can also be specified under the 'props' key."""
        data = {
            "components": [
                {
                    "name": "icon",
                    "props": [
                        {"name": "icon", "type": "string"}
                    ],
                }
            ]
        }
        path = _write_registry(tmp_path, data)
        reg = ComponentRegistry(registry_path=path)

        comp = reg.get_component("icon")
        assert len(comp.attributes) == 1
        assert comp.attributes[0].name == "icon"

    def test_load_enumValues_camelCase(self, tmp_path):
        """The camelCase 'enumValues' key should be accepted as a fallback."""
        data = {
            "components": [
                {
                    "name": "btn",
                    "attributes": [
                        {
                            "name": "variant",
                            "type": "enum",
                            "enumValues": ["a", "b"],
                        }
                    ],
                }
            ]
        }
        path = _write_registry(tmp_path, data)
        reg = ComponentRegistry(registry_path=path)

        comp = reg.get_component("btn")
        assert comp.attributes[0].enum_values == ["a", "b"]

    def test_unknown_attribute_type_falls_back_to_string(self, tmp_path):
        """Unknown attribute types default to STRING."""
        data = {
            "components": [
                {
                    "name": "widget",
                    "attributes": [
                        {"name": "data", "type": "unknown-future-type"}
                    ],
                }
            ]
        }
        path = _write_registry(tmp_path, data)
        reg = ComponentRegistry(registry_path=path)

        comp = reg.get_component("widget")
        assert comp.attributes[0].type == AttributeType.STRING

    def test_boolean_attribute_from_json(self, tmp_path):
        """Boolean attributes loaded from JSON."""
        data = {
            "components": [
                {
                    "name": "toggle",
                    "attributes": [
                        {"name": "active", "type": "boolean", "default": False}
                    ],
                }
            ]
        }
        path = _write_registry(tmp_path, data)
        reg = ComponentRegistry(registry_path=path)

        attr = reg.get_component("toggle").attributes[0]
        assert attr.type == AttributeType.BOOLEAN
        assert attr.default is False

    def test_empty_components_list(self, tmp_path):
        """Empty components list produces empty registry."""
        data = {"components": []}
        path = _write_registry(tmp_path, data)
        reg = ComponentRegistry(registry_path=path)
        assert reg.get_all_component_names() == []

    def test_component_without_name_skipped(self, tmp_path):
        """Components without a name field are silently skipped."""
        data = {
            "components": [
                {"description": "no name"},
                {"name": "valid", "description": "has name"},
            ]
        }
        path = _write_registry(tmp_path, data)
        reg = ComponentRegistry(registry_path=path)

        assert reg.get_all_component_names() == ["valid"]

    def test_depends_on_loaded(self, tmp_path):
        """The dependsOn field maps to depends_on."""
        data = {
            "components": [
                {
                    "name": "button",
                    "dependsOn": ["icon"],
                    "attributes": [],
                }
            ]
        }
        path = _write_registry(tmp_path, data)
        reg = ComponentRegistry(registry_path=path)

        assert reg.get_component("button").depends_on == ["icon"]

    def test_missing_file_raises(self):
        """Loading from a nonexistent path raises FileNotFoundError."""
        with pytest.raises(FileNotFoundError):
            ComponentRegistry(registry_path=Path("/nonexistent/registry.json"))

    def test_malformed_json_raises(self, tmp_path):
        """Malformed JSON raises a json.JSONDecodeError."""
        path = tmp_path / "bad.json"
        path.write_text("{not valid json", encoding="utf-8")
        with pytest.raises(json.JSONDecodeError):
            ComponentRegistry(registry_path=path)


# ---------------------------------------------------------------------------
# ComponentRegistry — register_component
# ---------------------------------------------------------------------------


class TestRegisterComponent:
    def test_register_and_retrieve(self):
        reg = ComponentRegistry()
        comp = ComponentDefinition(name="custom", description="Custom component")
        reg.register_component(comp)
        assert reg.has_component("custom")
        assert reg.get_component("custom") is comp

    def test_register_overwrites(self):
        reg = ComponentRegistry()
        comp1 = ComponentDefinition(name="x", description="first")
        comp2 = ComponentDefinition(name="x", description="second")
        reg.register_component(comp1)
        reg.register_component(comp2)
        assert reg.get_component("x").description == "second"


# ---------------------------------------------------------------------------
# Integration: load the real registry.json
# ---------------------------------------------------------------------------


class TestRealRegistry:
    """Smoke tests against the actual generated registry.json."""

    REGISTRY_PATH = (
        Path(__file__).parent.parent
        / "src"
        / "lord_of_the_components"
        / "registry.json"
    )

    @pytest.fixture
    def reg(self):
        return ComponentRegistry(registry_path=self.REGISTRY_PATH)

    def test_loads_without_error(self, reg):
        names = reg.get_all_component_names()
        assert len(names) >= 20

    def test_button_has_type_attribute(self, reg):
        comp = reg.get_component("button")
        assert comp is not None
        attr = comp.get_attribute("type")
        assert attr is not None
        assert attr.type == AttributeType.ENUM

    def test_all_components_have_names(self, reg):
        for name in reg.get_all_component_names():
            comp = reg.get_component(name)
            assert comp.name == name
            assert isinstance(comp.description, str)
