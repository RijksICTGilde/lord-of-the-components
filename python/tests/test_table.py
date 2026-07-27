"""Data table — table / table-head / table-row / th / td (plan v7 F9, batch table).

RVO renders a native <table class="rvo-table"> (header row of <th>, body rows of
<td>); NLDD renders a grid-based <nldd-table columns> with <nldd-table-row> and
<nldd-cell>, the header row marked slot="header". One composable markup drives
both.
"""

from pathlib import Path

import pytest
from jinja2 import Environment, FileSystemLoader

from lord_of_the_components import setup_components

PKG = Path(__file__).resolve().parent.parent / "src" / "lord_of_the_components"


def _env(theme):
    env = Environment(loader=FileSystemLoader([str(PKG / "templates")]), autoescape=True)
    setup_components(env, registry_path=str(PKG / "registry.json"), theme=theme)
    return env


TABLE = (
    '<c-table columns="1fr 1fr auto">'
    "<c-table-head><c-th>Naam</c-th><c-th>Rol</c-th><c-th numeric>Aantal</c-th></c-table-head>"
    "<c-table-row><c-td>Jan</c-td><c-td>Admin</c-td><c-td numeric>3</c-td></c-table-row>"
    "</c-table>"
)


# ── RVO ────────────────────────────────────────────────────────────────────────


@pytest.fixture
def rvo():
    env = _env("rvo")
    return lambda s: env.from_string(s).render()


def test_rvo_native_table(rvo):
    html = rvo(TABLE)
    assert '<div class="rvo-table--responsive"' in html
    assert '<table class="rvo-table">' in html
    assert '<tr class="rvo-table-row"' in html
    assert '<th class="rvo-table-header"' in html
    assert '<td class="rvo-table-cell"' in html
    assert "Naam" in html and "Jan" in html


def test_rvo_numeric_modifier(rvo):
    html = rvo(TABLE)
    assert "rvo-table-header--numeric" in html
    assert "rvo-table-cell--numeric" in html


def test_rvo_th_td_standalone(rvo):
    assert rvo("<c-th>H</c-th>").startswith("<th")
    assert rvo("<c-td>C</c-td>").startswith("<td")


# ── NLDD ───────────────────────────────────────────────────────────────────────


@pytest.fixture
def nldd():
    env = _env("nldd")
    return lambda s: env.from_string(s).render()


def test_nldd_grid_table(nldd):
    html = nldd(TABLE)
    assert '<nldd-table' in html and 'columns="1fr 1fr auto"' in html
    assert 'slot="header"' in html  # the header row
    assert "<nldd-table-row" in html
    assert "<nldd-cell" in html
    assert "Naam" in html and "Jan" in html


def test_nldd_cells_are_uniform(nldd):
    # th and td both become nldd-cell; header-ness is on the row, not the cell.
    assert nldd("<c-th>H</c-th>").startswith("<nldd-cell")
    assert nldd("<c-td>C</c-td>").startswith("<nldd-cell")


def test_nldd_columns_optional(nldd):
    html = nldd("<c-table><c-table-row><c-td>x</c-td></c-table-row></c-table>")
    assert "<nldd-table" in html
    assert "columns=" not in html  # omitted when not provided


# ── escaping ─────────────────────────────────────────────────────────────────


def test_columns_value_attr_escaped(nldd):
    # A value attribute is HTML-escaped (esc), like every other value attr.
    html = nldd('<c-table columns="a&b"><c-table-row><c-td>x</c-td></c-table-row></c-table>')
    assert 'columns="a&amp;b"' in html and 'columns="a&b"' not in html
