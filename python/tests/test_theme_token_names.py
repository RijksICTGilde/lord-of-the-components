"""Every design-token name we consume must be one the theme actually declares.

`var(--x, <fallback>)` is silent: if `--x` is never declared, CSS just uses the
fallback and nothing warns. So a typo'd or invented token name renders as its
hard-coded fallback forever — which is exactly how four hand-written components
kept their light colours in dark mode while the generated ones followed the
theme (the NLDD theme switches via `light-dark()`, driven by `data-scheme` on
`<html>`; a literal fallback cannot switch).

Four gates:

1. every `--semantics-*` name we consume is declared by the theme;
2. every `--nldd-color-*` name (our per-app override hooks, which the theme does
   NOT declare) falls back to a `--semantics-*` token rather than to a literal;
3. no colour is written as a bare literal — the first two gates only look INSIDE
   `var()`, so a rule like `background: #eef0f4` (which is what `.lotc-statusbar`
   was) slips past both;
4. the dark-scheme fixture actually renders every class of ours that sets a
   colour, so the browser measurement in `tests/visual/dark_contrast_shoot.mjs`
   cannot be quietly incomplete.
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


# ── gate 3: colours written without a token at all ──────────────────────────

#: Colour syntaxes. A literal is fine as the FALLBACK of a var() — it is the
#: value only when no theme is loaded at all — so fallbacks are cut out first.
COLOUR = re.compile(
    # a hex colour, but not the tail of an HTML entity like &#10005;
    r"(?<![&\w])#[0-9a-fA-F]{3,8}\b"
    # rgb()/hsl()/oklch() with NUMERIC arguments — so a JS string that happens
    # to build "rgba(" + n + … is not mistaken for a literal
    r"|\b(?:rgba?|hsla?|oklch)\(\s*[\d.,%\s/deg]+\)"
    r"|\b(?:white|black|red|green|blue|silver|gray|grey|orange|yellow|purple)\b(?!-)"
)
#: Both ways we write "token, with this if the theme is absent". The JS helper
#: in lotc-charts is the same contract as var(): Chart.js needs a value, so the
#: token is resolved in script, and the literal is only the no-theme fallback.
FALLBACK_START = re.compile(r"var\(\s*--[a-z0-9-]+\s*,\s*|lotcThemeColor\(\s*'--[a-z0-9-]+'\s*,\s*")
#: Comments are prose: they may mention colours without setting any.
BLOCK_COMMENT = re.compile(r"/\*.*?\*/|\{#.*?#\}", re.DOTALL)
HTML_ENTITY = re.compile(r"&#\w+;")

#: Deliberate literals, each with the reason it is not a theme token.
ALLOWED_LITERALS = {
    # Medal colours: gold/silver/bronze ARE the meaning, no token expresses them.
    ("static/lotc/app-components.css", "#c8a200"),
    ("static/lotc/app-components.css", "#8a8f99"),
    ("static/lotc/app-components.css", "#a06a3c"),
    # Neutral hatch over a themed tint — grey at 12% reads on light and dark.
    ("static/lotc/app-components.css", "rgba(128, 128, 128, 0.12)"),
}


def _bare_colours(text):
    """Yield colour literals that are neither a fallback nor inside a comment."""
    text = HTML_ENTITY.sub(" ", BLOCK_COMMENT.sub(" ", text))
    for raw in text.splitlines():
        line = raw.strip()
        if line.startswith(("*", "//")):
            continue
        out, i = [], 0
        while i < len(line):  # blank out every token fallback
            m = FALLBACK_START.search(line, i)
            if not m:
                out.append(line[i:])
                break
            out.append(line[i : m.start()])
            depth, j = 1, m.end()
            while j < len(line) and depth:
                depth += (line[j] == "(") - (line[j] == ")")
                j += 1
            out.append(" " * (j - m.start()))
            i = j
        for match in COLOUR.finditer("".join(out)):
            yield match.group(0), line


def test_no_colour_is_written_without_a_token():
    """A literal outside a var() cannot follow the theme — nothing can override it.

    This is the gate the first two miss: `.lotc-statusbar--info { background:
    #e5f0fb }` mentions no token at all, so a token-name check has nothing to
    look at, and it stayed light on a dark page.
    """
    offenders = []
    for path, text in _iter_sources():
        rel = str(path.relative_to(ROOT))
        for colour, line in _bare_colours(text):
            if any(rel.endswith(f) and colour == c for f, c in ALLOWED_LITERALS):
                continue
            offenders.append(f"{rel}: {colour}  in  {line[:90]}")
    assert not offenders, "colours written without a token (a theme cannot reach these):\n  " + "\n  ".join(offenders)


def test_the_bare_colour_gate_sees_a_planted_literal():
    """Negative control: the shape `.lotc-statusbar--info` had must be caught."""
    planted = ".lotc-x { background: #e5f0fb; color: var(--semantics-content-color, #333); }"
    found = [c for c, _ in _bare_colours(planted)]
    assert found == ["#e5f0fb"], f"expected only the bare literal, got {found}"


# ── gate 4: is the browser measurement actually looking at everything? ───────

#: Properties whose value is a colour. A rule that sets one of these paints.
COLOUR_PROP = re.compile(
    r"(?<![-\w])(color|background|background-color|border[a-z-]*color|outline|fill|stroke|box-shadow)\s*:"
)
DARK_FIXTURE = ROOT / "tests/visual/fixtures/dark-scheme.html"


#: A selector of ours, as a class (`.lotc-secret`) OR as an element name
#: (`lotc-secret-field > code`). NLDD styles its own components by element name,
#: so ours do too where they are custom elements — and a gate that only knew
#: about classes silently lost two components the moment they became elements.
OUR_SELECTOR = re.compile(r"(?:\.|(?<![.#\w-]))(lotc-[a-z0-9_-]+)")


def _selectors_that_paint():
    """Every selector of ours whose rule sets a colour → the files it is in."""
    found = {}
    for path, text in _iter_sources():
        for rule in re.finditer(r"([^{}]+)\{([^{}]*)\}", text):
            if not COLOUR_PROP.search(rule.group(2)):
                continue
            selector = rule.group(1)
            # Skip an at-rule preamble (@media …); its body is matched separately.
            if selector.lstrip().startswith("@"):
                continue
            for name in OUR_SELECTOR.findall(selector):
                found.setdefault(name, set()).add(str(path.relative_to(ROOT)))
    return found


def test_dark_fixture_covers_every_selector_that_paints():
    """The measurement is only worth its result if the page shows everything.

    `dark_contrast_shoot.mjs` can only judge what the fixture renders, and that
    is invisible in its output: it reported "0 below AA" while 22 of our 39
    painting selectors were simply not on the page. So pin the coverage here —
    the fixture must render everything of ours that sets a colour, whether it is
    styled by class or, like a custom element, by tag name.
    """
    painting = _selectors_that_paint()
    assert len(painting) > 25, f"expected the full set of painting classes, found {len(painting)}"
    fixture = DARK_FIXTURE.read_text(encoding="utf-8")
    # The fixture is authored in <c-*> tags, so a class it renders is usually
    # not literally in the file — render it and look at the HTML.
    html = _render_dark_fixture(fixture)
    missing = {c: sorted(f) for c, f in painting.items() if not re.search(rf"\b{re.escape(c)}\b", html)}
    assert not missing, (
        f"{len(missing)} of {len(painting)} selectors that set a colour are never rendered by "
        f"{DARK_FIXTURE.relative_to(ROOT)}, so nothing measures them: {missing}"
    )


def test_dark_fixture_renders_every_canvas_component():
    """Charts paint on a <canvas>, so no class of theirs appears in the CSS scan.

    Removing one from the fixture therefore slips past the coverage gate above
    while silently dropping the only check that can see chart colours at all
    (the ink sampling in dark_contrast_shoot.mjs). Pin them by name.
    """
    html = _render_dark_fixture(DARK_FIXTURE.read_text(encoding="utf-8"))
    for component in ("gauge", "line-chart"):
        assert f'data-lotc-component="{component}"' in html, (
            f"the dark fixture no longer renders c-{component}; its canvas colours would go unmeasured"
        )
    assert html.count("<canvas") >= 2


def _render_dark_fixture(source):
    from jinja2 import Environment, FileSystemLoader

    from lord_of_the_components import setup_components

    pkg = ROOT / "python/src/lord_of_the_components"
    env = Environment(loader=FileSystemLoader([str(pkg / "templates")]), autoescape=True)
    setup_components(
        env,
        design_systems=["lotc-layout", "nldd", "lotc-forms", "lotc-charts"],
        registry_path=str(pkg / "registry.json"),
        # The fixture deliberately includes a component NLDD does not implement,
        # to render the .lotc-unimplemented placeholder.
        on_missing_component="placeholder",
    )
    return env.from_string(source).render()
