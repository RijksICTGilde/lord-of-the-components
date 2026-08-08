"""Regression: components inside a `{% extends %}` base template.

Jinja runs an extended parent's body with the CHILD's context, and copies
(snapshots) globals when the child render begins. Component macros register
lazily on the environment during preprocess; a parent template loaded only at
render time would register its `_lotc_jinja_*` macros too late, so they resolved
to Undefined ("'_lotc_jinja_app_shell' is undefined"). The extension now
pre-warms statically-named parents during the child's preprocess.
"""

from jinja2 import Environment, FileSystemLoader

from lord_of_the_components import setup_components


def _env(tmp_path, files):
    for fname, body in files.items():
        (tmp_path / fname).write_text(body)
    env = Environment(autoescape=True, loader=FileSystemLoader([str(tmp_path)]), auto_reload=False)
    setup_components(env, design_systems=["lotc-layout", "nldd", "lotc-forms"])
    return env


BASE = (
    '<c-app-shell width="16rem">'
    '<template slot="header">{% block header %}{% endblock %}</template>'
    "{% block main %}{% endblock %}"
    "</c-app-shell>"
)


def test_component_in_extended_base_renders(tmp_path):
    env = _env(
        tmp_path,
        {
            "base.html.j2": BASE,
            "page.html.j2": (
                '{% extends "base.html.j2" %}'
                '{% block header %}<c-header text="T" link="/">'
                '<c-menu type="bar" slot="utility"><c-menu-item label="X" href="/"/>'
                "</c-menu></c-header>{% endblock %}"
                '{% block main %}<c-heading type="h1" size="2" label="x"/>{% endblock %}'
            ),
        },
    )
    out = env.get_template("page.html.j2").render()
    assert "app-shell" in out and "undefined" not in out.lower()
    assert "nldd-menu-bar-item" in out or "menu-item" in out


def test_nested_extends_three_levels(tmp_path):
    env = _env(
        tmp_path,
        {
            "gb.html.j2": BASE,
            "mid.html.j2": ('{% extends "gb.html.j2" %}{% block header %}<c-header text="T" link="/"/>{% endblock %}'),
            "leaf.html.j2": (
                '{% extends "mid.html.j2" %}{% block main %}<c-heading type="h1" size="2" label="x"/>{% endblock %}'
            ),
        },
    )
    out = env.get_template("leaf.html.j2").render()
    assert "app-shell" in out and "undefined" not in out.lower()


def test_extends_child_includes_partial_with_components(tmp_path):
    # A child extends a base AND includes partials whose components must register
    # before the (extends) render snapshot — a `{% include %}` target is pre-warmed
    # just like the `{% extends %}` parent.
    env = _env(
        tmp_path,
        {
            "base.html.j2": BASE,
            "_partial.html.j2": '<c-card outline padding="md"><c-heading type="h3" size="4" label="K"/></c-card>',
            "dash.html.j2": (
                '{% extends "base.html.j2" %}{% block main %}{% include "_partial.html.j2" %}{% endblock %}'
            ),
        },
    )
    out = env.get_template("dash.html.j2").render()
    assert "undefined" not in out.lower() and "card" in out.lower()


def test_plain_include_in_slot_still_works(tmp_path):
    # The include path already worked (fresh context); guard against regressions.
    env = _env(
        tmp_path,
        {
            "partial.html.j2": (
                '<c-header text="T" link="/"><c-menu type="bar" slot="utility">'
                '<c-menu-item label="X" href="/"/></c-menu></c-header>'
            ),
            "outer.html.j2": (
                '<c-app-shell width="16rem">'
                '<template slot="header">{% include "partial.html.j2" %}</template>'
                '<c-heading type="h1" size="2" label="x"/></c-app-shell>'
            ),
        },
    )
    out = env.get_template("outer.html.j2").render()
    assert "app-shell" in out and "undefined" not in out.lower()
