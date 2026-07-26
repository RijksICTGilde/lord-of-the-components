"""Data-binding validation wiring (plan v7 F5 / T5.1, T5.2).

The extension wraps :binding expressions in a render-time validation call so the
previously-dead validation code actually runs, behind the validate_data flag.
"""

from pathlib import Path

import pytest
from jinja2 import Environment, FileSystemLoader

from lord_of_the_components import setup_components
from lord_of_the_components.extension import ComponentExtension
from lord_of_the_components.validation import DataValidationError, validate_binding

PACKAGE_DIR = Path(__file__).resolve().parent.parent / "src" / "lord_of_the_components"
TEMPLATES_DIR = PACKAGE_DIR / "templates"
REGISTRY_JSON = PACKAGE_DIR / "registry.json"


def _env(validate_data: bool = True) -> Environment:
    env = Environment(loader=FileSystemLoader([str(TEMPLATES_DIR)]), autoescape=True)
    setup_components(env, registry_path=str(REGISTRY_JSON), validate_data=validate_data)
    return env


def _pre(env: Environment, source: str) -> str:
    return env.extensions[ComponentExtension.identifier].preprocess(source, "t.html")


# ── registry metadata ─────────────────────────────────────────────────────────


def test_menu_binding_in_registry():
    from lord_of_the_components.registry import ComponentRegistry

    reg = ComponentRegistry(REGISTRY_JSON)
    assert reg.get_component("menu").bindings == {"items": "MenuItem[]"}


# ── wrapping ───────────────────────────────────────────────────────────────────


def test_binding_is_wrapped_in_validation():
    out = _pre(_env(), '<c-menu :items="data"/>')
    assert "_lotc_validate(data, 'MenuItem[]', 'menu', 'items')" in out


def test_no_wrap_when_validate_data_off():
    out = _pre(_env(validate_data=False), '<c-menu :items="data"/>')
    assert "_lotc_validate" not in out
    assert '"items": data' in out


# ── render-time validation ─────────────────────────────────────────────────────


def test_valid_items_render_ok():
    env = _env()
    html = env.from_string('<c-menu :items="items"/>').render(
        items=[{"label": "Home", "href": "/"}, {"label": "About"}]
    )
    assert "rvo-menubar" in html


def test_invalid_items_raise():
    env = _env()
    with pytest.raises(DataValidationError) as exc:
        env.from_string('<c-menu :items="items"/>').render(items=[{"href": "/no-label"}])
    assert "MenuItem[]" in str(exc.value)


def test_validate_data_off_allows_bad_data():
    env = _env(validate_data=False)
    # No exception even though the label is missing.
    env.from_string('<c-menu :items="items"/>').render(items=[{"href": "/no-label"}])


# ── validate_binding directly ───────────────────────────────────────────────────


def test_validate_binding_passthrough_valid():
    data = [{"label": "A"}]
    assert validate_binding(data, "MenuItem[]") is data


def test_validate_binding_unknown_type_passthrough():
    data = [{"anything": 1}]
    assert validate_binding(data, "TableRow[]") is data


def test_validate_binding_columns():
    with pytest.raises(DataValidationError):
        validate_binding([{"label": "no key"}], "TableColumn[]")
