# Lord of the Components

A component system for Jinja2 that lets you use `<c-*>` custom tags in your templates. Components render to fully styled HTML using the RVO/Utrecht design system.

```html
<c-page title="My App" theme="rvo">
  <c-heading type="h1">Welcome</c-heading>
  <c-button type="primary" name="Get started" />
</c-page>
```

## Quick Start

### Install

```bash
# Python package (Jinja2 integration)
pip install -e python/

# Node dependencies (for generators and visual tests)
npm install
```

### Run the Getting-Started Example

```bash
cd examples/getting-started
python app.py --serve
# Open http://localhost:8080
```

This serves a fully styled page showcasing all 22 components with bundled RVO CSS.

### Use in Your Own Project

```python
from jinja2 import Environment, FileSystemLoader, ChoiceLoader
from lord_of_the_components import setup_components, get_templates_path, get_static_files_path

env = Environment(loader=ChoiceLoader([
    FileSystemLoader('your/templates'),
    FileSystemLoader(get_templates_path()),
]))
setup_components(env, registry_path='path/to/registry.json')
```

The registry file is at `python/src/lord_of_the_components/registry.json`.

### Frontend Assets

`<c-page>` automatically injects `<link href="/static/lotc/dist/lotc.css">`. Your server needs to serve the bundled CSS:

```python
from lord_of_the_components import get_static_files_path

STATIC_DIR = get_static_files_path()  # Serve this directory at /static/lotc/
```

The CSS is built from RVO/Utrecht packages via webpack:

```bash
npm run build:fe
```

## Components

### Page Structure
| Component | Tag | Description |
|-----------|-----|-------------|
| Page | `<c-page>` | Full HTML document with `<head>`, theme, and CSS injection |
| Header | `<c-header>` | Site header with Rijksoverheid logo |
| Hero | `<c-hero>` | Hero banner with title, subtitle, and optional image |
| Footer | `<c-footer>` | Page footer with optional pay-off text |

### Layout
| Component | Tag | Description |
|-----------|-----|-------------|
| Layout Flow | `<c-layout-flow>` | Flexbox flow with gap, direction, alignment |
| Layout Row | `<c-layout-row>` | Grid row container |
| Layout Column | `<c-layout-column>` | Grid column with responsive sizing (xs/sm/md/lg) |
| Max Width Layout | `<c-max-width-layout>` | Centered container with max-width |
| Grid | `<c-grid>` | CSS grid with named column counts and gap |

### Typography
| Component | Tag | Description |
|-----------|-----|-------------|
| Heading | `<c-heading>` | `<h1>` through `<h6>` |
| Paragraph | `<c-paragraph>` | Styled paragraph |
| Link | `<c-link>` | Anchor with color, weight, icon options |
| Label | `<c-label>` | Form label |
| Strong | `<c-strong>` | Bold emphasis |
| Em | `<c-em>` | Italic emphasis |

### Actions
| Component | Tag | Description |
|-----------|-----|-------------|
| Button | `<c-button>` | Button with type, size, icon, loading, disabled states |

### Data Display
| Component | Tag | Description |
|-----------|-----|-------------|
| Card | `<c-card>` | Card with optional image, link, outline, padding |
| Icon | `<c-icon>` | RVO icon with size and color |
| Data List | `<c-data-list>` | Definition list (`<dl>`) wrapper |
| Alert | `<c-alert>` | Info/success/warning/error messages |

### Navigation
| Component | Tag | Description |
|-----------|-----|-------------|
| Menu | `<c-menu>` + `<c-menu-item>` | Menubar with dropdowns and submenus |
| Breadcrumbs | `<c-breadcrumbs>` + `<c-breadcrumbs-item>` | Breadcrumb trail |

## Project Structure

```
lord-of-the-components/
├── definitions/              # Component definitions (.def.ts)
│   ├── components/           #   button.def.ts, heading.def.ts, ...
│   ├── props.ts              #   Shared prop definitions
│   └── values.ts             #   Shared value enums
│
├── implementations/          # HTML/CSS mappings (.impl.ts)
│   └── components/           #   button.impl.ts, heading.impl.ts, ...
│
├── core/                     # TypeScript workspace
│   └── src/generators/       #   Jinja2 template generator
│       └── jinja2/
│           ├── index.ts      #   Jinja2Generator class
│           ├── generate-all.ts    # Generate all templates + registry
│           └── generate-registry.ts
│
├── python/                   # Python package
│   └── src/lord_of_the_components/
│       ├── extension.py      #   Jinja2 extension (BeautifulSoup-based)
│       ├── registry.py       #   Component registry
│       ├── registry.json     #   Generated component metadata
│       ├── templates/        #   Generated .html.j2 templates
│       └── static/lotc/dist/ #   Bundled RVO/Utrecht CSS
│
├── examples/                 # Usage examples
│   └── getting-started/      #   Fully working example app
│
├── tests/visual/             # Playwright visual regression tests
│   ├── serve.py              #   Test server (port 5555)
│   ├── fixtures/             #   HTML fixture files
│   └── specs/                #   Playwright test specs
│
└── specs/                    # Project plans and progress tracking
```

## How to Add a New Component

1. **Define it** in `definitions/components/{name}.def.ts` using `defineComponent()`
2. **Implement it** in `implementations/components/{name}.impl.ts` using `defineImplementation()` with the Element Tree API
3. **Export it** from `implementations/components/index.ts`
4. **Add it** to the `implementations` array in `core/src/generators/jinja2/generate-all.ts`
5. **Generate** the template and registry:
   ```bash
   npx tsx core/src/generators/jinja2/generate-all.ts
   ```
6. **Test** with e2e tests in `python/tests/test_{name}_e2e.py`
7. **Add visual test** fixture in `tests/visual/fixtures/{name}-variants.html`

For components with complex nested structure that can't be expressed declaratively (e.g., header, hero, alert), the template may need hand-tuning after generation.

## Development

### Generate Templates

```bash
npx tsx core/src/generators/jinja2/generate-all.ts
```

### Run E2E Tests

```bash
cd python && pytest
```

### Run Visual Tests

```bash
npx playwright test --config tests/visual/playwright.config.ts
```

### Build Frontend Assets

```bash
npm run build:fe
```

## License

MIT
