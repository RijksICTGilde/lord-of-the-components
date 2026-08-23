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


def test_file_input_uses_the_native_field_per_theme():
    # NLDD gained nldd-file-field (0.8.80); no more RVO fallback badge under NLDD.
    nldd = render(NLDD, ALL_FIELDS["file-input-field"])
    assert "nldd-file-field" in nldd and "lotc-file-fallback" not in nldd
    rvo = render(RVO, ALL_FIELDS["file-input-field"])
    assert 'type="file"' in rvo


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


def test_select_field_options_are_valid_in_the_dom():
    # A browser drops non-<option> children of a native <select>. Under RVO the
    # options must be native <option>; under NLDD the select must be an
    # nldd-combo-box/nldd-menu (where c-option -> nldd-menu-item is valid), never a
    # raw <select> holding nldd-menu-item.
    src = (
        '<c-select-field id="s" name="s" label="S">'
        '<c-option value="a" label="A"/><c-option value="b" label="B"/></c-select-field>'
    )
    rvo = render(RVO, src)
    assert "<option" in rvo and "nldd-menu-item" not in rvo
    nldd = render(NLDD, src)
    assert "nldd-combo-box" in nldd and "nldd-menu-item" in nldd
    assert "<select" not in nldd  # no native select wrapping menu-items


def test_checkbox_field_single_renders_a_control():
    # A single labelled checkbox (no children) must render a real control, not an
    # empty <div>, and carry `checked`.
    single = '<c-checkbox-field id="a" name="a" label="Akkoord" checked="true"/>'
    rvo = render(RVO, single)
    assert 'type="checkbox"' in rvo and "checked" in rvo
    assert "<div></div>" not in rvo
    nldd = render(NLDD, single)
    assert "nldd-checkbox-field" in nldd and "checked" in nldd
    assert "<div></div>" not in nldd


def test_checkbox_field_group_still_renders_children():
    grp = ALL_FIELDS["checkbox-field"]
    for ds in (RVO, NLDD):
        out = render(ds, grp)
        assert "<div></div>" not in out
        assert 'type="checkbox"' in out or "nldd-checkbox-field" in out


def test_required_marks_optional_convention_under_nldd():
    # Dutch-gov convention marks OPTIONAL, so a required field is not marked optional.
    req = render(NLDD, '<c-text-input-field id="a" name="a" label="A" required="true"/>')
    opt = render(NLDD, '<c-text-input-field id="a" name="a" label="A"/>')
    assert " optional" not in req.split("data-lotc-component")[0]
    assert " optional" in opt.split("data-lotc-component")[0]


def test_select_field_native_keeps_a_real_select_under_nldd():
    # For JS-driven screens (value / new Option() / change), `native` renders a real
    # <select> with a theme skin instead of NLDD's web-component combo-box.
    src = '<c-select-field id="s" name="s" label="S" native><option value="a">A</option></c-select-field>'
    nldd = render(NLDD, src)
    assert "<select" in nldd and "nldd-combo-box" not in nldd
    assert "lotc-native-select" in nldd and "<option value=\"a\">A</option>" in nldd
    # default (no native) still uses the combo-box
    combo = render(NLDD, '<c-select-field id="s" name="s" label="S"><c-option value="a" label="A"/></c-select-field>')
    assert "nldd-combo-box" in combo


def test_select_field_value_reaches_the_control():
    # Regression: value was declared but never emitted, so the selection was lost.
    opt = '<c-option value="rig-prd-foo" label="rig-prd-foo"/>'
    combo = render(NLDD, f'<c-select-field id="ns" name="ns" label="NS" value="rig-prd-foo">{opt}</c-select-field>')
    assert 'value="rig-prd-foo"' in combo.split("<nldd-menu")[0]  # on the combo-box
    native = render(
        NLDD,
        '<c-select-field id="ns" name="ns" label="NS" native value="rig-prd-foo">'
        '<option value="rig-prd-foo">rig-prd-foo</option></c-select-field>',
    )
    # `<select value="…">` is not a thing in HTML: the value travels as a data
    # attribute and forms.js applies it. It used to be an inline <script> per select.
    assert 'data-lotc-value="rig-prd-foo"' in native
    assert "<script" not in native
    plain = render(NLDD, f'<c-select-field id="ns" name="ns" label="NS">{opt}</c-select-field>')
    assert "<script>" not in plain  # no value -> no script


def test_text_input_field_show_copy_renders_a_copy_box_matching_secret_field():
    # `show-copy` on text-input-field = a read-only copyable value box (secret-field
    # chrome) inside the label frame, so secret and non-secret values line up.
    import re

    out = render(NLDD, '<c-text-input-field id="pn" name="pn" label="Projectnaam" value="my-project" show-copy/>')
    assert "nldd-form-field" in out and 'label="Projectnaam"' in out  # labelled frame
    assert "lotc-copyfield" in out  # same box class family as secret-field chrome
    assert 'nldd-icon name="clipboard"' in out  # same clipboard glyph as secret-field
    assert 'data-value="my-project"' in out and "data-lotc-copy" in out
    code = re.search(r"<code[^>]*>(.*?)</code>", out).group(1).strip()
    assert code == "my-project"  # value shown (not an input)
    # without show-copy it is still the native editable field
    plain = render(NLDD, '<c-text-input-field id="x" name="x" label="Naam" value="v"/>')
    assert "nldd-text-field" in plain and "lotc-copyfield" not in plain


def test_field_carries_an_event_handler():
    """A field must have a supported way to bind a handler.

    `on*` keys are refused in an `:attrs` spread (a spread built from request
    data would otherwise turn a data value into executable script), and the
    `@event` syntax is the alternative the error points at — but the field
    wrappers dropped it, so for a field both doors were shut. Reported by
    RIG-Cluster (RC-151), who had to fall back to a data attribute plus a script.
    """
    for src, expected in [
        ('<c-select-field id="s" name="s" label="L" native="true" @change="go()">'
         '<option value="a">A</option></c-select-field>', 'onchange="go()"'),
        ('<c-select-field id="s" name="s" label="L" @change="go()">'
         '<c-option value="a" label="A"/></c-select-field>', 'onchange="go()"'),
        ('<c-checkbox-field id="c" name="c" label="L" @change="go()"/>', 'onchange="go()"'),
        ('<c-text-input-field id="t" name="t" label="L" @input="go()"/>', 'oninput="go()"'),
    ]:
        assert expected in render(NLDD, src), f"no handler on: {src}"


def test_field_carries_data_aria_and_htmx_attributes():
    """Written directly on the tag, not only through an :attrs spread."""
    out = render(NLDD, '<c-text-input-field id="t" name="t" label="L" data-x="1" aria-label="A" hx-get="/u"/>')
    assert 'data-x="1"' in out and 'aria-label="A"' in out and 'hx-get="/u"' in out


def test_field_attrs_spread_still_works():
    out = render(NLDD, "<c-text-input-field id=\"t\" name=\"t\" label=\"L\" :attrs=\"{'data-y': '2'}\"/>")
    assert 'data-y="2"' in out
