"""Basic HTML element components (plan v7 F9, batch D)."""

import pytest


@pytest.mark.parametrize(
    "markup, tag, text",
    [
        ("<c-div>x</c-div>", "div", "x"),
        ("<c-span>x</c-span>", "span", "x"),
        ("<c-small>x</c-small>", "small", "x"),
        ("<c-b>x</c-b>", "b", "x"),
        ("<c-i>x</c-i>", "i", "x"),
        ("<c-code>x=1</c-code>", "code", "x=1"),
        ("<c-blockquote>x</c-blockquote>", "blockquote", "x"),
    ],
)
def test_basic_element_renders(render, markup, tag, text):
    html = render(markup)
    assert f"<{tag}" in html
    assert f"</{tag}>" in html
    assert text in html
    assert f'data-lotc-component="{tag}"' in html


def test_hr_is_void(render):
    html = render("<c-hr/>")
    assert "<hr" in html
    assert "</hr>" not in html


def test_div_passes_class_and_generic_attrs(render):
    html = render('<c-div class="box" data-x="1">y</c-div>')
    assert "box" in html
    assert 'data-x="1"' in html


def test_basic_element_escapes_nothing_special_but_renders_content(render):
    html = render("<c-code>a &amp; b</c-code>")
    assert "a &amp; b" in html
