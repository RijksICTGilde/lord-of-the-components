"""One-pass component parser (plan v7 F2).

Replaces the BeautifulSoup-based preprocessing with a hand-written scanner that:

  - finds ``<c-...>`` component tags and their nesting, treating all other HTML
    as opaque text (slices of the original source, never normalized),
  - keeps Jinja/comment regions (``{{ }}``, ``{% %}``, ``{# #}``, ``<!-- -->``)
    and ``<script>``/``<style>`` bodies opaque — never parsed as HTML,
  - recognizes ``<template slot="...">`` so named slots keep working,
  - reports errors with line/column, computed lazily from a line-offset index.

The parser does not render or validate — it only produces a node tree. The
extension walks that tree to emit the Jinja includes.
"""

from __future__ import annotations

import bisect
from dataclasses import dataclass
from enum import Enum
from typing import List, Optional, Tuple, Union


class AttrKind(Enum):
    """How an attribute value should be interpreted (used by the emitter, F3)."""

    LITERAL = "literal"          # no Jinja
    INTERPOLATED = "interpolated"  # contains {{ }} only
    BLOCK = "block"              # contains {% %}
    EXPRESSION = "expression"    # name starts with ':'
    EVENT = "event"              # name starts with '@'


@dataclass
class Span:
    start: int
    end: int


@dataclass
class Attr:
    name: str                     # includes ':' / '@' prefix as written
    raw_value: Optional[str]      # None for a valueless (boolean) attribute
    kind: AttrKind
    span: Span


@dataclass
class TextNode:
    span: Span


@dataclass
class ComponentNode:
    name: str                     # without the 'c-' prefix
    attrs: List[Attr]
    children: List["Node"]
    span: Span
    self_closing: bool


@dataclass
class TemplateNode:
    """A ``<template>`` element — parsed so named slots can be extracted."""

    attrs: List[Attr]
    children: List["Node"]
    open_source: str              # literal '<template ...>' text
    span: Span


Node = Union[TextNode, ComponentNode, TemplateNode]


class ParseError(Exception):
    """Raised on malformed component markup, with 1-based line/column."""

    def __init__(self, message: str, line: int, column: int) -> None:
        self.message = message
        self.line = line
        self.column = column
        super().__init__(f"{message} at line {line}, column {column}")


_NAME_CHARS = set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_")
_ATTR_NAME_STOP = set(" \t\r\n=>/")
_OPAQUE = {"{{": "}}", "{%": "%}", "{#": "#}"}


class _Parser:
    def __init__(self, source: str) -> None:
        self.s = source
        self.n = len(source)
        # Line-start offsets, built once; line/column computed lazily on error.
        self._line_starts: Optional[List[int]] = None

    # ── error helpers ────────────────────────────────────────────────────────
    def _line_col(self, offset: int) -> Tuple[int, int]:
        if self._line_starts is None:
            starts = [0]
            idx = self.s.find("\n")
            while idx != -1:
                starts.append(idx + 1)
                idx = self.s.find("\n", idx + 1)
            self._line_starts = starts
        starts = self._line_starts
        line = bisect.bisect_right(starts, offset) - 1
        column = offset - starts[line]
        return line + 1, column + 1

    def _error(self, message: str, offset: int) -> ParseError:
        line, column = self._line_col(offset)
        return ParseError(message, line, column)

    # ── opaque regions ───────────────────────────────────────────────────────
    def _skip_opaque(self, i: int) -> Optional[int]:
        """If an opaque region starts at *i*, return the index just past it."""
        s, n = self.s, self.n
        two = s[i : i + 2]
        close = _OPAQUE.get(two)
        if close is not None:
            j = s.find(close, i + 2)
            return n if j == -1 else j + 2
        if s.startswith("<!--", i):
            j = s.find("-->", i + 4)
            return n if j == -1 else j + 3
        return None

    def _skip_raw_element(self, i: int) -> Optional[int]:
        """If ``<script``/``<style`` starts at *i*, skip to past its close tag."""
        s = self.s
        for tag in ("script", "style"):
            if s[i : i + 1 + len(tag)].lower() == "<" + tag:
                after = i + 1 + len(tag)
                # Must be a tag boundary, not e.g. <scripting>.
                if after < self.n and (s[after].isalnum()):
                    continue
                close = f"</{tag}"
                j = s.lower().find(close, i + 1)
                if j == -1:
                    return self.n
                gt = s.find(">", j)
                return self.n if gt == -1 else gt + 1
        return None

    # ── node list parsing ────────────────────────────────────────────────────
    def parse(self) -> List[Node]:
        nodes, pos, _ = self._parse_nodes(0, None)
        if pos != self.n:
            # A stray close tag at top level.
            raise self._error("Unexpected closing tag", pos)
        return nodes

    def _parse_nodes(
        self, pos: int, stop_tag: Optional[str]
    ) -> Tuple[List[Node], int, bool]:
        """Parse nodes until EOF or the *stop_tag* close. Returns (nodes, pos, hit_stop)."""
        s, n = self.s, self.n
        nodes: List[Node] = []
        text_start = pos

        def flush(upto: int) -> None:
            if upto > text_start:
                nodes.append(TextNode(Span(text_start, upto)))

        while pos < n:
            ch = s[pos]
            if ch == "{" or (ch == "<" and s.startswith("<!--", pos)):
                skip = self._skip_opaque(pos)
                if skip is not None:
                    pos = skip
                    continue
            if ch != "<":
                pos += 1
                continue

            # ch == '<'
            raw = self._skip_raw_element(pos)
            if raw is not None:
                pos = raw
                continue

            if s.startswith("</", pos):
                name, _ = self._read_tag_name(pos + 2)
                if stop_tag is not None and name.lower() == stop_tag.lower():
                    flush(pos)
                    return nodes, pos, True
                if name.lower().startswith("c-"):
                    # A component close with no matching open (or the wrong name).
                    raise self._error(f"Unexpected closing tag '</{name}>'", pos)
                # Regular HTML close tag (</div>, </b>, stray </template>) → text.
                pos += 1
                continue

            if self._starts_component(pos):
                flush(pos)
                comp, pos = self._parse_component(pos)
                nodes.append(comp)
                text_start = pos
                continue

            if self._starts_template(pos):
                flush(pos)
                tmpl, pos = self._parse_template(pos)
                nodes.append(tmpl)
                text_start = pos
                continue

            # A regular '<' — part of text.
            pos += 1

        flush(n)
        if stop_tag is not None:
            return nodes, n, False
        return nodes, n, True

    # ── tag helpers ──────────────────────────────────────────────────────────
    def _read_tag_name(self, i: int) -> Tuple[str, int]:
        start = i
        s, n = self.s, self.n
        while i < n and s[i] in _NAME_CHARS:
            i += 1
        return s[start:i], i

    def _starts_component(self, pos: int) -> bool:
        s = self.s
        if not s.startswith("<c-", pos):
            return False
        # Next char after 'c-' must start a name.
        return pos + 3 < self.n and s[pos + 3] in _NAME_CHARS

    def _starts_template(self, pos: int) -> bool:
        s = self.s
        if s[pos : pos + 9].lower() != "<template":
            return False
        after = pos + 9
        return after >= self.n or s[after] in " \t\r\n>/"

    def _parse_component(self, start: int) -> Tuple[ComponentNode, int]:
        name, i = self._read_tag_name(start + 1)  # after '<'
        comp_name = name[2:]  # strip 'c-'
        attrs, i, self_closing = self._parse_attrs(i, name)
        if self_closing:
            return ComponentNode(comp_name, attrs, [], Span(start, i), True), i
        children, end, hit = self._parse_nodes(i, name)
        if not hit:
            raise self._error(f"Unclosed component tag '<{name}>'", start)
        close_end = self._consume_close(end, name)
        return ComponentNode(comp_name, attrs, children, Span(start, close_end), False), close_end

    def _parse_template(self, start: int) -> Tuple[TemplateNode, int]:
        _, i = self._read_tag_name(start + 1)
        attrs, i, self_closing = self._parse_attrs(i, "template")
        open_source = self.s[start:i]
        if self_closing:
            return TemplateNode(attrs, [], open_source, Span(start, i)), i
        children, end, hit = self._parse_nodes(i, "template")
        if not hit:
            raise self._error("Unclosed <template> tag", start)
        close_end = self._consume_close(end, "template")
        return TemplateNode(attrs, children, open_source, Span(start, close_end)), close_end

    def _consume_close(self, i: int, name: str) -> int:
        # i is at '</name...'; advance to just past '>'.
        gt = self.s.find(">", i)
        if gt == -1:
            raise self._error(f"Unclosed closing tag '</{name}>'", i)
        return gt + 1

    def _parse_attrs(self, i: int, tag: str) -> Tuple[List[Attr], int, bool]:
        s, n = self.s, self.n
        attrs: List[Attr] = []
        seen: set = set()
        while i < n:
            while i < n and s[i] in " \t\r\n":
                i += 1
            if i >= n:
                raise self._error(f"Unclosed tag '<{tag}>'", i)
            if s[i] == ">":
                return attrs, i + 1, False
            if s.startswith("/>", i):
                return attrs, i + 2, True
            # attribute name
            name_start = i
            while i < n and s[i] not in _ATTR_NAME_STOP:
                i += 1
            name = s[name_start:i]
            if not name:
                raise self._error(f"Malformed attribute in '<{tag}>'", i)
            # optional value
            j = i
            while j < n and s[j] in " \t\r\n":
                j += 1
            raw_value: Optional[str] = None
            value_end = i
            if j < n and s[j] == "=":
                j += 1
                while j < n and s[j] in " \t\r\n":
                    j += 1
                raw_value, value_end = self._read_attr_value(j, tag)
            else:
                value_end = i
            key = name.lower()
            if key in seen:
                raise self._error(
                    f"Duplicate attribute '{name}' in '<{tag}>'", name_start
                )
            seen.add(key)
            attrs.append(
                Attr(name, raw_value, _attr_kind(name, raw_value), Span(name_start, value_end))
            )
            i = value_end
        raise self._error(f"Unclosed tag '<{tag}>'", i)

    def _read_attr_value(self, i: int, tag: str) -> Tuple[str, int]:
        s, n = self.s, self.n
        quote = s[i] if i < n and s[i] in "\"'" else None
        if quote is None:
            # unquoted value: read until whitespace or '>'
            start = i
            while i < n and s[i] not in " \t\r\n>":
                i += 1
            return s[start:i], i
        # quoted value: scan to matching quote, keeping Jinja regions opaque
        i += 1
        start = i
        while i < n:
            skip = self._skip_opaque(i)
            if skip is not None:
                i = skip
                continue
            if s[i] == quote:
                return s[start:i], i + 1
            i += 1
        raise self._error(f"Unterminated attribute value in '<{tag}>'", start)


def _attr_kind(name: str, raw_value: Optional[str]) -> AttrKind:
    if name.startswith(":"):
        return AttrKind.EXPRESSION
    if name.startswith("@"):
        return AttrKind.EVENT
    if raw_value is None:
        return AttrKind.LITERAL
    if "{%" in raw_value:
        return AttrKind.BLOCK
    if "{{" in raw_value:
        return AttrKind.INTERPOLATED
    return AttrKind.LITERAL


def parse(source: str) -> List[Node]:
    """Parse *source* into a list of nodes (text + component + template)."""
    return _Parser(source).parse()
