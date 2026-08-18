"""Every design-token name we consume must be one the theme actually declares.

`var(--x, <fallback>)` is silent: if `--x` is never declared, CSS just uses the
fallback and nothing warns. So a typo'd or invented token name renders as its
hard-coded fallback forever — which is exactly how four hand-written components
kept their light colours in dark mode while the generated ones followed the
theme (the NLDD theme switches via `light-dark()`, driven by `data-scheme` on
`<html>`; a literal fallback cannot switch).

Two gates, both measured against the vendored NLDD bundle:

1. every `--semantics-*` name we consume is declared by the theme;
2. every `--nldd-color-*` name (our per-app override hooks, which the theme does
   NOT declare) falls back to a `--semantics-*` token rather than to a literal.
"""

import re
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]

#: The vendored NLDD distribution — the authority on which token names exist.
THEME_CSS_DIR = ROOT / "packages/lotc-nldd/src/lotc_nldd/static/lotc/nldd/dist/css"

#: Where we write CSS: core's static + every design-system package (both the
#: .css files and the scoped <style> blocks inside hand-written templates).
SOURCE_DIRS = [
    ROOT / "python/src/lord_of_the_components",
    ROOT / "packages",
]

SOURCE_SUFFIXES = {".css", ".j2"}

#: A consumption site: `var(--name` ... optionally followed by `, <fallback>`.
VAR_USE = re.compile(r"var\(\s*(--[a-z0-9-]+)\s*(,)?")
#: A declaration site: `--name:` at the start of a declaration.
VAR_DECL = re.compile(r"(--[a-z0-9-]+)\s*:")


def _iter_sources():
    for base in SOURCE_DIRS:
        for path in sorted(base.rglob("*")):
            if path.suffix in SOURCE_SUFFIXES and path.is_file() and "/dist/" not in str(path):
                yield path, path.read_text(encoding="utf-8")


@pytest.fixture(scope="module")
def declared_by_theme():
    names = set()
    for css in sorted(THEME_CSS_DIR.glob("*.css")):
        names.update(VAR_DECL.findall(css.read_text(encoding="utf-8")))
    # Sanity: this gate is only meaningful if the theme was actually read.
    assert "--semantics-content-color" in names, "theme CSS not found or not parsed"
    return names


def test_every_semantics_token_we_use_exists_in_the_theme(declared_by_theme):
    unknown = {}
    for path, text in _iter_sources():
        for name, _ in VAR_USE.findall(text):
            if name.startswith("--semantics-") and name not in declared_by_theme:
                unknown.setdefault(name, str(path.relative_to(ROOT)))
    assert not unknown, (
        "these --semantics-* names are consumed but declared nowhere in the NLDD "
        f"theme, so their hard-coded fallback always wins: {unknown}"
    )


def test_nldd_color_override_hooks_fall_back_to_a_theme_token():
    """`--nldd-color-*` is our own override hook — the theme never sets it.

    So its fallback IS the value in practice, and it must be a theme token; a
    literal there is a colour frozen against the light palette.
    """
    offenders = []
    for path, text in _iter_sources():
        for match in re.finditer(r"var\(\s*(--nldd-color-[a-z0-9-]+)\s*,\s*([^;)]*)", text):
            name, fallback = match.group(1), match.group(2).strip()
            if not fallback.startswith("var(--semantics-"):
                offenders.append(f"{path.relative_to(ROOT)}: {name} -> {fallback!r}")
    assert not offenders, "override hooks with a hard-coded fallback: " + "; ".join(offenders)


def test_the_gate_would_catch_a_typo(declared_by_theme):
    """Negative control: the plural typo that started this (RC-134) is unknown."""
    assert "--semantics-actions-primary-default-background-color" not in declared_by_theme
    assert "--semantics-action-primary-background-color" not in declared_by_theme
    assert "--semantics-feedback-warning-color" not in declared_by_theme
    assert "--semantics-feedback-error-color" not in declared_by_theme
