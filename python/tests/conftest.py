"""Shared test fixtures for end-to-end component tests."""

from pathlib import Path

import pytest
from jinja2 import Environment, FileSystemLoader

from lord_of_the_components import setup_components

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
    )
    setup_components(jinja_env, registry_path=str(REGISTRY_JSON))
    return jinja_env


@pytest.fixture
def render(env):
    """Helper to render a template string and return the HTML output."""

    def _render(template_str: str) -> str:
        template = env.from_string(template_str)
        return template.render()

    return _render
