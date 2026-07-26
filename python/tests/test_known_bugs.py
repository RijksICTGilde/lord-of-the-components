"""Escaping / rendering correctness — the bugs the rewrite fixes (plan v7).

F2 (the parser) fixed two of the original T1.4 bugs, so those are now plain
passing tests. The remaining two are still marked xfail(strict=True) and flip to
failures — the signal to drop the marker — once F3 (the Python renderer / escape
of prop values) and the void-element generator fix land.
"""

import pytest

pytestmark = pytest.mark.usefixtures("render")


def test_ampersand_entity_preserved_in_content(render):
    # FIXED in F2: preprocessing no longer runs html.unescape() over the output.
    html = render("<c-strong>Tom &amp; Jerry</c-strong>")
    assert "Tom &amp; Jerry" in html


def test_attribute_name_casing_preserved(render):
    # FIXED in F2: the parser preserves source casing (BeautifulSoup lowercased).
    html = render('<c-button data-testId="x">Hi</c-button>')
    assert "data-testId" in html


def test_raw_html_in_prop_value_is_escaped(render):
    # FIXED in F3: the Python renderer escapes prop values (button is python-backed).
    html = render('<c-button label="<img src=x onerror=alert(1)>"></c-button>')
    assert "<img src=x onerror=alert(1)>" not in html
    assert "&lt;img" in html


def test_void_elements_have_no_closing_tag(render):
    # FIXED (F9): the generators omit closing tags for void elements.
    html = render('<c-card image="/img.png" title="T">Body</c-card>')
    assert "</img>" not in html
