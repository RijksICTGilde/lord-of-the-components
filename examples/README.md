# Getting started

Install the packages, author templates with `<c-*>` tags, and put a `<c-page>`
at the top — it renders the full HTML document and pulls in the CSS (and JS, for
web-component design systems) for whatever design system you activated. You never
link a stylesheet by hand.

## Install

The LOTC packages aren't on PyPI yet, so install them from this checkout
(editable):

```bash
pip install -e python -e packages/lotc-rvo
# add -e packages/lotc-nldd -e packages/lotc-bgnldd to also render NLDD
```

`lord-of-the-components` is the core (the `<c-*>` compiler + component
definitions). Each design system is a separate package (`lotc-rvo`, `lotc-nldd`,
…) discovered automatically via entry points — installing one makes it available
to `design_systems=[...]`.

## The three-step integration

Any framework (Flask, FastAPI, Django, a plain script) needs the same three
things:

```python
from jinja2 import Environment, FileSystemLoader
from lord_of_the_components import setup_components, get_static_roots

# 1. A Jinja Environment with your templates. autoescape=True is required.
env = Environment(loader=FileSystemLoader("templates"), autoescape=True)

# 2. Teach Jinja the <c-*> tags + which design system(s) to render with.
#    This also appends the component + design-system template dirs to the
#    loader's searchpath — so use a FileSystemLoader (it has a `searchpath`),
#    not a ChoiceLoader / framework loader that hides it.
setup_components(env, design_systems=["rvo"])

# 3. Serve these roots under /static/lotc/ — the CSS/JS <c-page> references.
#    A request for /static/lotc/<rest> maps to <root>/lotc/<rest>, first match wins.
static_roots = get_static_roots()
```

Then a template is just:

```html
<c-page title="Hello" theme="rvo" design-systems="rvo">
  <c-header text="My app" link="/"/>
  <c-heading type="h1">It just works</c-heading>
  <c-button type="primary" label="Go"/>
</c-page>
```

`<c-page>` emits the `<!DOCTYPE>`, `<head>` with all the design-system asset
`<link>`/`<script>` tags, and the `<body>`. `setup_components` does not need a
`registry_path` — it defaults to the one shipped in the core package.

## Runnable examples

| Example | Framework | Run |
| --- | --- | --- |
| [`flask_app/`](flask_app/) | Flask | `python app.py` → http://localhost:8000 |
| [`fastapi_app/`](fastapi_app/) | FastAPI | `uvicorn app:app --port 8000` |
| [`getting-started/`](getting-started/) | stdlib `http.server` | `python app.py --serve` |

Each is ~60 lines: a Jinja env, `setup_components`, one route that renders a
template, and one route that serves `get_static_roots()` under `/static/lotc/`.

## Switching design systems

Change one argument — no template edits:

```python
setup_components(env, design_systems=["nldd"])   # was ["rvo"]
```

The same `<c-*>` markup now renders as NLDD web components. NLDD ships a
JavaScript module bundle (RVO is pure CSS); `<c-page>` adds the `<script>` tag
and the same `/static/lotc/` route serves it — nothing else to wire.

If a design system doesn't implement a component you use, the default is a clear
error. Pass `setup_components(..., on_missing_component="placeholder")` to render
a visible gap marker instead, so you can switch systems, see what's missing, and
fill it in later.
