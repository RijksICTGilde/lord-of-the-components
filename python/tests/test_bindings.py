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
    setup_components(env, design_systems=["rvo"], registry_path=str(REGISTRY_JSON), validate_data=validate_data)
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


# ── :items repeat rendering (T5.1b) ─────────────────────────────────────────────


def test_menu_items_render():
    env = _env()
    html = env.from_string('<c-menu :items="items"/>').render(
        items=[{"label": "Home", "href": "/"}, {"label": "Now"}]
    )
    assert 'href="/"' in html and "Home" in html
    assert html.count("rvo-menubar__link") == 2  # one <a>, one <span>


def test_menu_items_and_children_both_render():
    env = _env()
    html = env.from_string(
        '<c-menu :items="items"><c-menu-item label="Extra" href="/x"/></c-menu>'
    ).render(items=[{"label": "Home", "href": "/"}])
    assert "Home" in html and "Extra" in html


# ── named slots rendering (T5.3) ────────────────────────────────────────────────


def test_card_footer_slot_renders():
    env = _env()
    html = env.from_string(
        '<c-card title="T"><template slot="footer">FOOT</template>body</c-card>'
    ).render()
    assert "rvo-card__footer" in html
    assert "FOOT" in html


def test_card_without_footer_slot_has_no_footer():
    env = _env()
    html = env.from_string('<c-card title="T">body</c-card>').render()
    assert "rvo-card__footer" not in html


# ── semantic icon aliasing ──────────────────────────────────────────────────────


def test_semantic_icon_resolves_per_theme():
    from jinja2 import Environment, FileSystemLoader

    def mk(theme):
        env = Environment(loader=FileSystemLoader([str(TEMPLATES_DIR)]), autoescape=True)
        setup_components(env, registry_path=str(REGISTRY_JSON), theme=theme)
        return env

    rvo = mk("rvo").from_string('<c-icon icon="home"/>').render()
    nldd = mk("nldd").from_string('<c-icon icon="home"/>').render()
    assert "rvo-icon-home" in rvo
    assert 'name="house"' in nldd  # same semantic name, NLDD icon


def test_semantic_icon_favorite():
    from jinja2 import Environment, FileSystemLoader

    def mk(theme):
        env = Environment(loader=FileSystemLoader([str(TEMPLATES_DIR)]), autoescape=True)
        setup_components(env, registry_path=str(REGISTRY_JSON), theme=theme)
        return env

    assert "rvo-icon-favoriet" in mk("rvo").from_string('<c-icon icon="favorite"/>').render()
    assert 'name="star"' in mk("nldd").from_string('<c-icon icon="favorite"/>').render()


def test_raw_icon_name_passes_through():
    env = Environment(loader=FileSystemLoader([str(TEMPLATES_DIR)]), autoescape=True)
    setup_components(env, registry_path=str(REGISTRY_JSON), theme="rvo")
    assert "rvo-icon-delta-naar-rechts" in env.from_string('<c-icon icon="delta-naar-rechts"/>').render()


# ═══════════════════════════════════════════════════════════════════════════════
# {{ }} attribute forms — the Jinja-style alternative to :attr bindings
# ═══════════════════════════════════════════════════════════════════════════════


class TestMustacheAttributes:
    """attr="{{ expr }}" works for every attribute (mirrors :attr), and mixed
    literal+{{ }} values interpolate as strings."""

    def _render(self, source: str, **ctx: object) -> str:
        env = _env()
        return env.from_string(source).render(**ctx)

    def test_whole_mustache_string_attr(self):
        html = self._render('{% set L = "Opslaan" %}<c-button type="primary" label="{{ L }}"/>')
        assert "Opslaan" in html

    def test_mixed_interpolation_string_attr(self):
        html = self._render('{% set uid = 42 %}<c-link href="/user/{{ uid }}">P</c-link>')
        assert "/user/42" in html

    def test_whole_mustache_binding_equals_colon_form(self):
        # items="{{ NAV }}" passes the actual list (object-preserving), like :items
        nav = [{"label": "Home", "href": "/"}, {"label": "P", "children": [{"label": "A", "href": "/a"}]}]
        html = self._render('<c-menu type="vertical" items="{{ NAV }}"/>', NAV=nav)
        assert "Home" in html and "A" in html
        assert "rvo-menubar__submenu" in html  # nested, so it was a real list not a string

    def test_whole_mustache_boolean_attr(self):
        on = self._render('{% set flag = True %}<c-button type="primary" label="X" disabled="{{ flag }}"/>')
        off = self._render('{% set flag = False %}<c-button type="primary" label="X" disabled="{{ flag }}"/>')
        assert "disabled" in on and "disabled" not in off

    def test_binding_validation_still_applies(self):
        # A bad shape via items="{{ ... }}" is validated just like :items.
        with pytest.raises(DataValidationError):
            self._render('<c-menu items="{{ BAD }}"/>', BAD=[{"no_label": 1}])
