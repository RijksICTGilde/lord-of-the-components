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
    attributes: List[AttributeDefinition] = field(default_factory=list)
    slots: List[SlotDefinition] = field(default_factory=list)
    depends_on: Optional[List[str]] = None

    def get_attribute(self, name: str) -> Optional[AttributeDefinition]:
        """Get attribute definition by name."""
        for attr in self.attributes:
            if attr.name == name:
                return attr
        return None

    def has_attribute(self, name: str) -> bool:
        """Check if component has an attribute."""
        return self.get_attribute(name) is not None


class ComponentRegistry:
    """Registry for managing component definitions."""

    def __init__(self, registry_path: Optional[Path] = None) -> None:
        self._components: Dict[str, ComponentDefinition] = {}

        if registry_path:
            self._load_from_file(registry_path)
        else:
            self._register_default_components()

    def _load_from_file(self, path: Path) -> None:
        """Load component definitions from a JSON registry file."""
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        for name, comp_data in data.get("components", {}).items():
            self._register_from_dict(name, comp_data)

    def _register_from_dict(self, name: str, data: Dict[str, Any]) -> None:
        """Register a component from a dictionary."""
        attributes = []
        for attr_data in data.get("props", []):
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
                    enum_values=attr_data.get("enumValues"),
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
            attributes=attributes,
            slots=slots,
            depends_on=data.get("dependsOn"),
        )
        self._components[name] = component

    def _register_default_components(self) -> None:
        """Register built-in components."""
        # Page component
        self.register_component(
            ComponentDefinition(
                name="page",
                description="Root page component",
                category="layout",
                status="stable",
                attributes=[
                    AttributeDefinition(
                        name="title",
                        type=AttributeType.STRING,
                        required=True,
                        description="Page title",
                    ),
                    AttributeDefinition(
                        name="lang",
                        type=AttributeType.STRING,
                        default="en",
                        description="HTML language",
                    ),
                    AttributeDefinition(
                        name="charset",
                        type=AttributeType.STRING,
                        default="utf-8",
                        description="Document charset",
                    ),
                    AttributeDefinition(
                        name="description",
                        type=AttributeType.STRING,
                        description="Meta description",
                    ),
                    AttributeDefinition(
                        name="theme",
                        type=AttributeType.STRING,
                        description="Theme name",
                    ),
                    AttributeDefinition(
                        name="head",
                        type=AttributeType.STRING,
                        description="Additional head content",
                    ),
                    AttributeDefinition(
                        name="scripts",
                        type=AttributeType.ARRAY,
                        description="Additional scripts",
                    ),
                    AttributeDefinition(
                        name="styles",
                        type=AttributeType.ARRAY,
                        description="Additional styles",
                    ),
                ],
                slots=[
                    SlotDefinition(
                        name="default", required=True, description="Page content"
                    ),
                ],
            )
        )

        # Layout component
        self.register_component(
            ComponentDefinition(
                name="layout",
                description="Main layout container",
                category="layout",
                status="stable",
                attributes=[
                    AttributeDefinition(
                        name="variant",
                        type=AttributeType.ENUM,
                        default="default",
                        enum_values=["default", "sidebar-left", "sidebar-right", "holy-grail"],
                    ),
                    AttributeDefinition(
                        name="maxWidth",
                        type=AttributeType.ENUM,
                        default="lg",
                        enum_values=["sm", "md", "lg", "xl", "full"],
                    ),
                    AttributeDefinition(
                        name="padding",
                        type=AttributeType.GENERIC_SIZE,
                        default="md",
                    ),
                    AttributeDefinition(
                        name="gap",
                        type=AttributeType.GENERIC_SIZE,
                        default="md",
                    ),
                ],
                slots=[
                    SlotDefinition(name="default", required=True),
                    SlotDefinition(name="header"),
                    SlotDefinition(name="footer"),
                    SlotDefinition(name="sidebar"),
                ],
            )
        )

        # Grid component
        self.register_component(
            ComponentDefinition(
                name="grid",
                description="CSS Grid layout",
                category="layout",
                status="stable",
                attributes=[
                    AttributeDefinition(
                        name="cols",
                        type=AttributeType.NUMBER,
                        default=12,
                    ),
                    AttributeDefinition(
                        name="rows",
                        type=AttributeType.NUMBER,
                    ),
                    AttributeDefinition(
                        name="gap",
                        type=AttributeType.GENERIC_SIZE,
                        default="md",
                    ),
                    AttributeDefinition(
                        name="gapX",
                        type=AttributeType.GENERIC_SIZE,
                    ),
                    AttributeDefinition(
                        name="gapY",
                        type=AttributeType.GENERIC_SIZE,
                    ),
                    AttributeDefinition(
                        name="align",
                        type=AttributeType.ENUM,
                        default="stretch",
                        enum_values=["start", "center", "end", "stretch"],
                    ),
                    AttributeDefinition(
                        name="justify",
                        type=AttributeType.ENUM,
                        default="stretch",
                        enum_values=["start", "center", "end", "stretch", "space-between", "space-around"],
                    ),
                    AttributeDefinition(
                        name="flow",
                        type=AttributeType.ENUM,
                        default="row",
                        enum_values=["row", "column", "row-dense", "column-dense"],
                    ),
                ],
                slots=[
                    SlotDefinition(name="default", required=True),
                ],
            )
        )

        # Stack component
        self.register_component(
            ComponentDefinition(
                name="stack",
                description="Flexbox stack layout",
                category="layout",
                status="stable",
                attributes=[
                    AttributeDefinition(
                        name="direction",
                        type=AttributeType.ENUM,
                        default="vertical",
                        enum_values=["vertical", "horizontal"],
                    ),
                    AttributeDefinition(
                        name="gap",
                        type=AttributeType.GENERIC_SIZE,
                        default="md",
                    ),
                    AttributeDefinition(
                        name="align",
                        type=AttributeType.ENUM,
                        default="stretch",
                        enum_values=["start", "center", "end", "stretch", "baseline"],
                    ),
                    AttributeDefinition(
                        name="justify",
                        type=AttributeType.ENUM,
                        default="start",
                        enum_values=["start", "center", "end", "space-between", "space-around", "space-evenly"],
                    ),
                    AttributeDefinition(
                        name="wrap",
                        type=AttributeType.BOOLEAN,
                        default=False,
                    ),
                    AttributeDefinition(
                        name="reverse",
                        type=AttributeType.BOOLEAN,
                        default=False,
                    ),
                    AttributeDefinition(
                        name="dividers",
                        type=AttributeType.BOOLEAN,
                        default=False,
                    ),
                ],
                slots=[
                    SlotDefinition(name="default", required=True),
                ],
            )
        )

        # Button component
        self.register_component(
            ComponentDefinition(
                name="button",
                description="Interactive button for user actions",
                category="actions",
                status="stable",
                attributes=[
                    AttributeDefinition(
                        name="variant",
                        type=AttributeType.GENERIC_COLOR,
                        default="primary",
                        description="Visual style of the button",
                    ),
                    AttributeDefinition(
                        name="size",
                        type=AttributeType.GENERIC_SIZE,
                        default="md",
                        description="Size of the button",
                    ),
                    AttributeDefinition(
                        name="type",
                        type=AttributeType.ENUM,
                        default="button",
                        enum_values=["button", "submit", "reset"],
                        description="HTML button type",
                    ),
                    AttributeDefinition(
                        name="disabled",
                        type=AttributeType.BOOLEAN,
                        default=False,
                        description="Whether button is disabled",
                    ),
                    AttributeDefinition(
                        name="loading",
                        type=AttributeType.BOOLEAN,
                        default=False,
                        description="Whether to show loading state",
                    ),
                    AttributeDefinition(
                        name="icon",
                        type=AttributeType.STRING,
                        description="Icon name to display",
                    ),
                    AttributeDefinition(
                        name="iconPosition",
                        type=AttributeType.ENUM,
                        default="before",
                        enum_values=["before", "after"],
                        description="Position of icon",
                    ),
                    AttributeDefinition(
                        name="fullWidth",
                        type=AttributeType.BOOLEAN,
                        default=False,
                        description="Full width button",
                    ),
                ],
                slots=[
                    SlotDefinition(name="default", required=True, description="Button label"),
                ],
                depends_on=["icon"],
            )
        )

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
