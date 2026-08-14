# Lord of the Components

A **design-system-agnostic** component compiler for Jinja2. Author your templates
once with `<c-*>` tags; render them to whatever design system you activate — and
switch systems by changing one argument, with no template edits.

```html
<c-page title="My App" design-systems="rvo">
  <c-header text="My app" link="/"/>
  <c-heading type="h1">Welcome</c-heading>
  <c-button type="primary" label="Get started"/>
</c-page>
```

The same markup rendered under `design_systems=["rvo"]` produces RVO/Utrecht
HTML; under `["nldd"]` it produces NLDD web components. Component *definitions*
are global (they live in core); each *design system* is a separate, installable
package that provides the implementations. You can add your own.

## Why

- **One set of templates, many design systems.** `<c-metric>`, `<c-button>`,
  `<c-card>` … are defined once. RVO, NLDD (and your own) each implement the
  subset they support.
- **Switch in one line.** `setup_components(env, design_systems=["nldd"])`.
- **Partial coverage is a feature.** If the active system doesn't implement a
  component, you get a clear error — or, opt in to
  `on_missing_component="placeholder"` and it renders a visible gap marker so you
  can switch, see the holes, and fill them in later.
- **`<c-page>` wires the `<head>` for you.** It emits the full document and the
  CSS/JS `<link>`/`<script>` tags for whatever systems you activated. You never
  link a stylesheet by hand.

## Status: a bet, honestly labelled

We don't know yet whether this component system will turn out to be valuable or
even usable in practice. Agentic coding is changing what "writing a template"
means, and it's changing fast — anything built today has to earn its keep
tomorrow.

What we *do* know is the usage side. A uniform, abstract component vocabulary is
worth something on its own: it reduces building a layout to expressing
**semantics** — "a page with a header, a hero, and a grid of cards" — instead of
reasoning about one design system's class names, wrapper divs and markup order.
You describe intent; the compiler deals with the implementation.

That only pays off if design systems are interchangeable enough to sit behind a
shared contract. Often they aren't — and where the abstraction leaks, we'd
rather say so than pretend. But the idea has proven its worth before, and we
think it's worth backing again.

There's a second payoff that doesn't depend on the first: **structure**. Menus,
breadcrumbs, navigation trees, data lists, tables — the things every project
rebuilds with a slightly different nested loop and a slightly different helper.
Here they're components that take data and render it, consistently, once. Fewer
loops in your templates, fewer bespoke solutions to maintain.

## Install

The packages aren't on PyPI yet, so install them from this checkout:

```bash
pip install -e python -e packages/lotc-rvo
# add -e packages/lotc-nldd for the NLDD design system
# add -e packages/lotc-layout for the layout primitives, -e packages/lotc-charts for charts
```

**No Node/npm as a consumer.** The packages ship the full built frontend (the
webpack CSS/JS bundles, design tokens, fonts, icons, web-component modules), so a
plain `pip`/`poetry install` gives you everything.

`lord-of-the-components` is the core (the `<c-*>` compiler + the global component
definitions). Each design system is its own package (`lotc-rvo`, `lotc-nldd`, …)
discovered automatically via a Python entry point — installing one makes it
available to `design_systems=[...]`.

## Use it

Three steps, in any framework:

```python
from jinja2 import Environment, FileSystemLoader
from lord_of_the_components import setup_components, get_static_roots

# 1. A Jinja env with your templates. Use a FileSystemLoader (it has a
#    `searchpath` that setup_components extends); autoescape is required.
env = Environment(loader=FileSystemLoader("templates"), autoescape=True)

# 2. Teach Jinja the <c-*> tags + which design system(s) to render with.
#    No registry_path needed — it defaults to the one shipped in core.
setup_components(env, design_systems=["rvo"])

# 3. Serve these roots under /static/lotc/ — the CSS/JS <c-page> references.
#    A request for /static/lotc/<rest> maps to <root>/lotc/<rest>, first wins.
static_roots = get_static_roots()
```

Runnable quick-starts live in [`examples/`](examples/): **Flask**
([`examples/flask_app/`](examples/flask_app/)), **FastAPI**
([`examples/fastapi_app/`](examples/fastapi_app/)), and a no-framework stdlib
server ([`examples/getting-started/`](examples/getting-started/)). See
[`examples/README.md`](examples/README.md) for the full walkthrough.

## Components

Components are grouped into page structure, layout, typography, actions, data
display, navigation, forms, and app/dashboard patterns (metric, sidenav, layer,
activity, catalog-card, filter-bar, site-footer, …). The full, always-current
list — every component, its props, and which design systems implement it — is
generated into [`COMPONENTS.md`](COMPONENTS.md) and [`COVERAGE.md`](COVERAGE.md).

## Architecture

```
lord-of-the-components/
├── definitions/            # GLOBAL component contracts (.def.ts) — theme-agnostic
│   ├── components/         #   button.def.ts, metric.def.ts, …
│   ├── icons.ts            #   semantic icon name -> per-design-system sprite map
│   ├── props.ts / values.ts
│
├── implementations/        # the default (RVO) implementations (.impl.ts, IR)
├── themes/                 # per-design-system implementation overrides (nldd, …)
│
├── core/src/generators/    # TypeScript generator (run via `npx tsx`): emits the
│                           #   Jinja templates, Python renderers, and registry.json
│
├── python/                 # core package: the <c-*> compiler
│   └── src/lord_of_the_components/
│       ├── extension.py    #   one-pass Jinja extension (design-system dispatch,
│       │                   #     constant folding, macro rendering)
│       ├── registry.json   #   generated component metadata
│       ├── templates/ static/   # core templates + layout.css/app-components.css
│
├── packages/               # design-system packages (each = one installable dist)
│   ├── lotc-rvo/           #   RVO renderers + templates + built CSS/JS bundle
│   ├── lotc-nldd/          #   NLDD renderers + web-component module bundle
│   ├── lotc-layout/        #   theme-agnostic layout primitives + layout.css
│   ├── lotc-charts/        #   opt-in chart set (Chart.js, NLDD-styled)
│   └── lotc-forms/         #   opt-in form-field set (per-theme fields + ARIA)
│
├── examples/               # Flask / FastAPI / stdlib quick-starts
└── tests/visual/           # fixtures + Playwright screenshots
```

A **design system** is a Python package that declares a
`lord_of_the_components.design_systems` entry point pointing at a `DesignSystem`
descriptor (renderers module, templates path, static bundle, CSS/JS URLs). Core
discovers whatever is installed — nothing hard-codes RVO or NLDD.

## Add a component

1. **Define it** (global contract) in `definitions/components/{name}.def.ts` with
   `defineComponent()`, and register it in `definitions/components/index.ts`.
2. **Implement it** for one or more design systems — either a declarative
   `.impl.ts` (compiled to a Python renderer) or a hand-authored
   `templates/components/{name}.html.j2` in the design-system package.
3. **Regenerate** templates + renderers + registry:
   ```bash
   npm run build && npx tsx core/src/generators/jinja2/generate-all.ts
   ```
4. **Test** (`cd python && pytest`) and add a visual fixture under
   `tests/visual/fixtures/`.

A design system only needs to implement the components it supports; where none
does, `on_missing_component` decides between an error and a placeholder.

## Develop

```bash
npm install                                   # generator + visual-test deps
npm run build                                 # compile the TS generator
npx tsx core/src/generators/jinja2/generate-all.ts   # regenerate Jinja/renderers/registry
npm run build:fe                              # rebuild the design-system CSS/JS bundles
cd python && pytest                           # Python test suite
```

> The built frontend bundles are committed under each package's
> `static/lotc/dist/`. Rebuilding them (`npm run build:fe`) is a maintainers-only
> step — consumers never run npm.

## License

MIT
