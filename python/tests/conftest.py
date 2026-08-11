"""Shared test fixtures for end-to-end component tests."""

import os
from pathlib import Path

import pytest
from jinja2 import Environment, FileSystemLoader

from lord_of_the_components import setup_components

# The strictness flags default from the environment (LOTC_STRICT /
# LOTC_ON_UNKNOWN_*, see setup_components). Clear them at collection start — before
# any module-scoped env fixture is built — so the suite is deterministic whatever
# the ambient environment (a dev or CI runner may have LOTC_STRICT=1 for their own
# app). Tests that exercise the resolution set the variables via monkeypatch.
for _var in ("LOTC_STRICT", "LOTC_ON_UNKNOWN_VALUE", "LOTC_ON_UNKNOWN_ATTRIBUTE"):
    os.environ.pop(_var, None)

# Path to the package's templates directory
PACKAGE_DIR = Path(__file__).parent.parent / "src" / "lord_of_the_components"
TEMPLATES_DIR = PACKAGE_DIR / "templates"
REGISTRY_JSON = PACKAGE_DIR / "registry.json"


@pytest.fixture
def env():
    """Create a Jinja2 environment configured with LOTC component extension.

    Uses the generated registry.json so component definitions match the
    TypeScript-generated templates (kebab-case props like show-icon, full-width).
    """
    jinja_env = Environment(
        loader=FileSystemLoader(str(TEMPLATES_DIR)),
        autoescape=True,
    )
    setup_components(jinja_env, design_systems=["rvo"], registry_path=str(REGISTRY_JSON))
    return jinja_env


@pytest.fixture
def render(env):
    """Helper to render a template string and return the HTML output."""

    def _render(template_str: str) -> str:
        template = env.from_string(template_str)
        return template.render()

    return _render


@pytest.fixture
def generic_registry():
    """A registry for generic extension-mechanics tests.

    Tests in test_extension.py / test_errors.py / test_nesting.py / test_slots.py
    exercise the extension itself — attribute validation, typo suggestions,
    camelCase normalization, topological sort, slot extraction, nesting depth —
    against a stable set of placeholder components (``c-button``/``c-card`` with a
    ``variant`` attribute, ``c-stack``, ``c-layout``). These are deliberately not
    real RVO components; defining them here keeps those mechanics tests decoupled
    from the production registry.json instead of relying on stale registry
    defaults.
    """
    from lord_of_the_components.registry import (
        AttributeDefinition,
        AttributeType,
        ComponentDefinition,
        ComponentRegistry,
    )

    S = AttributeType.STRING
    B = AttributeType.BOOLEAN

    def _attrs(*specs):
        return [AttributeDefinition(name=n, type=t) for n, t in specs]

    reg = ComponentRegistry(registry_path=str(REGISTRY_JSON))

    for comp in (
        ComponentDefinition(
            name="button",
            description="",
            category="actions",
            attributes=_attrs(
                ("variant", S), ("size", S), ("type", S), ("icon", S), ("label", S),
                ("iconPosition", S), ("disabled", B), ("loading", B), ("fullWidth", B),
            ),
        ),
        ComponentDefinition(
            name="card",
            description="",
            category="data-display",
            attributes=_attrs(
                ("variant", S), ("padding", S), ("interactive", B), ("href", S),
            ),
        ),
        ComponentDefinition(
            name="stack",
            description="",
            category="layout",
            attributes=_attrs(("direction", S), ("gap", S)),
        ),
        ComponentDefinition(
            name="layout",
            description="",
            category="layout",
            attributes=_attrs(("variant", S)),
        ),
    ):
        reg.register_component(comp)

    return reg
