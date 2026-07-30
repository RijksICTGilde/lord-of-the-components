"""Theme-agnostic layout primitives — app-shell and auto-grid (plan v7 F9, layout).

These are pure structural CSS-grid layouts (static/lotc/layout.css). One jinja
template serves BOTH themes, so the same markup lays out identically under RVO
and NLDD — the tests assert that.
"""

from pathlib import Path

import pytest
from jinja2 import Environment, FileSystemLoader

from lord_of_the_components import setup_components

PKG = Path(__file__).resolve().parent.parent / "src" / "lord_of_the_components"


def _env(theme):
    env = Environment(loader=FileSystemLoader([str(PKG / "templates")]), autoescape=True)
    setup_components(env, registry_path=str(PKG / "registry.json"),
                     design_systems=["lotc-layout", theme])
    return env


@pytest.fixture
def rvo():
    env = _env("rvo")
    return lambda s: env.from_string(s).render()


SHELL = (
    '<c-app-shell width="12rem">'
    '<template slot="header">Kop</template>'
    '<template slot="sidebar">Menu</template>'
    "Hoofdinhoud"
    '<template slot="footer">Voet</template>'
    "</c-app-shell>"
)


@pytest.mark.parametrize("theme", ["rvo", "nldd"])
def test_app_shell_regions(theme):
    html = _env(theme).from_string(SHELL).render()
    assert 'class="lotc-app-shell"' in html
    assert '<header\n        class="lotc-app-shell__header">' in html or "lotc-app-shell__header" in html
    assert "lotc-app-shell__sidebar" in html
    assert "lotc-app-shell__main" in html
    assert "lotc-app-shell__footer" in html
    # Slot content and body land in the right regions.
    assert "Kop" in html and "Menu" in html and "Voet" in html
    assert "Hoofdinhoud" in html
    # Sidebar width becomes a CSS custom property.
    assert "--lotc-sidebar-width: 12rem;" in html


def test_app_shell_identical_across_themes():
    # Layout is theme-agnostic: RVO and NLDD produce byte-identical output.
    rvo = _env("rvo").from_string(SHELL).render()
    nldd = _env("nldd").from_string(SHELL).render()
    assert rvo == nldd


def test_app_shell_sidebar_right():
    html = _env("rvo").from_string("<c-app-shell direction=\"right\">x</c-app-shell>").render()
    assert "lotc-app-shell--sidebar-right" in html


def test_app_shell_omits_absent_regions():
    html = _env("rvo").from_string("<c-app-shell>only main</c-app-shell>").render()
    assert "lotc-app-shell__main" in html
    assert "lotc-app-shell__header" not in html
    assert "lotc-app-shell__sidebar" not in html


@pytest.mark.parametrize("theme", ["rvo", "nldd"])
def test_auto_grid(theme):
    html = _env(theme).from_string(
        '<c-auto-grid min="20rem" gap="2rem">cells</c-auto-grid>'
    ).render()
    assert 'class="lotc-auto-grid"' in html
    assert "--lotc-col-min: 20rem;" in html and "--lotc-grid-gap: 2rem;" in html
    assert "cells" in html


def test_auto_grid_defaults_without_style():
    html = _env("rvo").from_string("<c-auto-grid>cells</c-auto-grid>").render()
    assert 'class="lotc-auto-grid"' in html
    assert "style=" not in html  # no CSS vars set -> CSS defaults apply


# ── stack: uniform direction primitive ────────────────────────────────────────


def test_stack_vertical_default(rvo):
    html = rvo("<c-stack>x</c-stack>")
    assert 'class="lotc-stack"' in html
    assert "lotc-stack--horizontal" not in html


def test_stack_horizontal(rvo):
    assert "lotc-stack--horizontal" in rvo('<c-stack direction="horizontal">x</c-stack>')


def test_stack_modifiers(rvo):
    html = rvo('<c-stack direction="horizontal" gap="2rem" wrap align="center" justify="between">x</c-stack>')
    assert "lotc-stack--wrap" in html
    assert "lotc-stack--align-center" in html
    assert "lotc-stack--justify-between" in html
    assert "--lotc-stack-gap: 2rem;" in html


@pytest.mark.parametrize("direction", ["vertical", "horizontal"])
def test_stack_identical_across_themes(direction):
    # The direction is OUR flexbox, so it is enforced the same way in both themes.
    src = f'<c-stack direction="{direction}" gap="1rem">a</c-stack>'
    assert _env("rvo").from_string(src).render() == _env("nldd").from_string(src).render()


# ── columns: explicit responsive column counts ────────────────────────────────


def test_columns_sets_only_given_breakpoints(rvo):
    html = rvo('<c-columns columns="1" md="2" lg="4" gap="1rem">x</c-columns>')
    assert 'class="lotc-columns"' in html
    assert "--lotc-cols: 1;" in html
    assert "--lotc-cols-md: 2;" in html
    assert "--lotc-cols-lg: 4;" in html
    assert "--lotc-columns-gap: 1rem;" in html
    # sm was not given -> no empty custom property (would defeat the var() fallback).
    assert "--lotc-cols-sm" not in html


def test_columns_base_only(rvo):
    html = rvo('<c-columns columns="3">x</c-columns>')
    assert 'style="--lotc-cols: 3;"' in html


def test_columns_identical_across_themes():
    src = '<c-columns columns="1" md="2" lg="3" gap="1rem">a</c-columns>'
    assert _env("rvo").from_string(src).render() == _env("nldd").from_string(src).render()
