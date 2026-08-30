"""A boolean prop a component declares must reach the output.

`c-checkbox-field` declared no `disabled`, and `:disabled="true"` was dropped
without a word — the markup read as if the control was locked while the rendered
element was not. An operator could not untick a box, there was no error anywhere,
and the fix that was written did nothing (RIG-Cluster, RC-151).

Two things came out of that and both are pinned here. The gate is on the OUTPUT,
not on the call — their advice, and the right one, because the call looked
correct in the source. And the `:` spelling now gets the same name check the
literal one always had: a typo was loud as `disbaled="x"` and silent as
`:disbaled="x"`.
"""

import json
from pathlib import Path

import pytest
from jinja2 import Environment, FileSystemLoader

from lord_of_the_components import ComponentError, setup_components

ROOT = Path(__file__).resolve().parents[2]
PKG = ROOT / "python/src/lord_of_the_components"
PACKAGES = ROOT / "packages"


@pytest.fixture(scope="module")
def render():
    env = Environment(
        loader=FileSystemLoader(
            [
                str(PKG / "templates"),
                str(PACKAGES / "lotc-nldd/src/lotc_nldd/templates"),
                str(PACKAGES / "lotc-forms/src/lotc_forms/templates"),
            ]
        ),
        autoescape=True,
    )
    setup_components(env, design_systems=["nldd", "lotc-forms"], registry_path=str(PKG / "registry.json"))
    return lambda src: env.from_string(src).render()


def _forms_components():
    registry = json.loads((PACKAGES / "lotc-forms/src/lotc_forms/registry.json").read_text(encoding="utf-8"))
    return registry["components"]


def test_every_declared_boolean_changes_the_output(render):
    """Setting it must do something. That is the whole contract.

    Asserting "the attribute name appears" was the naive version and wrong: some
    booleans change the rendering instead of adding an attribute — `show-copy`
    swaps the control for a copy box, and `required` REMOVES the frame's
    "optional" label. Comparing on/off needs no table of exceptions and still
    catches the only real failure, which is nothing happening at all.
    """
    silent = []
    for component in _forms_components():
        name = component["name"]
        for attribute in component["attributes"]:
            if attribute.get("type") != "boolean":
                continue
            flag = attribute["name"]
            # Only props the component actually declares — passing an unknown
            # one is an error now, which is the other half of this fix.
            declared = {a["name"] for a in component["attributes"]}
            props = " ".join(
                f'{prop}="{value}"'
                for prop, value in (("id", "x"), ("name", "x"), ("label", "L"), ("value", "v"))
                if prop in declared
            )
            base = f"<c-{name} {props}"
            try:
                on = render(f'{base} :{flag}="True"></c-{name}>')
                off = render(f"{base}></c-{name}>")
            except ComponentError as exc:
                silent.append(f"{name}.{flag} (render failed: {str(exc)[:50]})")
                continue
            if on == off:
                silent.append(f"{name}.{flag}")
    assert not silent, (
        "these booleans are declared but change nothing when set, so the markup "
        f"says something the rendered element does not do: {silent}"
    )


def test_checkbox_field_can_be_locked(render):
    """The report itself, kept as its own case."""
    out = render('<c-checkbox-field id="c" name="c" label="L" :disabled="true"/>')
    assert "<nldd-checkbox-field" in out and " disabled" in out


def test_an_unknown_expression_attribute_is_an_error_too(render):
    """`:disbaled="x"` used to vanish while `disbaled="x"` was an error."""
    with pytest.raises(ComponentError, match="Unknown attribute"):
        render('<c-button label="x" :disbaled="true"/>')
    # …while the legitimate ':' names keep working
    render('<c-button label="x" :type="t" :data-x="t" :attrs="{}"/>')


def test_the_error_wiring_survived_in_the_single_checkbox_branch(render):
    """That branch has its own error markup, not the shared macro's.

    It still emitted `nldd-form-field-error-text`, which 0.8.84 removed — the
    same silent breakage as the fields, in the one template the earlier sweep
    did not touch.
    """
    out = render('<c-checkbox-field id="c" name="c" label="L" error="Fout"/>')
    assert "form-field-error-text" not in out
    assert 'unmet="c-error"' in out and 'nldd-validation-item id="c-error"' in out


def test_a_boolean_in_the_spread_is_written_the_way_html_means_one(render):
    """`True` is the bare attribute; `False` is its ABSENCE.

    `disabled="False"` DISABLES an element — for a boolean attribute any
    presence counts — so rendering False as a string did the opposite of what
    was asked. And the empty string, the shape an author reaches for first, was
    dropped by the "None or '' omits" rule, which left `'disabled'` as the only
    spelling that worked (RIG-Cluster, RC-151).
    """
    import re as _re

    for component, closing in (
        ('<c-text-input-field id="t" name="t" label="L"', "</c-text-input-field>"),
        ('<c-button label="x"', "</c-button>"),
    ):
        on = render(f"{component} :attrs=\"{{'data-lock': True}}\">{closing}")
        off = render(f"{component} :attrs=\"{{'data-lock': False}}\">{closing}")
        empty = render(f"{component} :attrs=\"{{'data-lock': ''}}\">{closing}")
        assert _re.search(r"data-lock(?=[\s/>])", on), "True must render the bare attribute"
        assert 'data-lock="True"' not in on
        assert "data-lock" not in off, "False must render nothing at all"
        assert "data-lock" not in empty


def test_both_backends_agree_about_it(render):
    """The jinja path and the python-backend path are separate emitters.

    c-button is python-backend, c-text-input-field is a jinja template; a fix in
    one of them is half a fix.
    """
    jinja = render('<c-text-input-field id="t" name="t" label="L" :attrs="{\'data-a\': True}"/>')
    python_backend = render('<c-button label="x" :attrs="{\'data-a\': True}"/>')
    assert " data-a" in jinja and " data-a" in python_backend
    assert 'data-a="' not in jinja and 'data-a="' not in python_backend
