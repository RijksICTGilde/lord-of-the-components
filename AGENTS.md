# Using Lord of the Components (for AI agents)

Instructions for an AI author writing templates with this library. Humans: see
[README.md](README.md) and [examples/](examples/).

## What it is

A design-system-agnostic component compiler for Jinja2. You write `<c-*>` tags;
they render to whatever design system the app activated (RVO, NLDD, or another).
The same markup renders under any system — never hard-code a design-system class
(`rvo-button`, `nldd-*`) in a template; use the `<c-*>` component.

## Setup (host app, once)

```python
from jinja2 import Environment, FileSystemLoader
from lord_of_the_components import setup_components, get_static_roots

env = Environment(loader=FileSystemLoader("templates"), autoescape=True)  # both required
setup_components(env, design_systems=["rvo"])        # no registry_path needed
# serve get_static_roots() under /static/lotc/  (see examples/)
```

- **Use a `FileSystemLoader`** (it has a `searchpath` that `setup_components`
  extends). A `ChoiceLoader` / Flask's default loader silently breaks the wiring.
- **`autoescape=True` is required.** `<c-page>` emits the `<head>` + all
  design-system asset tags; you never link a stylesheet by hand.

## Authoring `<c-*>` templates

```html
<c-page title="My app" design-systems="rvo">
  <c-header text="My app" link="/"/>
  <c-heading type="h1">Welcome</c-heading>
  <c-button type="primary" label="Save"/>
  <c-card outline padding="lg"><c-p>Body text.</c-p></c-card>
</c-page>
```

### Attributes — five forms, work on every attribute

| Form | Meaning | Example |
|---|---|---|
| `attr="literal"` | static string | `type="primary"` |
| `:attr="expr"` | Jinja expression, object-preserving | `:label="user.name"` |
| `attr="{{ expr }}"` | same as `:attr` (whole-value mustache) | `items="{{ nav }}"` |
| `attr="a/{{ x }}/b"` | string interpolation (mixed) | `href="/u/{{ id }}"` |
| boolean | present = true | `outline`, `active`, `:disabled="x"` |

Also: `@click="fn()"` → native `onclick` (all DOM events supported);
`hx-get`/`hx-*` pass through (call `setup_components(htmx=True)` to load htmx);
`data-*`, `aria-*`, `class`, `id`, `style` pass through to the root element.

"Every attribute" includes the events and includes the fields: `@click="{{ js }}"`
and `@click="go({{ id }})"` interpolate like any other value, and a
`<c-*-field>` carries `@event` / `data-*` / `aria-*` / `hx-*` onto its control.
Both were gaps until RIG-Cluster hit them: the event kept the literal `{{ … }}`
and the handler silently did nothing, and the field dropped the handler
entirely — which, with `on*` keys refused in an `:attrs` spread, left a field
with no supported way to bind one at all.

### Slots and content

Content goes between tags; named regions use `<template slot="…">`:

```html
<c-app-shell>
  <template slot="header">…</template>
  <template slot="sidebar">…</template>
  <c-stack gap="1rem">main content</c-stack>   <!-- default slot -->
  <template slot="footer"><c-site-footer text="©"/></template>
</c-app-shell>
```

### Data-driven components (`:items`)

`<c-menu>` and `<c-tabs>` build themselves from an array — each item a dict *or*
object; menus nest recursively:

```html
<c-menu type="vertical" :items="nav"/>
<c-tabs :items="tabs"/>
```
```python
nav = [
  {"label": "Home", "href": "/", "icon": "home", "active": True},
  {"label": "Admin", "children": [                 # children -> submenu
      {"label": "Users", "href": "/admin/users"},
  ]},
]
```
Item fields (aliases accepted): `label|name`, `href|path`, `active|selected`,
`icon`, `disabled`, `children|subitems`. Bad shapes raise a clear validation
error. When `:items` is awkward, a plain loop works too:
`{% for t in tabs %}<c-tab :label="t.label" :href="t.href"/>{% endfor %}`.

## Switching design systems

Change one argument — no template edits: `setup_components(env,
design_systems=["nldd"])`. If the active system doesn't implement a component,
the default is a clear error; pass
`setup_components(..., on_missing_component="placeholder")` to render a visible
gap marker instead (switch systems, see what's missing, fill it in later).

## Finding components

- [COMPONENTS.md](COMPONENTS.md) — every component, its props/events/bindings,
  and which design systems implement it (generated; do not hand-edit).
- The live gallery (`tests/visual/serve.py`, then open `/showcase.html?ds=rvo` —
  add `?ds=nldd,bgnldd` to switch) renders every component in the chosen system.

## Gotchas (author-facing)

- **No `{% if %}` *between* attributes inside a `<c-*>` tag** — the bare text
  breaks parsing. Use `:attr`/`{{ }}` for conditional values, or an `{% if %}`
  *around* the whole tag.
- Use semantic icon names (`home`, `rectangle-stack`, `euro-sign`); they map per
  design system in `definitions/icons.ts`. An unmapped name renders nothing —
  add a row there.
- `<c-page>` renders a full document; put it at the top level, not nested. The
  footer slot belongs to `<c-app-shell>`, not `<c-page>`.
- `<c-page>` reaches two elements, so its attributes are split: `theme` /
  `class` / `body-class` style the `<body>`; `data-*` and the `:attrs` spread go
  on `<html>`. That is where a design system reads document-level state — NLDD
  takes its light/dark stand from `data-scheme` there:

  ```html
  <c-page title="My app" design-systems="nldd" data-scheme="dark">
  ```

## For contributors (add a component)

Define it globally in `definitions/components/<name>.def.ts`, implement it for
one or more design systems (a declarative `.impl.ts` or a hand-authored
`templates/components/<name>.html.j2` in the design-system package), then
`npm run build && npx tsx core/src/generators/jinja2/generate-all.ts` and
`cd python && pytest`. See [README.md](README.md#add-a-component).

### Where a component's CSS and JS go

**Not in the template.** A `<style>` or `<script>` inside a component is emitted
once per instance — three secret fields on a page meant three copies (8540 bytes
for three, 1424 after moving them out) — and it forces `'unsafe-inline'` on any
app with a Content-Security-Policy. Put CSS and behaviour in the design system's
own static files and declare them in its `DesignSystem(css_urls=…, js_urls=…)`;
`<c-page>` then loads them once. `python/tests/test_component_assets.py` enforces
this (`page.html.j2` is the one exception: it renders the document itself, and
the position of those two rules is the point).

For the NLDD package that is `static/lotc/nldd/lotc-nldd.{css,js}` —
deliberately outside `dist/`, which webpack cleans on every build and which
holds the vendored NLDD distribution.

Write them in NLDD's own idiom, so a component can be handed upstream as-is:

- **element selectors, not BEM** — NLDD styles its own components as
  `nldd-form > form`; ours read `lotc-secret-field > code`;
- **light-DOM custom elements**, plain `HTMLElement` subclasses (we do not
  depend on Lit). The server renders the full markup and the element only takes
  over behaviour, so the component still reads correctly with JS off;
- **state on attributes** (`revealed`, `value-type='json'`), so the CSS and the
  behaviour read the same flag instead of asking each other;
- **a `--components-<name>-<role>` token layer** at `:root`, each pointing at a
  `--semantics-*` token. That is NLDD's own override layer (243 of them), and it
  is what an application overrides — because the value is a token, light and
  dark both follow from it.

### Colours in a hand-authored template

Take every colour from a `--semantics-*` token. A hand-written component is the
only place a literal colour can enter, and `var(--name, #fff)` hides its own
mistake: if `--name` is not a name the theme declares, CSS silently uses the
literal — which cannot follow the theme's `light-dark()` pairs, so the component
keeps its light colours on a dark page and nothing warns.

`python/tests/test_theme_token_names.py` holds four gates: token names must be
ones the NLDD bundle declares; `--nldd-color-*` override hooks must fall back to
a token, not a literal; **no colour may be written without a token at all** (a
bare `background: #eef0f4` mentions no token, so the first two gates cannot see
it); and `tests/visual/fixtures/dark-scheme.html` must render every class of
ours that sets a colour — otherwise the measurement below is silently partial.

`tests/visual/dark_contrast_shoot.mjs` measures the rendered page: contrast per
text run, light-on-dark islands, and — because a `<canvas>` has no text nodes —
the ink of every chart, sampled per pixel. Run it in both stands:

```
python tests/visual/serve.py --port 5555 --theme nldd,lotc-forms,lotc-charts \
  --on-missing placeholder &
node tests/visual/dark_contrast_shoot.mjs 'http://localhost:5555/dark-scheme.html'
node tests/visual/dark_contrast_shoot.mjs 'http://localhost:5555/dark-scheme.html' --light
```

A chart needs colour VALUES (Chart.js cannot take a custom property), so
lotc-charts resolves tokens in script via `_charts.j2` — reading one is not a
`getPropertyValue` call, see the note there.
