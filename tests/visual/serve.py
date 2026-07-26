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
STATIC_DIR = PYTHON_SRC / "lord_of_the_components" / "static"

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
_NLDD_DIST = STATIC_DIR / "lotc" / "nldd" / "dist"


def _nldd_head() -> str:
    manifest = json.loads((_NLDD_DIST / "assets.json").read_text())
    links = "\n".join(
        f'    <link rel="stylesheet" href="/static/lotc/nldd/dist/{css}">'
        for css in manifest.get("css", [])
    )
    scripts = "\n".join(
        f'    <script type="module" src="/static/lotc/nldd/dist/{js["src"]}"></script>'
        for js in manifest.get("js", [])
    )
    return f"{links}\n{scripts}"


def _make_transform(theme: str) -> Callable[[str], str]:
    """Return a fixture transform that injects the CSS/JS for the given theme."""

    # Theme-agnostic layout primitives (app-shell, auto-grid) render the same in
    # both themes, so their structural CSS is injected everywhere.
    layout_css = '    <link rel="stylesheet" href="/static/lotc/layout.css">'

    def _transform(source: str) -> str:
        if theme == "nldd":
            head = f"{_nldd_head()}\n{layout_css}"
            if "</head>" in source:
                source = source.replace("</head>", f"{head}\n</head>")
            return source
        # RVO (default): bundled CSS + rvo-theme body class for design tokens.
        if "</head>" in source:
            source = source.replace("</head>", f"{BUNDLED_CSS}\n{layout_css}\n</head>")
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


def create_jinja_env(theme: str = "rvo") -> Environment:
    """Create a Jinja2 environment with LOTC extension and fixture templates."""
    jinja_env = Environment(
        loader=FixtureLoader(FIXTURES_DIR, _make_transform(theme)),
        # Required by setup_components: component renderers escape prop values.
        autoescape=True,
        # Production mode: compiled templates stay in Environment.cache instead
        # of being recompiled from source on every request.
        auto_reload=False,
    )
    setup_components(jinja_env, registry_path=str(REGISTRY_JSON), theme=theme)
    return jinja_env


# Shared Jinja2 environment (created once, rebound in main() when --theme is set)
_jinja_env = create_jinja_env()


def render_fixture(fixture_path: str) -> str:
    """Render a fixture file through the LOTC Jinja2 pipeline.

    The fixture HTML is treated as a Jinja2 template, so <c-*> tags
    get preprocessed by the ComponentExtension into real HTML. The compiled
    template is served from the Environment cache on repeat requests.
    """
    from jinja2 import TemplateNotFound

    try:
        template = _jinja_env.get_template(fixture_path)
    except TemplateNotFound:
        return f"<h1>404</h1><p>Fixture not found: {fixture_path}</p>"
    return template.render()


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
            self._serve_fixture(path)
            return

        self.send_error(404, f"Not found: {path}")

    def _serve_static(self, url_path: str) -> None:
        """Serve a static file from the bundled assets directory."""
        # url_path is "static/lotc/..." → map to STATIC_DIR / "lotc/..."
        rel = url_path[len("static/"):]
        file_path = (STATIC_DIR / rel).resolve()
        if not file_path.is_relative_to(STATIC_DIR.resolve()):
            self.send_error(403, "Forbidden")
            return
        if not file_path.is_file():
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

    def _serve_fixture(self, fixture_path: str) -> None:
        """Render and serve a fixture file."""
        try:
            html = render_fixture(fixture_path)
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
        """Serve an index page listing all available fixtures."""
        fixtures = sorted(FIXTURES_DIR.rglob("*.html"))
        links = []
        for f in fixtures:
            rel = f.relative_to(FIXTURES_DIR)
            links.append(f'<li><a href="/{rel}">{rel}</a></li>')

        html = (
            "<!DOCTYPE html><html><head><title>LOTC Visual Test Fixtures</title></head>"
            "<body><h1>LOTC Visual Test Fixtures</h1><ul>"
            + "\n".join(links)
            + "</ul></body></html>"
        )
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
        choices=["rvo", "nldd"],
        default="rvo",
        help="Design-system theme to render fixtures with",
    )
    parser.add_argument("--verbose", "-v", action="store_true", help="Verbose logging")
    args = parser.parse_args()

    level = logging.DEBUG if args.verbose else logging.INFO
    logging.basicConfig(level=level, format="%(levelname)s: %(message)s")

    global _jinja_env
    _jinja_env = create_jinja_env(args.theme)

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
