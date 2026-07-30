"""Lord of the Components — Flask quick-start.

The whole integration is three steps:

  1. Build a Jinja Environment whose loader points at your templates.
  2. setup_components(env, design_systems=[...])  — teaches Jinja the <c-*> tags,
     which design system(s) to render them with, and appends the LOTC component +
     design-system template dirs to the loader's searchpath.
  3. Serve get_static_roots() under /static/lotc/  — the CSS/JS that <c-page>
     references. That's it: <c-page> wires the <head> for you.

We render LOTC pages through a dedicated Environment (not Flask's app.jinja_env)
because Flask's loader is a DispatchingJinjaLoader without a `searchpath` for
setup_components to extend — a plain FileSystemLoader is what it needs. Flask
still owns routing and static serving.

Run:
    pip install -r requirements.txt
    python app.py
    # open http://localhost:8000

Switch design systems by changing DESIGN_SYSTEMS below (e.g. ["nldd"] — its
web-component bundle is served by the same /static/lotc/ route).
"""

from __future__ import annotations

from pathlib import Path

from flask import Flask, abort, send_from_directory
from jinja2 import Environment, FileSystemLoader

from lord_of_the_components import get_static_roots, setup_components

DESIGN_SYSTEMS = ["lotc-layout", "rvo"]

BASE = Path(__file__).resolve().parent
app = Flask(__name__)

# 1 + 2. A dedicated Jinja env for LOTC pages. autoescape=True is required by
#        setup_components (component renderers escape values); it also appends
#        the component + design-system template dirs to this loader's searchpath.
env = Environment(
    loader=FileSystemLoader(str(BASE / "templates")),
    autoescape=True,
    auto_reload=False,  # compile each template once; cache it (production mode).
)
setup_components(env, design_systems=DESIGN_SYSTEMS)

# Roots that back the /static/lotc/ URL space (core styles + each design system's bundle).
STATIC_ROOTS = [Path(r) for r in get_static_roots()]


@app.route("/")
def index() -> str:
    return env.get_template("index.html").render()


# 3. Serve the assets <c-page> links to. /static/lotc/<rest> -> <root>/lotc/<rest>.
@app.route("/static/lotc/<path:rel>")
def lotc_static(rel: str):
    for root in STATIC_ROOTS:
        candidate = (root / "lotc" / rel).resolve()
        if candidate.is_relative_to(root.resolve()) and candidate.is_file():
            return send_from_directory(candidate.parent, candidate.name)
    abort(404)


if __name__ == "__main__":
    app.run(port=8000, debug=True)
