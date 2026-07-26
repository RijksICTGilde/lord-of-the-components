"""Known bugs recorded as xfail tests (plan v7 T1.4).

Each test asserts the CORRECT behavior, which the current BeautifulSoup-based
pipeline violates. They are marked xfail(strict=True) so that when the rewrite
(F2 parser / F3 Python renderer) fixes them, the test xpasses and turns into a
failure — the signal to drop the xfail marker in that phase.
"""

import pytest

pytestmark = pytest.mark.usefixtures("render")


@pytest.mark.xfail(
    strict=True,
    reason="_restore_jinja_tags() runs html.unescape() over the whole output, "
    "turning &amp; into a bare & (F2 removes this).",
)
def test_ampersand_entity_preserved_in_content(render):
    html = render("<c-strong>Tom &amp; Jerry</c-strong>")
    assert "Tom &amp; Jerry" in html


@pytest.mark.xfail(
    strict=True,
    reason="The label/content text goes through `| safe`, so user data is not "
    "escaped — an XSS hole (F3 escapes prop values).",
)
def test_script_in_label_is_escaped(render):
    html = render('<c-button label="&lt;script&gt;alert(1)&lt;/script&gt;"></c-button>')
    assert "<script>alert(1)</script>" not in html
    assert "&lt;script&gt;" in html


@pytest.mark.xfail(
    strict=True,
    reason="BeautifulSoup lowercases attribute names; the F2 parser preserves "
    "the source casing.",
)
def test_attribute_name_casing_preserved(render):
    html = render('<c-button data-testId="x">Hi</c-button>')
    assert "data-testId" in html


@pytest.mark.xfail(
    strict=True,
    reason="The generator emits closing tags on void elements (e.g. <img></img>); "
    "the new renderer omits them.",
)
def test_void_elements_have_no_closing_tag(render):
    html = render('<c-card image="/img.png" title="T">Body</c-card>')
    assert "</img>" not in html
