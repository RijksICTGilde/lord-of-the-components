"""Normalize HTML for golden comparison (plan v7 T1.1).

The golden contract compares *normalized* HTML, not bytes: the current renderer
emits 4-space-indented HTML, and the rewrite (F2/F3) will emit compact HTML.
Both must compare equal, so normalization:

  - sorts attributes on every tag,
  - sorts the class token list,
  - collapses whitespace between tags and runs of whitespace in text.

Both the expected (golden) and the actual output go through the same function,
so any BeautifulSoup-induced rewriting applies equally to both sides.
"""

from __future__ import annotations

import re

from bs4 import BeautifulSoup

_BETWEEN_TAGS = re.compile(r">\s+<")
_WHITESPACE = re.compile(r"\s+")


def normalize(html: str) -> str:
    """Return a canonical form of *html* for whitespace-insensitive comparison."""
    soup = BeautifulSoup(html, "html.parser")

    for tag in soup.find_all(True):
        # Sort the class token list (order-insensitive).
        if tag.has_attr("class"):
            classes = tag["class"]
            if isinstance(classes, list):
                tag["class"] = sorted(classes)
        # Sort attributes by name for a stable serialization.
        tag.attrs = dict(sorted(tag.attrs.items()))

    out = soup.decode()
    out = _BETWEEN_TAGS.sub("><", out)
    out = _WHITESPACE.sub(" ", out)
    return out.strip()
