"""lotc-forms — the opt-in form-field set.

Proves the same <c-*-field> markup renders a theme-correct field under RVO and
NLDD, with the ARIA wiring guaranteed identically (the reason the wrapper exists).
"""

import pytest
from jinja2 import Environment, FileSystemLoader

from lord_of_the_components import setup_components
from lord_of_the_components.extension import ComponentError


def _env(design_systems):
    env = Environment(autoescape=True, loader=FileSystemLoader([]))
    setup_components(env, design_systems=design_systems)
    return env


def render(design_systems, src):
    return " ".join(_env(design_systems).from_string(src).render().split())


RVO = ["rvo", "lotc-forms"]
NLDD = ["lotc-layout", "nldd", "lotc-forms"]

ALL_FIELDS = {
    "text-input-field": '<c-text-input-field id="a" name="a" label="A"/>',
    "textarea-field": '<c-textarea-field id="a" name="a" label="A"/>',
    "select-field": '<c-select-field id="a" name="a" label="A"><c-option value="x" label="X"/></c-select-field>',
    "radio-button-field": (
        '<c-radio-button-field id="a" label="A"><c-radio name="a" value="x" label="X"/></c-radio-button-field>'
    ),
    "checkbox-field": (
        '<c-checkbox-field id="a" label="A"><c-checkbox name="a" value="x" label="X"/></c-checkbox-field>'
    ),
    "date-input-field": '<c-date-input-field id="a" name="a" label="A"/>',
    "file-input-field": '<c-file-input-field id="a" name="a" label="A"/>',
    "fieldset": '<c-fieldset legend="A"><c-text-input-field id="b" name="b" label="B"/></c-fieldset>',
    "action-group": '<c-action-group><c-button type="primary" label="Save"/></c-action-group>',
}


@pytest.mark.parametrize("name,src", ALL_FIELDS.items())
def test_every_field_renders_under_rvo(name, src):
    out = render(RVO, src)
    assert out and "lotc-unimplemented" not in out
    assert f'data-lotc-component="{name}"' in out


@pytest.mark.parametrize("name,src", ALL_FIELDS.items())
def test_every_field_renders_under_nldd(name, src):
    out = render(NLDD, src)
    assert out and "lotc-unimplemented" not in out
    assert f'data-lotc-component="{name}"' in out


def test_opt_in_only_errors_without_the_set():
    # Without lotc-forms active, the field components must not resolve.
    env = _env(["rvo"])
    with pytest.raises(ComponentError):
        env.from_string('<c-text-input-field id="a" name="a" label="A"/>').render()


# ── ARIA wiring: the guarantee, identical across themes ──────────────────────
FULL = (
    '<c-text-input-field id="voornaam" name="voornaam" label="Voornaam"'
    ' help="Uit je paspoort" error="Verplicht" required="true"/>'
)


def test_rvo_aria_wiring():
    out = render(RVO, FULL)
    assert 'for="voornaam"' in out and 'id="voornaam-label"' in out
    assert 'id="voornaam"' in out  # the input
    assert 'aria-describedby="voornaam-help voornaam-error"' in out
    assert 'aria-invalid="true"' in out
    assert 'id="voornaam-help"' in out and 'id="voornaam-error"' in out


def test_nldd_aria_wiring():
    out = render(NLDD, FULL)
    assert "nldd-form-field" in out
    assert 'input-id="voornaam"' in out
    assert 'error-message-ids="voornaam-error"' in out
    assert 'nldd-form-field-error-text id="voornaam-error"' in out


def test_describedby_only_references_rendered_parts():
    # help only → describedby points at help alone, no dangling error id
    out = render(RVO, '<c-text-input-field id="x" name="x" label="X" help="h"/>')
    assert 'aria-describedby="x-help"' in out
    assert "x-error" not in out
    assert "aria-invalid" not in out


# ── theme-native frames ──────────────────────────────────────────────────────
def test_text_input_field_is_native_per_theme():
    assert "utrecht-textbox" in render(RVO, FULL)
    assert "nldd-text-field" in render(NLDD, FULL)


def test_radio_and_checkbox_are_lotc_forms_not_shadowed_by_nldd():
    # The colliding raw NLDD bindings were excluded so lotc-forms owns these names.
    radio = ALL_FIELDS["radio-button-field"]
    out = render(NLDD, radio)
    assert 'data-lotc-component="radio-button-field"' in out
    assert 'role="radiogroup"' in out


def test_file_input_has_nldd_fallback_badge():
    out = render(NLDD, ALL_FIELDS["file-input-field"])
    assert 'type="file"' in out
    assert "lotc-file-fallback" in out
    # under RVO there is no fallback note (it is the native field)
    assert "lotc-file-fallback" not in render(RVO, ALL_FIELDS["file-input-field"])


def test_attrs_spread_lands_on_control():
    # :attrs="dict" merges a flat {name: value} dict onto the control (hx-*/data-*/
    # aria-*/generic); None or '' omits — one attribute for the whole htmx bundle.
    d = {"hx-get": "/v", "hx-trigger": "change", "data-k": "1", "hx-vals": None, "aria-x": ""}
    src = '<c-text-input-field id="a" name="a" label="A" :attrs="d"/>'
    for ds in (RVO, NLDD):
        out = " ".join(_env(ds).from_string(src).render(d=d).split())
        assert 'hx-get="/v"' in out and 'hx-trigger="change"' in out and 'data-k="1"' in out
        assert "hx-vals" not in out  # None omitted
        assert "aria-x" not in out  # '' omitted


@pytest.mark.parametrize("name,src", ALL_FIELDS.items())
def test_attrs_spread_works_for_every_field(name, src):
    spread = (
        src.replace("/>", ' :attrs="d"/>', 1) if src.rstrip().endswith("/>") else src.replace(">", ' :attrs="d">', 1)
    )
    for ds in (RVO, NLDD):
        out = _env(ds).from_string(spread).render(d={"hx-post": "/save"})
        assert 'hx-post="/save"' in out


def test_required_marks_optional_convention_under_nldd():
    # Dutch-gov convention marks OPTIONAL, so a required field is not marked optional.
    req = render(NLDD, '<c-text-input-field id="a" name="a" label="A" required="true"/>')
    opt = render(NLDD, '<c-text-input-field id="a" name="a" label="A"/>')
    assert " optional" not in req.split("data-lotc-component")[0]
    assert " optional" in opt.split("data-lotc-component")[0]
