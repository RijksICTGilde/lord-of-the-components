"""
Component registry for managing component metadata and validation.
"""

import json
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional


class AttributeType(Enum):
    """Types of component attributes."""

    STRING = "string"
    BOOLEAN = "boolean"
    NUMBER = "number"
    ENUM = "enum"
    OBJECT = "object"
    ARRAY = "array"
    GENERIC_SIZE = "generic-size"
    GENERIC_COLOR = "generic-color"


@dataclass
class AttributeDefinition:
    """Definition of a component attribute."""

    name: str
    type: AttributeType
    required: bool = False
    default: Any = None
    description: str = ""
    enum_values: Optional[List[str]] = None

    def __post_init__(self) -> None:
        if self.type == AttributeType.ENUM and not self.enum_values:
            raise ValueError("Enum attributes must specify enum_values")


@dataclass
class SlotDefinition:
    """Definition of a component slot."""

    name: str
    required: bool = False
    description: str = ""


@dataclass
class ComponentDefinition:
    """Definition of a component."""

    name: str
    description: str
    category: str = "utility"
    status: str = "experimental"
    backend: str = "jinja"
    attributes: List[AttributeDefinition] = field(default_factory=list)
    slots: List[SlotDefinition] = field(default_factory=list)
    #: Data bindings (`:name`) -> binding type string (e.g. "MenuItem[]").
    bindings: Dict[str, str] = field(default_factory=dict)
    depends_on: Optional[List[str]] = None
    # Name -> attribute index, built from `attributes` at construction time so
    # get_attribute() is O(1) instead of a linear scan on every hot-path lookup.
    _attribute_index: Dict[str, AttributeDefinition] = field(
        default_factory=dict, init=False, repr=False, compare=False
    )

    def __post_init__(self) -> None:
        self._attribute_index = {attr.name: attr for attr in self.attributes}

    def get_attribute(self, name: str) -> Optional[AttributeDefinition]:
        """Get attribute definition by name."""
        return self._attribute_index.get(name)

    def has_attribute(self, name: str) -> bool:
        """Check if component has an attribute."""
        return name in self._attribute_index


#: Path to the registry.json shipped inside the package (the single source of
#: component metadata — see plan v7 D6). Loaded once and cached module-level.
_DEFAULT_REGISTRY_PATH = Path(__file__).with_name("registry.json")

#: Cache of the parsed default registry, keyed name -> ComponentDefinition.
#: Avoids re-reading and re-parsing the ~33 kB registry.json on every
#: ComponentRegistry() / setup_components() call.
_default_registry_cache: Optional[Dict[str, "ComponentDefinition"]] = None


def _load_default_registry() -> Dict[str, "ComponentDefinition"]:
    """Load (and cache) the bundled registry.json into a name->definition map."""
    global _default_registry_cache
    if _default_registry_cache is None:
        reg = ComponentRegistry(registry_path=_DEFAULT_REGISTRY_PATH)
        _default_registry_cache = reg._components
    return _default_registry_cache


class ComponentRegistry:
    """Registry for managing component definitions."""

    def __init__(self, registry_path: Optional[Path] = None) -> None:
        self._components: Dict[str, ComponentDefinition] = {}

        if registry_path is not None:
            self._load_from_file(Path(registry_path))
        else:
            # No explicit path: use the bundled registry.json (cached). Copy the
            # map so register_component() on this instance can't mutate the cache.
            self._components = dict(_load_default_registry())

    def _load_from_file(self, path: Path) -> None:
        """Load component definitions from a JSON registry file."""
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        components = data.get("components", [])
        if isinstance(components, list):
            for comp_data in components:
                name = comp_data.get("name", "")
                if name:
                    self._register_from_dict(name, comp_data)
        else:
            for name, comp_data in components.items():
                self._register_from_dict(name, comp_data)

    def _register_from_dict(self, name: str, data: Dict[str, Any]) -> None:
        """Register a component from a dictionary."""
        attributes = []
        for attr_data in data.get("attributes", data.get("props", [])):
            attr_type_str = attr_data.get("type", "string")
            try:
                attr_type = AttributeType(attr_type_str)
            except ValueError:
                attr_type = AttributeType.STRING

            attributes.append(
                AttributeDefinition(
                    name=attr_data["name"],
                    type=attr_type,
                    required=attr_data.get("required", False),
                    default=attr_data.get("default"),
                    description=attr_data.get("description", ""),
                    enum_values=attr_data.get("enum_values", attr_data.get("enumValues")),
                )
            )

        slots = []
        for slot_data in data.get("slots", []):
            slots.append(
                SlotDefinition(
                    name=slot_data["name"],
                    required=slot_data.get("required", False),
                    description=slot_data.get("description", ""),
                )
            )

        component = ComponentDefinition(
            name=name,
            description=data.get("description", ""),
            category=data.get("category", "utility"),
            status=data.get("status", "experimental"),
            backend=data.get("backend", "jinja"),
            attributes=attributes,
            slots=slots,
            bindings=dict(data.get("bindings", {})),
            depends_on=data.get("dependsOn"),
        )
        self._components[name] = component

    def register_component(self, component: ComponentDefinition) -> None:
        """Register a new component."""
        self._components[component.name] = component

    def has_component(self, name: str) -> bool:
        """Check if a component is registered."""
        return name in self._components

    def get_component(self, name: str) -> Optional[ComponentDefinition]:
        """Get component definition by name."""
        return self._components.get(name)

    def get_all_component_names(self) -> List[str]:
        """Get all registered component names."""
        return list(self._components.keys())

    def get_component_metadata(self, name: str) -> Optional[Dict[str, Any]]:
        """Get component metadata as dictionary."""
        component = self.get_component(name)
        if not component:
            return None

        return {
            "name": component.name,
            "description": component.description,
            "category": component.category,
            "status": component.status,
            "attributes": [
                {
                    "name": attr.name,
                    "type": attr.type.value,
                    "required": attr.required,
                    "default": attr.default,
                    "description": attr.description,
                    "enum_values": attr.enum_values,
                }
                for attr in component.attributes
            ],
            "slots": [
                {
                    "name": slot.name,
                    "required": slot.required,
                    "description": slot.description,
                }
                for slot in component.slots
            ],
            "depends_on": component.depends_on,
        }
