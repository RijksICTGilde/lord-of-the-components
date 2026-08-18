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

### Colours in a hand-authored template

Take every colour from a `--semantics-*` token. A hand-written component is the
only place a literal colour can enter, and `var(--name, #fff)` hides its own
mistake: if `--name` is not a name the theme declares, CSS silently uses the
literal — which cannot follow the theme's `light-dark()` pairs, so the component
keeps its light colours on a dark page and nothing warns.

`python/tests/test_theme_token_names.py` checks every token name we consume
against the ones the NLDD bundle actually declares, and requires that our own
`--nldd-color-*` override hooks fall back to a token rather than a literal.
`tests/visual/dark_contrast_shoot.mjs` measures the rendered result (contrast
ratios and light-on-dark islands) on `tests/visual/fixtures/dark-scheme.html`.
