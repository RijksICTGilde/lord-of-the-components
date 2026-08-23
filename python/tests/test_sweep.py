"""The sweep that lists where compile-time validation stops.

A literal value is checked against its enum (or the icon set) under strictness;
a computed one cannot be, because the compiler sees an expression rather than a
value. That boundary is a deliberate design choice — checking it would mean
validating on every render — but a boundary nobody can see is a blind spot.
RIG-Cluster (RC-151) asked for exactly this: not validation, just a list.
"""

from pathlib import Path

import pytest

from lord_of_the_components.registry import ComponentRegistry
from lord_of_the_components.sweep import main, sweep_source

ROOT = Path(__file__).resolve().parents[2]
NLDD_REGISTRY = ROOT / "packages/lotc-nldd/src/lotc_nldd/registry.json"


@pytest.fixture(scope="module")
def registry():
    reg = ComponentRegistry()
    reg.merge_fragment(NLDD_REGISTRY, "nldd")
    return reg


def _sweep(source, registry):
    return sweep_source(source, Path("t.j2"), registry)


def test_a_literal_is_not_reported(registry):
    """The compiler already rejects it under debug/LOTC_STRICT — no need to look."""
    assert _sweep('<c-avatar initials="B" size="sm"/>', registry) == []
    assert _sweep('<c-button label="x" type="primary"/>', registry) == []


def test_every_computed_form_on_an_enum_is_reported(registry):
    for source in (
        '<c-avatar initials="B" :size="row.size"/>',
        '<c-avatar initials="B" size="{{ row.size }}"/>',
    ):
        found = _sweep(source, registry)
        assert len(found) == 1, source
        assert found[0].component == "avatar" and "size" in found[0].attribute
        assert "full" in found[0].allowed  # the allowed set travels with it


def test_a_spread_is_reported_because_names_and_values_are_both_hidden(registry):
    found = _sweep('<c-avatar initials="B" :attrs="{\'size\': row.size}"/>', registry)
    assert len(found) == 1 and found[0].attribute == "attrs"
    assert "every key and value" in found[0].reason
    assert "allowed:" not in found[0].format()  # it has no set to name


def test_icons_are_swept_too(registry):
    """Same boundary, same compile-time check — so the same blind spot."""
    found = _sweep('<c-icon :icon="row.pictogram"/>', registry)
    assert len(found) == 1
    assert "the theme's icon set" in found[0].format()


def test_an_ordinary_attribute_is_not_reported(registry):
    """Only values with a known set are worth listing; `label` has none."""
    assert _sweep('<c-button :label="row.title"/>', registry) == []


def test_line_numbers_point_at_the_tag(registry):
    source = '<c-avatar initials="B"/>\n\n<c-avatar :size="s"/>\n'
    found = _sweep(source, registry)
    assert len(found) == 1 and found[0].line == 3


def test_it_runs_as_a_command(tmp_path, capsys):
    template = tmp_path / "page.html.j2"
    template.write_text('<c-avatar initials="B" :size="row.size"/>\n', encoding="utf-8")
    assert main([str(tmp_path), "--design-systems", "nldd"]) == 0
    out = capsys.readouterr()
    assert "page.html.j2:1" in out.out
    assert "1 unchecked value(s)" in out.err


def test_an_unparseable_template_says_so_instead_of_passing(registry):
    """Silence would read as 'nothing to look at here'."""
    found = _sweep("<c-avatar", registry)
    assert len(found) == 1 and "could not be parsed" in found[0].reason
