"""Unit tests for the one-pass component parser (plan v7 F2 / T2.3)."""

import pytest

from lord_of_the_components.parser import (
    AttrKind,
    ComponentNode,
    ParseError,
    TemplateNode,
    TextNode,
    parse,
)


def _text(source: str, node) -> str:
    return source[node.span.start : node.span.end]


def _components(nodes):
    out = []
    for node in nodes:
        if isinstance(node, ComponentNode):
            out.append(node)
            out.extend(_components(node.children))
        elif isinstance(node, TemplateNode):
            out.extend(_components(node.children))
    return out


# ── basic shapes ─────────────────────────────────────────────────────────────


def test_empty_source():
    assert parse("") == []


def test_plain_text_no_components():
    src = "<div>Hello <b>world</b></div>"
    nodes = parse(src)
    assert len(nodes) == 1
    assert isinstance(nodes[0], TextNode)
    assert _text(src, nodes[0]) == src


def test_single_component_paired():
    src = "<c-button>Click</c-button>"
    nodes = parse(src)
    assert len(nodes) == 1
    node = nodes[0]
    assert isinstance(node, ComponentNode)
    assert node.name == "button"
    assert node.self_closing is False
    assert len(node.children) == 1 and isinstance(node.children[0], TextNode)
    assert _text(src, node.children[0]) == "Click"


def test_self_closing_component():
    src = '<c-icon icon="home"/>'
    nodes = parse(src)
    assert isinstance(nodes[0], ComponentNode)
    assert nodes[0].self_closing is True
    assert nodes[0].children == []


def test_surrounding_text_is_preserved_verbatim():
    src = 'before <c-button>x</c-button> after &amp; more'
    nodes = parse(src)
    assert _text(src, nodes[0]) == "before "
    assert isinstance(nodes[1], ComponentNode)
    assert _text(src, nodes[2]) == " after &amp; more"


# ── attributes ───────────────────────────────────────────────────────────────


def test_attribute_kinds():
    src = (
        '<c-button type="primary" :items="data" @click="f()" disabled '
        'label="a {{ x }} b" title="{% trans %}Hi{% endtrans %}"/>'
    )
    node = parse(src)[0]
    by_name = {a.name: a for a in node.attrs}
    assert by_name["type"].kind is AttrKind.LITERAL
    assert by_name["type"].raw_value == "primary"
    assert by_name[":items"].kind is AttrKind.EXPRESSION
    assert by_name["@click"].kind is AttrKind.EVENT
    assert by_name["disabled"].kind is AttrKind.LITERAL
    assert by_name["disabled"].raw_value is None
    assert by_name["label"].kind is AttrKind.INTERPOLATED
    assert by_name["title"].kind is AttrKind.BLOCK


def test_jinja_in_attribute_value_is_opaque():
    # A quote inside a Jinja block must not close the value.
    src = "<c-button label=\"{% if x == 'a' %}A{% endif %}\">x</c-button>"
    node = parse(src)[0]
    assert node.attrs[0].raw_value == "{% if x == 'a' %}A{% endif %}"


def test_attribute_name_casing_preserved():
    node = parse('<c-button data-testId="x">y</c-button>')[0]
    assert node.attrs[0].name == "data-testId"


def test_unquoted_attribute_value():
    node = parse("<c-button type=primary>x</c-button>")[0]
    assert node.attrs[0].raw_value == "primary"


def test_duplicate_attribute_errors():
    with pytest.raises(ParseError):
        parse('<c-button type="a" type="b">x</c-button>')


# ── Jinja / comments / raw elements ──────────────────────────────────────────


def test_if_around_component():
    src = "{% if show %}<c-button>x</c-button>{% endif %}"
    comps = _components(parse(src))
    assert len(comps) == 1 and comps[0].name == "button"


def test_for_with_component_in_body():
    src = "{% for i in items %}<c-button>{{ i }}</c-button>{% endfor %}"
    comps = _components(parse(src))
    assert len(comps) == 1


def test_component_text_inside_comment_is_ignored():
    src = "<!-- <c-button>not real</c-button> --><c-link>real</c-link>"
    comps = _components(parse(src))
    assert len(comps) == 1 and comps[0].name == "link"


def test_component_text_inside_script_is_ignored():
    src = '<script>if (a < b) { x = "<c-button>"; }</script><c-link>real</c-link>'
    comps = _components(parse(src))
    assert len(comps) == 1 and comps[0].name == "link"


def test_entities_left_intact():
    src = "<c-strong>Tom &amp; Jerry&nbsp;!</c-strong>"
    node = parse(src)[0]
    assert _text(src, node.children[0]) == "Tom &amp; Jerry&nbsp;!"


# ── nesting ──────────────────────────────────────────────────────────────────


def test_same_name_nesting():
    src = "<c-card><c-card>inner</c-card></c-card>"
    nodes = parse(src)
    assert len(nodes) == 1
    outer = nodes[0]
    inner = [c for c in outer.children if isinstance(c, ComponentNode)]
    assert len(inner) == 1 and inner[0].name == "card"


def test_deep_nesting_ten_levels():
    src = "".join("<c-card>" for _ in range(10)) + "x" + "</c-card>" * 10
    comps = _components(parse(src))
    assert len(comps) == 10


def test_html_between_components_kept():
    src = '<c-card><div class="x"><c-button>Hi</c-button></div></c-card>'
    outer = parse(src)[0]
    kinds = [type(c).__name__ for c in outer.children]
    assert "TextNode" in kinds and "ComponentNode" in kinds


# ── templates / slots ────────────────────────────────────────────────────────


def test_template_slot_parsed():
    src = '<c-card><template slot="header">Title</template>body</c-card>'
    card = parse(src)[0]
    templates = [c for c in card.children if isinstance(c, TemplateNode)]
    assert len(templates) == 1
    assert templates[0].attrs[0].name == "slot"
    assert templates[0].attrs[0].raw_value == "header"


def test_component_inside_slot_found():
    src = '<c-card><template slot="footer"><c-button>Go</c-button></template></c-card>'
    comps = _components(parse(src))
    assert any(c.name == "button" for c in comps)


# ── errors ───────────────────────────────────────────────────────────────────


def test_unclosed_component_errors_with_location():
    src = "line1\n<c-button>never closed"
    with pytest.raises(ParseError) as exc:
        parse(src)
    assert exc.value.line == 2


def test_mismatched_closing_tag_errors():
    with pytest.raises(ParseError):
        parse("<c-card>text</c-button>")


def test_stray_closing_tag_errors():
    with pytest.raises(ParseError):
        parse("text </c-card> more")


def test_unterminated_attribute_value_errors():
    with pytest.raises(ParseError):
        parse('<c-button label="unclosed value')


def test_unclosed_tag_in_attributes_errors():
    with pytest.raises(ParseError):
        parse("<c-button ")


def test_self_closing_template():
    src = '<c-card><template slot="x"/>body</c-card>'
    card = parse(src)[0]
    templates = [c for c in card.children if isinstance(c, TemplateNode)]
    assert len(templates) == 1 and templates[0].children == []


def test_scripting_tag_not_treated_as_script():
    # <scripting> must not be swallowed as a <script> raw element.
    src = "<scripting><c-link>real</c-link></scripting>"
    comps = _components(parse(src))
    assert len(comps) == 1 and comps[0].name == "link"


def test_unquoted_value_stops_at_gt():
    node = parse("<c-button type=primary>x</c-button>")[0]
    assert node.attrs[0].raw_value == "primary"
    assert node.self_closing is False


def test_style_block_opaque():
    src = "<style>.a{content:'<c-button>'}</style><c-link>real</c-link>"
    comps = _components(parse(src))
    assert len(comps) == 1 and comps[0].name == "link"


def test_boolean_attr_before_gt():
    node = parse("<c-button disabled>x</c-button>")[0]
    assert node.attrs[0].name == "disabled"
    assert node.attrs[0].raw_value is None
