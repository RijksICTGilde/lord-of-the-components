"""
Minimal example: render LOTC components to a styled HTML page.

Usage:
    # Render to file
    python app.py

    # Serve with live rendering on http://localhost:8080
    python app.py --serve

Prerequisites:
    cd ../../python && pip install -e .
"""

import argparse
import mimetypes
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlparse

from jinja2 import Environment, FileSystemLoader

from lord_of_the_components import setup_components, get_static_files_path

# Paths — adjust if you move this example
EXAMPLE_DIR = Path(__file__).resolve().parent
TEMPLATES_DIR = EXAMPLE_DIR / "templates"

# LOTC package paths (relative to this repo checkout)
LOTC_PYTHON = EXAMPLE_DIR.parent.parent / "python" / "src" / "lord_of_the_components"
LOTC_TEMPLATES = LOTC_PYTHON / "templates"
LOTC_REGISTRY = LOTC_PYTHON / "registry.json"
STATIC_DIR = Path(get_static_files_path())


def create_env() -> Environment:
    """Set up Jinja2 with LOTC component support."""
    env = Environment(
        # Your templates first, then LOTC component templates
        loader=FileSystemLoader([str(TEMPLATES_DIR), str(LOTC_TEMPLATES)]),
    )
    setup_components(env, registry_path=str(LOTC_REGISTRY))
    return env


def render_page(env: Environment, template_name: str = "index.html") -> str:
    """Render a template through the LOTC pipeline."""
    template = env.from_string(
        (TEMPLATES_DIR / template_name).read_text(encoding="utf-8")
    )
    return template.render()


def main() -> None:
    parser = argparse.ArgumentParser(description="LOTC getting-started example")
    parser.add_argument(
        "--serve", action="store_true", help="Start HTTP server on port 8080"
    )
    parser.add_argument("--port", type=int, default=8080)
    parser.add_argument(
        "-o", "--output", type=str, help="Write rendered HTML to file"
    )
    args = parser.parse_args()

    env = create_env()

    if args.serve:
        serve(env, args.port)
    else:
        html = render_page(env)
        if args.output:
            Path(args.output).write_text(html, encoding="utf-8")
            print(f"Written to {args.output}")
        else:
            print(html)


def serve(env: Environment, port: int) -> None:
    """Simple HTTP server that renders templates on each request."""

    class Handler(SimpleHTTPRequestHandler):
        def do_GET(self) -> None:
            path = urlparse(self.path).path.lstrip("/")

            if path.startswith("static/"):
                self._serve_static(path)
                return

            template_name = path if path.endswith(".html") else "index.html"
            template_file = (TEMPLATES_DIR / template_name).resolve()

            if not template_file.is_relative_to(TEMPLATES_DIR.resolve()):
                self.send_error(403, "Forbidden")
                return

            if not template_file.exists():
                self.send_error(404, f"Not found: {template_name}")
                return

            try:
                html = render_page(env, template_name)
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Cache-Control", "no-cache")
                self.end_headers()
                self.wfile.write(html.encode("utf-8"))
            except Exception as e:
                self.send_response(500)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.end_headers()
                self.wfile.write(
                    f"<h1>Render Error</h1><pre>{e}</pre>".encode("utf-8")
                )

        def _serve_static(self, url_path: str) -> None:
            """Serve static files from the LOTC bundled assets directory."""
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

    server = HTTPServer(("localhost", port), Handler)
    print(f"Serving on http://localhost:{port}")
    print(f"Templates: {TEMPLATES_DIR}")
    print("Press Ctrl+C to stop")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped")
        server.shutdown()


if __name__ == "__main__":
    main()