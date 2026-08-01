"""
Visual test server for Lord of the Components.

Renders fixture templates through the LOTC Jinja2 pipeline and serves them
with RVO/Utrecht CSS for visual regression testing with Playwright.

Usage:
    python tests/visual/serve.py [--port 5555]
"""

import argparse
import json
import logging
import mimetypes
import re
import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from typing import Callable
from urllib.parse import urlparse

from jinja2 import Environment, FileSystemLoader

# Add the Python package to sys.path
PYTHON_SRC = Path(__file__).resolve().parent.parent.parent / "python" / "src"
sys.path.insert(0, str(PYTHON_SRC))

from lord_of_the_components import setup_components  # noqa: E402

logger = logging.getLogger(__name__)

# Paths
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
FIXTURES_DIR = Path(__file__).resolve().parent / "fixtures"
TEMPLATES_DIR = PYTHON_SRC / "lord_of_the_components" / "templates"
REGISTRY_JSON = PYTHON_SRC / "lord_of_the_components" / "registry.json"
CORE_STATIC_DIR = PYTHON_SRC / "lord_of_the_components" / "static"


def _static_roots() -> list[Path]:
    """Static roots for the /static/lotc/... URL space: core (layout.css) plus
    every installed design system's own static dir (its CSS/JS bundle)."""
    from lord_of_the_components.design_system import discover_design_systems

    roots = [CORE_STATIC_DIR]
    for ds in discover_design_systems().values():
        if ds.static_path is not None:
            roots.append(Path(ds.static_path))
    return roots


STATIC_ROOTS = _static_roots()

# Bundled CSS from webpack build (served from /static/lotc/dist/)
BUNDLED_CSS = "\n".join(
    f'    <link rel="stylesheet" href="/static/lotc/dist/{path}">'
    for path in [
        "lotc.css",
        "@nl-rvo/assets/fonts/index.css",
        "@nl-rvo/assets/icons/index.css",
        "@nl-rvo/assets/images/index.css",
        "@nl-rvo/design-tokens/index.css",
        "@nl-rvo/component-library-css/index.css",
        "@nl-rvo/css-button/index.css",
    ]
)

# NLDD assets from the `npm run build:fe:nldd` bundle (served from
# /static/lotc/nldd/dist/). The CSS list + module JS come from its manifest so
# the head matches whatever the bundle actually produced.
def _nldd_dist() -> Path:
    """The nldd bundle dir, resolved from the installed lotc-nldd static root."""
    from lord_of_the_components.design_system import discover_design_systems

    ds = discover_design_systems().get("nldd")
    base = Path(ds.static_path) if ds and ds.static_path else CORE_STATIC_DIR
    return base / "lotc" / "nldd" / "dist"


def _nldd_head() -> str:
    manifest = json.loads((_nldd_dist() / "assets.json").read_text())
    links = "\n".join(
        f'    <link rel="stylesheet" href="/static/lotc/nldd/dist/{css}">'
        for css in manifest.get("css", [])
    )
    scripts = "\n".join(
        f'    <script type="module" src="/static/lotc/nldd/dist/{js["src"]}"></script>'
        for js in manifest.get("js", [])
    )
    # NLDD only applies its body font via `html:has(nldd-app-view) body`, so plain
    # HTML content (not a self-styled web component) falls back to the browser
    # default serif. Apply the RijksSans stack so ordinary content matches the
    # NLDD components — the root-context equivalent of RVO's `rvo-theme` class.
    font = (
        "    <style>body { font-family: var(--primitives-font-family-sans-serif, "
        "RijksSans, system-ui, sans-serif); }</style>"
    )
    return f"{links}\n{scripts}\n{font}"


def _extra_ds_css(themes: list[str]) -> str:
    """CSS <link>s each declared design system asks a page to load (css_urls).

    This is what a page declaring these systems would emit — used here so a
    BGNLDD page picks up bg-components.css on top of the NLDD bundle.
    """
    from lord_of_the_components.design_system import discover_design_systems

    ds_map = discover_design_systems()
    links = []
    for name in themes:
        ds = ds_map.get(name)
        for url in getattr(ds, "css_urls", ()) if ds else ():
            links.append(f'    <link rel="stylesheet" href="{url}">')
    return "\n".join(links)


def _make_transform(theme: str) -> Callable[[str], str]:
    """Return a fixture transform that injects the CSS/JS for the declared systems.

    `theme` may be a comma-separated list (e.g. "nldd") for mix-and-match;
    the first entry is primary and picks the base bundle.
    """
    themes = [t.strip() for t in theme.split(",") if t.strip()]
    primary = themes[0] if themes else "rvo"

    # Theme-agnostic layout primitives (app-shell, auto-grid) render the same in
    # both themes, so their structural CSS is injected everywhere.
    layout_css = (
        '    <link rel="stylesheet" href="/static/lotc/layout/layout.css">\n'
        '    <link rel="stylesheet" href="/static/lotc/app-components.css">'
    )
    extra_css = _extra_ds_css(themes)

    def _transform(source: str) -> str:
        # A fixture that uses <c-page> renders its own full document and loads the
        # declared design systems' assets itself — don't double-inject.
        if "<c-page" in source:
            return source
        if primary == "nldd":
            head = "\n".join(p for p in (_nldd_head(), extra_css, layout_css) if p)
            if "</head>" in source:
                source = source.replace("</head>", f"{head}\n</head>")
            return source
        # RVO (default): bundled CSS + rvo-theme body class for design tokens.
        head = "\n".join(p for p in (BUNDLED_CSS, extra_css, layout_css) if p)
        if "</head>" in source:
            source = source.replace("</head>", f"{head}\n</head>")
        if "<body" in source and "rvo-theme" not in source:
            source = source.replace("<body>", '<body class="rvo-theme">')
        return source

    return _transform


class FixtureLoader(FileSystemLoader):
    """FileSystemLoader that injects the bundled CSS/body-class into fixtures.

    Applying the transform in get_source (rather than per request via
    env.from_string) lets the compiled template be cached in Environment.cache,
    so repeat requests skip the BeautifulSoup preprocess + recompile entirely.
    """

    def __init__(self, fixtures_dir: Path, transform: Callable[[str], str]) -> None:
        super().__init__([str(fixtures_dir), str(TEMPLATES_DIR)])
        self._fixtures_root = fixtures_dir.resolve()
        self._transform = transform

    def get_source(self, environment: Environment, template: str):  # type: ignore[override]
        source, filename, uptodate = super().get_source(environment, template)
        # Only fixture files get the asset injection; component templates do not.
        if filename is not None and Path(filename).resolve().is_relative_to(self._fixtures_root):
            source = self._transform(source)
        return source, filename, uptodate


def create_jinja_env(theme: str = "rvo", on_missing: str = "error") -> Environment:
    """Create a Jinja2 environment with LOTC extension and fixture templates."""
    jinja_env = Environment(
        loader=FixtureLoader(FIXTURES_DIR, _make_transform(theme)),
        # Required by setup_components: component renderers escape prop values.
        autoescape=True,
        # Production mode: compiled templates stay in Environment.cache instead
        # of being recompiled from source on every request.
        auto_reload=False,
    )
    themes = [t.strip() for t in theme.split(",") if t.strip()]
    if "lotc-layout" not in themes:
        themes = ["lotc-layout"] + themes
    setup_components(
        jinja_env,
        registry_path=str(REGISTRY_JSON),
        design_systems=themes,
        on_missing_component=on_missing,
    )
    return jinja_env


# Shared Jinja2 environment (created once, rebound in main() when --theme is set)
_jinja_env = create_jinja_env()
_default_theme = "rvo"

# Lazily-built envs per design system, so a single server can switch design
# systems per request via ?ds=... (the live gallery switcher).
_env_cache: dict = {}

# Design systems offered in the switcher banner.
SWITCHER_THEMES = [("rvo", "RVO"), ("nldd", "NLDD")]


def _env_for(theme: str) -> Environment:
    """Return (and cache) an env for a design system. Uses placeholder mode so
    switching never 500s on a component the system doesn't implement."""
    if theme not in _env_cache:
        _env_cache[theme] = create_jinja_env(theme, on_missing="placeholder")
    return _env_cache[theme]


def _switcher_bar(current: str, path: str) -> str:
    """A fixed banner that swaps the active design system via ?ds=."""
    links = []
    for value, label in SWITCHER_THEMES:
        on = value == current
        style = (
            "padding:.25rem .7rem;border-radius:6px;text-decoration:none;font:600 13px system-ui;"
            + ("background:#154273;color:#fff;" if on else "color:#154273;")
        )
        links.append(f'<a href="/{path}?ds={value}" style="{style}">{label}</a>')
    return (
        '<div style="position:fixed;top:0;left:0;right:0;z-index:99999;display:flex;gap:.5rem;'
        "align-items:center;justify-content:center;padding:.4rem;background:#eef0f4;"
        'border-bottom:1px solid #d1d5db;font:13px system-ui">'
        '<span style="color:#555">Design system:</span>' + "".join(links) + "</div>"
    )


def render_fixture(fixture_path: str, theme: str | None = None, switcher: bool = False) -> str:
    """Render a fixture file through the LOTC Jinja2 pipeline.

    The fixture HTML is treated as a Jinja2 template, so <c-*> tags get
    preprocessed by the ComponentExtension into real HTML. With `theme` set
    (from ?ds=), a per-design-system env renders it; `switcher` injects the
    design-system switcher bar after <body>.
    """
    from jinja2 import TemplateNotFound

    env = _env_for(theme) if theme else _jinja_env
    try:
        template = env.get_template(fixture_path)
    except TemplateNotFound:
        return f"<h1>404</h1><p>Fixture not found: {fixture_path}</p>"
    html = template.render()
    if switcher:
        bar = _switcher_bar(theme or _default_theme, fixture_path)
        html = re.sub(r"(<body[^>]*>)", r"\1" + bar, html, count=1)
        if "<body" not in html:  # non-c-page fixture: just prepend
            html = bar + html
    return html


class FixtureHandler(SimpleHTTPRequestHandler):
    """HTTP handler that renders fixture templates through the LOTC pipeline."""

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path.lstrip("/")

        if not path or path == "/":
            self._serve_index()
            return

        if path.startswith("static/lotc/"):
            self._serve_static(path)
            return

        if path.endswith(".html"):
            from urllib.parse import parse_qs

            # ?ds=<design system> switches the active system live (gallery mode)
            # and shows a switcher bar; absent -> the server's --theme, no bar.
            ds = parse_qs(parsed.query).get("ds", [None])[0]
            self._serve_fixture(path, theme=ds, switcher=ds is not None)
            return

        self.send_error(404, f"Not found: {path}")

    def _serve_static(self, url_path: str) -> None:
        """Serve a static file from any static root: core (layout.css) or an
        installed design system's own bundle. URLs are unique per root."""
        # url_path is "static/lotc/..." → map to <root>/lotc/... for each root.
        rel = url_path[len("static/"):]
        file_path = None
        for root in STATIC_ROOTS:
            candidate = (root / rel).resolve()
            if candidate.is_relative_to(root.resolve()) and candidate.is_file():
                file_path = candidate
                break
        if file_path is None:
            self.send_error(404, f"Static file not found: {url_path}")
            return
        content_type, _ = mimetypes.guess_type(str(file_path))
        if content_type is None:
            content_type = "application/octet-stream"
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Cache-Control", "public, max-age=3600")
        self.end_headers()
        self.wfile.write(file_path.read_bytes())

    def _serve_fixture(self, fixture_path: str, theme: str | None = None, switcher: bool = False) -> None:
        """Render and serve a fixture file."""
        try:
            html = render_fixture(fixture_path, theme=theme, switcher=switcher)
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Cache-Control", "no-cache")
            self.end_headers()
            self.wfile.write(html.encode("utf-8"))
        except Exception as e:
            logger.exception("Error rendering fixture: %s", fixture_path)
            error_html = (
                f"<h1>500 - Render Error</h1>"
                f"<pre>{type(e).__name__}: {e}</pre>"
            )
            self.send_response(500)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            self.wfile.write(error_html.encode("utf-8"))

    def _serve_index(self) -> None:
        """A curated landing page: the storybook and reference galleries up top,
        then the demo apps (each with an NLDD/RVO toggle so the theme-agnostic
        rendering is one click away), then the component-variant fixtures. The
        raw internal compare artifacts (_cmp_*, _compare-*) are hidden."""
        all_fixtures = {
            f.relative_to(FIXTURES_DIR).as_posix()
            for f in FIXTURES_DIR.rglob("*.html")
            if not f.name.startswith("_")
        }
        used: set[str] = set()

        def ds_links(name: str, themes: list[tuple[str, str]]) -> str:
            used.add(name)
            parts = [
                f'<a class="ds" href="/{name}?ds={val}">{lbl}</a>' for val, lbl in themes
            ]
            return " ".join(parts)

        def card(name: str, title: str, desc: str, themes: list[tuple[str, str]]) -> str:
            if name not in all_fixtures:
                return ""
            return (
                f'<div class="card"><div class="ttl">{title}</div>'
                f'<div class="dsc">{desc}</div>{ds_links(name, themes)}</div>'
            )

        NLDD = ("nldd", "NLDD")
        RVO = ("rvo", "RVO")

        # ── storybook + reference ──
        ref = "".join([
            card("nldd-storybook.html", "Component-storybook",
                 "Alle 95 NLDD-componenten: attributen (met enum-waarden) + live rendering.", [NLDD]),
            card("nldd-gallery.html", "Gallery",
                 "Compacte galerij van alle gegenereerde componenten.", [NLDD]),
            card("nldd-real.html", "Realistische voorbeelden",
                 "Context-componenten met echte, samengestelde inhoud.", [NLDD]),
            card("showcase.html", "Showcase", "Brede mix van componenten.", [NLDD, RVO]),
        ])

        # ── demo apps (same source, both design systems) ──
        apps = "".join([
            card("apps.html", "Software-catalogus",
                 "Volledige app-pagina — één bron, twee design systems.", [NLDD, RVO]),
            card("zelf.html", "Mijn overzicht",
                 "Persoonlijk dashboard.", [NLDD, RVO]),
            card("bg-overzicht.html", "Overzicht",
                 "Landingspagina van het platform.", [NLDD, RVO]),
            card("combined.html", "Combined", "Gecombineerde componenten-pagina.", [NLDD, RVO]),
        ])
        # -rvo twins are covered by the RVO toggle above; mark them used.
        for twin in ("apps-rvo.html", "zelf-rvo.html", "bg-overzicht-rvo.html", "app-components-rvo.html"):
            used.add(twin)

        # ── everything else: variant/reference fixtures ──
        rest = sorted(all_fixtures - used)
        rest_links = "".join(
            f'<li><a href="/{n}?ds=nldd">{n[:-5]}</a> '
            f'<a class="mini" href="/{n}?ds=rvo">rvo</a></li>'
            for n in rest
        )

        html = f"""<!DOCTYPE html><html lang="nl"><head><meta charset="utf-8">
<title>LOTC — overzicht</title><style>
  body{{font-family:system-ui,sans-serif;margin:0;background:#f6f7f9;color:#1a1a1a}}
  header{{background:#154273;color:#fff;padding:1.5rem 2rem}}
  header h1{{margin:0;font-size:1.4rem}} header p{{margin:.3rem 0 0;opacity:.85;font-size:.9rem}}
  main{{max-width:1000px;margin:0 auto;padding:1.5rem 2rem}}
  h2{{color:#154273;font-size:.8rem;text-transform:uppercase;letter-spacing:.05em;margin:2rem 0 .8rem;border-bottom:2px solid #dde3ec;padding-bottom:.4rem}}
  .grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:.9rem}}
  .card{{background:#fff;border:1px solid #e5e8ec;border-radius:10px;padding:.9rem}}
  .card .ttl{{font-weight:700;color:#154273}} .card .dsc{{font-size:.8rem;color:#666;margin:.3rem 0 .7rem}}
  a.ds{{display:inline-block;padding:.2rem .6rem;border-radius:6px;background:#154273;color:#fff;text-decoration:none;font-size:.78rem;font-weight:600;margin-right:.3rem}}
  a.ds:hover{{background:#0d2d4f}}
  ul.rest{{columns:3;list-style:none;padding:0;font-size:.82rem}}
  ul.rest li{{margin:.15rem 0;break-inside:avoid}}
  ul.rest a{{color:#154273;text-decoration:none}} ul.rest a:hover{{text-decoration:underline}}
  a.mini{{font-size:.68rem;color:#999}}
</style></head><body>
<header><h1>Lord of the Components</h1>
<p>Thema-agnostische compiler — één <code>&lt;c-*&gt;</code>-bron, meerdere design systems (RVO · NLDD).</p></header>
<main>
<h2>Storybook &amp; referentie</h2><div class="grid">{ref}</div>
<h2>Demo-apps — zelfde bron, beide design systems</h2><div class="grid">{apps}</div>
<h2>Component-varianten &amp; losse fixtures</h2><ul class="rest">{rest_links}</ul>
</main></body></html>"""
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.end_headers()
        self.wfile.write(html.encode("utf-8"))

    def log_message(self, format: str, *args: object) -> None:
        """Suppress default request logging unless in verbose mode."""
        if logger.isEnabledFor(logging.DEBUG):
            logger.debug(format, *args)


def main() -> None:
    parser = argparse.ArgumentParser(description="LOTC visual test server")
    parser.add_argument("--port", type=int, default=5555, help="Port to listen on")
    parser.add_argument(
        "--theme",
        default="rvo",
        help="Design system(s) to render fixtures with. Comma-separated for "
        "mix-and-match (e.g. 'nldd'); the first is primary.",
    )
    parser.add_argument(
        "--on-missing",
        choices=["error", "placeholder"],
        default="error",
        help="What to do when the active theme(s) don't implement a component: "
        "raise (default) or emit a visible placeholder so the gap is previewable.",
    )
    parser.add_argument("--verbose", "-v", action="store_true", help="Verbose logging")
    args = parser.parse_args()

    level = logging.DEBUG if args.verbose else logging.INFO
    logging.basicConfig(level=level, format="%(levelname)s: %(message)s")

    global _jinja_env
    _jinja_env = create_jinja_env(args.theme, args.on_missing)

    server = HTTPServer(("localhost", args.port), FixtureHandler)
    print(f"Serving LOTC fixtures ({args.theme}) on http://localhost:{args.port}")
    print(f"Fixtures dir: {FIXTURES_DIR}")
    print("Press Ctrl+C to stop")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server")
        server.shutdown()


if __name__ == "__main__":
    main()
