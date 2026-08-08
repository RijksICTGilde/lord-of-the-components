"""c-data-list now has an NLDD implementation (key-value <dl>), not just RVO."""

from jinja2 import Environment, FileSystemLoader

from lord_of_the_components import setup_components


def _render(ds, src):
    env = Environment(autoescape=True, loader=FileSystemLoader([]))
    setup_components(env, design_systems=ds)
    return " ".join(env.from_string(src).render().split())


SRC = "<c-data-list><dt>Naam</dt><dd>Jan</dd></c-data-list>"


def test_data_list_renders_under_nldd():
    out = _render(["nldd"], SRC)
    assert "lotc-unimplemented" not in out
    assert 'class="lotc-data-list' in out and "<dt>Naam</dt><dd>Jan</dd>" in out


def test_data_list_still_rvo():
    assert "rvo-data-list" in _render(["rvo"], SRC)
