"""Universal :attrs spread — merge a {name: value} dict onto any component.

lotc-forms fields have their own render_attrs; core components get the spread via
render_extra (python backend) / render_extra_attributes (jinja backend). None or ''
omits an entry (same rule as :prop="expr or none").
"""

from jinja2 import Environment, FileSystemLoader

from lord_of_the_components import setup_components


def _render(ds, src, **ctx):
    env = Environment(autoescape=True, loader=FileSystemLoader([]))
    setup_components(env, design_systems=ds)
    return " ".join(env.from_string(src).render(**ctx).split())


def test_attrs_on_python_backend_component():
    out = _render(["nldd"], '<c-tag :attrs="d">x</c-tag>', d={"data-k": "1", "hx-get": "/y", "z": None})
    assert 'data-k="1"' in out and 'hx-get="/y"' in out
    assert " z=" not in out  # None omitted


def test_attrs_exposes_nldd_cell_width_on_th_td():
    # RIG-Cluster: c-th/c-td did not forward nldd-cell width/alignment; :attrs does.
    out = _render(
        ["nldd"],
        '<c-table columns="40% auto"><c-table-head><c-th :attrs="d">N</c-th></c-table-head></c-table>',
        d={"width": "40%", "horizontal-alignment": "right"},
    )
    assert 'width="40%"' in out and 'horizontal-alignment="right"' in out


def test_attrs_empty_string_omitted():
    out = _render(["nldd"], '<c-tag :attrs="d">x</c-tag>', d={"data-a": "", "data-b": "keep"})
    assert "data-a" not in out and 'data-b="keep"' in out
