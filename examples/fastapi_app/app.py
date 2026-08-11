"""Lord of the Components — FastAPI quick-start.

The whole integration is three steps:

  1. Build a Jinja env whose loader includes the LOTC component templates.
  2. setup_components(env, design_systems=[...])  — teaches Jinja the <c-*> tags
     and which design system(s) to render them with.
  3. Serve get_static_roots() under /static/lotc/  — the CSS/JS that <c-page>
     references. That's it: <c-page> wires the <head> for you.

Run:
    pip install -r requirements.txt
    uvicorn app:app --port 8000
    # open http://localhost:8000

Switch design systems by changing DESIGN_SYSTEMS below (e.g. ["nldd"] — its
web-component bundle is served by the same /static/lotc/ route).
"""

from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, HTMLResponse
from jinja2 import Environment, FileSystemLoader

from lord_of_the_components import get_static_roots, setup_components

DESIGN_SYSTEMS = ["lotc-layout", "rvo"]

BASE = Path(__file__).resolve().parent

# 1. Jinja env with your own templates. setup_components appends the LOTC
#    component + design-system template dirs to this FileSystemLoader's
#    searchpath. autoescape=True is required (renderers escape values).
env = Environment(
    loader=FileSystemLoader(str(BASE / "templates")),
    autoescape=True,
    auto_reload=False,  # compile each template once; cache it (production mode).
)

# 2. Teach Jinja the <c-*> syntax + which design system(s) to render.
# Dev default: fail loudly on an unrecognised icon name or enum value (a silent blank
# box otherwise). In production drop on_unknown_value, or set LOTC_STRICT=0.
setup_components(env, design_systems=DESIGN_SYSTEMS, on_unknown_value="error")

# Roots that back the /static/lotc/ URL space (core styles + each design system's bundle).
STATIC_ROOTS = [Path(r) for r in get_static_roots()]

app = FastAPI()


@app.get("/", response_class=HTMLResponse)
def index() -> str:
    return env.get_template("index.html").render()


# 3. Serve the assets <c-page> links to. /static/lotc/<rest> -> <root>/lotc/<rest>.
@app.get("/static/lotc/{rel:path}")
def lotc_static(rel: str) -> FileResponse:
    for root in STATIC_ROOTS:
        candidate = (root / "lotc" / rel).resolve()
        if candidate.is_relative_to(root.resolve()) and candidate.is_file():
            return FileResponse(candidate)
    raise HTTPException(status_code=404, detail="Static asset not found")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, port=8000)
