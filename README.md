# Lord of the Components

An **implementation-agnostic** component system with `c-` prefixed tagnames that supports multiple output targets (Jinja2, React, raw HTML, Web Components) through a layered architecture.

## Core Principles

1. **Pure abstraction**: The system defines WHAT components do, not HOW they look. No CSS provided.
2. **Auto-documented**: Every component is fully documented with rich examples
3. **Generic-first**: Use generic sizing (sm/md/lg), colors (primary/secondary), and data structures
4. **Implementation-agnostic**: Themes/connectors provide actual CSS and rendering

## Quick Start

### TypeScript (Build Tooling)

```bash
# Install dependencies
npm install

# Build the core tooling
cd core && npm run build

# Run the CLI
npx lotc build          # Build tokens and components
npx lotc validate       # Validate definitions
npx lotc docs           # Generate documentation
npx lotc registry       # Generate Python registry
npx lotc ide            # Generate IDE autocomplete
```

### Python (Jinja2 Integration)

```bash
# Install the package
pip install -e .
```

```python
from jinja2 import Environment, FileSystemLoader
from lord_of_the_components import setup_components

env = Environment(loader=FileSystemLoader('templates'))
setup_components(env, theme='default', htmx=True)

# Now use in templates:
# <c-page title="Home">
#   <c-layout>
#     <c-stack gap="md">
#       <h1>Welcome</h1>
#       <c-button variant="primary">Click me</c-button>
#     </c-stack>
#   </c-layout>
# </c-page>
```

## Project Structure

```
lord-of-the-components/
├── lotc.config.kdl           # Main configuration
├── package.json              # NPM workspace
├── pyproject.toml            # Python package
│
├── core/                     # TypeScript build tooling
│   └── src/
│       ├── cli/              # CLI commands (build, validate, docs, ide)
│       ├── parser/           # KDL parsing
│       ├── loader/           # Token/component/theme loading
│       ├── resolver/         # Token + adapter resolution
│       ├── rigscript/        # RigScript DSL (lexer, parser, transpilers)
│       ├── validators/       # Accessibility validation
│       ├── generators/       # Output generators (docs, registry, IDE)
│       └── build.ts          # Build orchestration
│
├── tokens/                   # Design tokens (3 layers)
│   ├── primitives/           # Raw values (colors, spacing)
│   └── semantic/             # Purpose-driven schema
│
├── themes/                   # Theme implementations
│   └── default/
│       ├── theme.kdl         # Token mappings
│       └── jinja2/           # Jinja2 templates
│
├── packages/                 # Component packages
│   ├── core/                 # Core components (c-page, c-button)
│   └── layout/               # Layout (c-layout, c-grid, c-stack)
│
├── python/                   # Python runtime
│   └── src/lord_of_the_components/
│       ├── extension.py      # Jinja2 extension
│       ├── registry.py       # Component registry
│       └── validation.py     # Data validation
│
└── docs/                     # Documentation
    ├── features/             # Feature specifications
    └── generated/            # Auto-generated docs
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `lotc build` | Build tokens and components |
| `lotc build --watch` | Watch mode - rebuild on changes |
| `lotc build --tokens` | Build only tokens |
| `lotc validate` | Validate component definitions |
| `lotc docs` | Generate documentation site |
| `lotc registry` | Generate Python registry |
| `lotc ide` | Generate IDE autocomplete files |

## Token System (3 Layers)

### Layer 1: Primitives
Raw values that form the foundation:
```kdl
// tokens/primitives/colors.kdl
colors {
    blue {
        "500" (color)"#3b82f6"
        "600" (color)"#2563eb"
    }
}
```

### Layer 2: Semantic
Purpose-driven vocabulary:
```kdl
// tokens/semantic/schema.kdl
semantic {
    color {
        primary
        primary-hover
        on-primary
    }
}
```

### Layer 3: Implementation (Theme)
Maps semantic to primitives:
```kdl
// themes/default/theme.kdl
theme "default" {
    tokens {
        color {
            primary       "{primitives.colors.blue.500}"
            primary-hover "{primitives.colors.blue.600}"
        }
    }
}
```

## Component Syntax

### Basic Usage
```html
<c-button variant="primary">Click me</c-button>
<c-stack direction="horizontal" gap="md">
    <span>Item 1</span>
    <span>Item 2</span>
</c-stack>
```

### Attribute Prefixes

| Prefix | Meaning | Example |
|--------|---------|---------|
| (none) | Static string | `variant="primary"` |
| `:` | Dynamic expression | `:items="menu_items"` |
| `@` | Event handler | `@click="handleClick()"` |

### Generic Values

Components use generic values that adapt to implementations:
- **Sizes**: `xs`, `sm`, `md`, `lg`, `xl`, `2xl`, `3xl`
- **Colors**: `primary`, `secondary`, `success`, `warning`, `error`, `info`

## Available Components

### Core Package
- `<c-page>` - HTML document structure with auto-includes
- `<c-button>` - Interactive button for user actions

### Layout Package
- `<c-layout>` - Main layout with header/footer/sidebar regions
- `<c-grid>` - CSS Grid-based layout
- `<c-stack>` - Flexbox-based stacking

## RigScript

RigScript is a Python-like DSL for component rendering logic:

```python
# components/button/button.rig
render.element("button"):
    attrs.type = props.type
    attrs.class = "btn btn-" + props.variant

    if props.icon and props.icon_position == "before":
        render.component("icon", name=props.icon)

    render.slot("default")
```

Compiles to Jinja2:
```jinja2
<button type="{{ type }}" class="btn btn-{{ variant }}">
  {% if icon and icon_position == "before" %}
    {% include "components/icon.html.j2" %}
  {% endif %}
  {{ content | safe }}
</button>
```

Or to React:
```jsx
<button type={props.type} className={`btn btn-${props.variant}`}>
  {props.icon && props.iconPosition === "before" && <Icon name={props.icon} />}
  {children}
</button>
```

## Documentation System

Auto-generated documentation with live examples:

```bash
lotc docs
# Open dist/docs/index.html
```

Features:
- Live component previews using Web Components
- Auto-generated props/slots tables
- Interactive playground
- Search functionality
- Works as static files (no server needed)

## IDE Support

Generate autocomplete for your IDE:

```bash
# VS Code
lotc ide --format vscode
# Add to settings.json: "html.customData": ["./dist/ide/lotc.html-data.json"]

# WebStorm
lotc ide --format webstorm
# Add to package.json: "web-types": "./dist/ide/web-types.json"
```

## Python Features

### Data Validation

```python
from lord_of_the_components import validate_items, validate_steps

# Validate menu items
result = validate_items([
    {"label": "Home", "href": "/"},
    {"label": "About", "href": "/about"}
])
print(result.valid)  # True

# Validate progress steps
result = validate_steps([
    {"label": "Start", "state": "complete"},
    {"label": "Review", "state": "current"}
])
```

### Loading Custom Registry

```python
from pathlib import Path
from lord_of_the_components import setup_components
from lord_of_the_components.registry import ComponentRegistry

# Load generated registry
registry = ComponentRegistry(Path("dist/registry.json"))
setup_components(env, registry=registry)
```

## Accessibility

Built-in accessibility validation:

```bash
lotc validate --verbose
# Reports accessibility issues in component definitions
```

Rules include:
- Interactive elements need labels
- Form inputs need label association
- Images need alt text
- Modals need focus management

## Development

```bash
# Build TypeScript
cd core && npm run build

# Run in watch mode
cd core && npm run dev

# Test Python
pip install -e ".[dev]"
pytest

# Generate all outputs
npx lotc build && npx lotc docs && npx lotc ide
```

## Documentation

See `docs/features/` for detailed documentation:
- [RigScript Language](docs/features/rigscript.md)
- [Generic Values](docs/features/generic-values.md)
- [Documentation System](docs/features/documentation-system.md)
- [Python Integration](docs/features/python-integration.md)
- [Accessibility](docs/features/accessibility.md)
- [IDE Support](docs/features/ide-support.md)
- [Namespace Imports](docs/features/namespace-imports.md) (future)

## License

MIT
