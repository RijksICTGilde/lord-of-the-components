"""Tests for the generated-renderer hot-path helpers (runtime.py)."""

from lord_of_the_components.runtime import Markup, esc, merge_class, render_extra


def test_esc_escapes_html():
    assert str(esc("<b> & 'x'")) == "&lt;b&gt; &amp; &#39;x&#39;"


def test_esc_none_is_empty():
    assert str(esc(None)) == ""


def test_render_extra_empty():
    assert str(render_extra(None)) == ""
    assert str(render_extra({})) == ""


def test_render_extra_data_aria_hx():
    out = str(render_extra({"data-x": "1", "aria-label": "L", "hx-get": "/u"}))
    assert ' data-x="1"' in out
    assert ' aria-label="L"' in out
    assert ' hx-get="/u"' in out


def test_render_extra_generic_html_attrs():
    out = str(render_extra({"id": "a", "title": "t", "style": "x", "role": "img", "tabindex": "0"}))
    for pair in (' id="a"', ' title="t"', ' style="x"', ' role="img"', ' tabindex="0"'):
        assert pair in out


def test_render_extra_events():
    out = str(render_extra({"@click": "f()", "@hx-post": "/p"}))
    assert ' onclick="f()"' in out
    assert ' hx-post="/p"' in out  # @hx-* keeps the hx- attribute name


def test_render_extra_escapes_values():
    out = str(render_extra({"title": '"><script>'}))
    assert "<script>" not in out
    assert "&lt;script&gt;" in out


def test_render_extra_skips_unknown_and_none():
    out = str(render_extra({"type": "primary", "data-x": None, "data-y": "keep"}))
    assert "type" not in out  # a defined prop, not passthrough
    assert "data-x" not in out  # None skipped
    assert ' data-y="keep"' in out


def test_render_extra_returns_markup():
    assert isinstance(render_extra({"id": "a"}), Markup)


def test_merge_class():
    assert merge_class("base", None) == "base"
    assert merge_class("base", "") == "base"
    assert merge_class("base", "extra") == "base extra"
    assert merge_class("", "extra") == "extra"
