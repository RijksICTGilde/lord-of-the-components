"""Tests for the golden HTML normalizer (tools/htmlnorm.py).

The golden contract relies on normalize() making indented and compact HTML
compare equal, so its behavior is worth pinning directly.
"""

import sys
from pathlib import Path

TOOLS_DIR = Path(__file__).resolve().parent.parent / "tools"
sys.path.insert(0, str(TOOLS_DIR))
from htmlnorm import normalize  # noqa: E402


def test_collapses_whitespace_between_tags():
    indented = "<div>\n    <span>Hi</span>\n</div>"
    compact = "<div><span>Hi</span></div>"
    assert normalize(indented) == normalize(compact)


def test_collapses_runs_of_whitespace_in_text():
    assert normalize("<p>a    b</p>") == normalize("<p>a b</p>")


def test_sorts_class_tokens():
    assert normalize('<div class="b a c"></div>') == normalize('<div class="a b c"></div>')


def test_sorts_attributes():
    assert normalize('<a href="/x" id="y"></a>') == normalize('<a id="y" href="/x"></a>')


def test_idempotent():
    html = '<div class="b a"><span id="s">  x  </span></div>'
    once = normalize(html)
    assert normalize(once) == once


def test_distinguishes_different_content():
    assert normalize("<p>a</p>") != normalize("<p>b</p>")


def test_distinguishes_different_classes():
    assert normalize('<div class="a"></div>') != normalize('<div class="a b"></div>')


def test_entities_preserved():
    # A raw ampersand in text is preserved (not silently altered).
    assert "&amp;" in normalize("<p>Tom &amp; Jerry</p>")
