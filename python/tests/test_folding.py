"""Constant folding tests (plan v7 F4).

Folded and unfolded output must be identical for every case, so folding is a
pure performance optimization. Also checks the {% raw %} guard and mixed
static/dynamic nesting.
"""

import json
import sys
from pathlib import Path

import pytest
from jinja2 import Environment, FileSystemLoader
from markupsafe import Markup

from lord_of_the_components import setup_components
from lord_of_the_components.extension import ComponentExtension

TESTS_DIR = Path(__file__).resolve().parent
TOOLS_DIR = TESTS_DIR.parent / "tools"
PACKAGE_DIR = TESTS_DIR.parent / "src" / "lord_of_the_components"
TEMPLATES_DIR = PACKAGE_DIR / "templates"
REGISTRY_JSON = PACKAGE_DIR / "registry.json"
GOLDEN_MATRIX = TESTS_DIR / "golden" / "matrix.json"

sys.path.insert(0, str(TOOLS_DIR))
from htmlnorm import normalize  # noqa: E402

CASES = json.loads(GOLDEN_MATRIX.read_text(encoding="utf-8"))["cases"] if GOLDEN_MATRIX.exists() else []


def _env(fold: bool) -> Environment:
    env = Environment(loader=FileSystemLoader([str(TEMPLATES_DIR)]), autoescape=True)
    setup_components(env, design_systems=["rvo"], registry_path=str(REGISTRY_JSON), fold=fold)
    return env


@pytest.fixture(scope="module")
def folded_env():
    return _env(True)


@pytest.fixture(scope="module")
def unfolded_env():
    return _env(False)


@pytest.mark.parametrize(
    "case",
    CASES,
    ids=[f"{c['theme']}-{c['component']}-{c['case_id']}" for c in CASES],
)
def test_fold_matches_unfold(case, folded_env, unfolded_env):
    markup = case["markup"]
    folded = folded_env.from_string(markup).render()
    unfolded = unfolded_env.from_string(markup).render()
    assert normalize(folded) == normalize(unfolded)


def _preprocess(env: Environment, source: str) -> str:
    return env.extensions[ComponentExtension.identifier].preprocess(source, "t.html")


def test_static_component_is_folded(folded_env):
    out = _preprocess(folded_env, '<c-button type="primary">Save</c-button>')
    # Folded: literal HTML, no runtime call.
    assert out.startswith("<button")
    assert "_lotc_rvo_button" not in out


def test_dynamic_component_is_not_folded(folded_env):
    out = _preprocess(folded_env, '<c-button :type="chosen">Save</c-button>')
    assert "_lotc_rvo_button(" in out


def test_interpolated_value_is_not_folded(folded_env):
    out = _preprocess(folded_env, '<c-button type="{{ kind }}">Save</c-button>')
    assert "_lotc_rvo_button(" in out


def test_fold_disabled_emits_call(unfolded_env):
    out = _preprocess(unfolded_env, '<c-button type="primary">Save</c-button>')
    assert "_lotc_rvo_button(" in out


def test_static_child_in_dynamic_parent(folded_env):
    # card is jinja-backed; the static button inside folds to literal HTML.
    html = folded_env.from_string("<c-card><c-button type='primary'>Go</c-button></c-card>").render()
    assert "utrecht-button" in html
    assert "Go" in html


def test_static_jinja_component_is_folded(folded_env):
    # card is jinja-backend under RVO; a fully-static instance folds to literal
    # HTML at compile time (no runtime include and no macro call).
    out = _preprocess(folded_env, '<c-card title="Aanvragen">Body</c-card>')
    assert "{% include" not in out and "_lotc_jinja_card(" not in out
    assert "rvo-card" in out and "Aanvragen" in out


def test_dynamic_jinja_component_calls_the_macro(folded_env):
    # A dynamic attribute can't fold -> it calls the component's lotc_render macro
    # at render time (a compiled function call, not a slow {% include %}).
    out = _preprocess(folded_env, '<c-card :title="t">Body</c-card>')
    assert "_lotc_jinja_card(" in out and "{% include" not in out


def test_jinja_fold_matches_unfold(folded_env, unfolded_env):
    src = '<c-card title="Aanvragen" href="#">Bekijk je aanvragen.</c-card>'
    assert normalize(folded_env.from_string(src).render()) == normalize(
        unfolded_env.from_string(src).render()
    )


def test_raw_guard_wraps_jinja_in_folded_output(folded_env):
    # Directly fold content that contains Jinja delimiters: the result must be
    # wrapped in {% raw %} so Jinja does not re-interpret it.
    ext = folded_env.extensions[ComponentExtension.identifier]
    comp_def = ext.registry.get_component("paragraph")
    out = ext._fold_component("paragraph", comp_def, {}, Markup("hi {{ x }}"))
    assert out.startswith("{% raw %}")
    assert out.endswith("{% endraw %}")
    assert "{{ x }}" in out
