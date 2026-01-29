# Python Integration

> **Status**: Phase 4 Implementation

## Overview

Lord of the Components provides first-class Python integration through a Jinja2 extension that enables component syntax directly in templates.

## Quick Start

```python
from jinja2 import Environment, FileSystemLoader
from lord_of_the_components import setup_components

# Create Jinja2 environment
env = Environment(loader=FileSystemLoader("templates"))

# Setup LOTC components
setup_components(env, theme="default", htmx=True)

# Use in templates
template = env.get_template("index.html.j2")
html = template.render(items=[...])
```

## Component Syntax

### Basic Usage

```html
<c-button variant="primary" size="lg">Click me</c-button>
```

### Dynamic Attributes (`:` prefix)

Pass Python variables or expressions:

```html
<c-select :items="options" :value="selected_value" />
<c-button :disabled="not form.is_valid">Submit</c-button>
```

### Event Handlers (`@` prefix)

For HTMX or JavaScript events:

```html
<c-button @click="openModal()">Open</c-button>
<c-form hx-post="/submit" hx-swap="outerHTML">...</c-form>
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    JINJA2 TEMPLATE                              │
│  <c-button variant="primary">Click</c-button>                   │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                  COMPONENT EXTENSION                            │
│  BeautifulSoup parses DOM → validates → generates include       │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    COMPONENT REGISTRY                           │
│  Validates props, types, required fields                        │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                  JINJA2 INCLUDE                                 │
│  {% include "components/button.html.j2" with context %}         │
└─────────────────────────────────────────────────────────────────┘
```

## Component Registry

### Auto-Generated Registry

When you build your project, LOTC generates a registry from KDL definitions:

```bash
lotc build --registry
# Generates: dist/registry.json
```

### Loading Custom Registry

```python
from pathlib import Path
from lord_of_the_components import setup_components
from lord_of_the_components.registry import ComponentRegistry

# Load from generated registry
registry = ComponentRegistry(Path("dist/registry.json"))

# Use in setup
setup_components(env, registry=registry)
```

### Built-in Components

The registry includes built-in components:

| Component | Category | Description |
|-----------|----------|-------------|
| `c-page` | layout | Root page structure with assets |
| `c-layout` | layout | Main layout container |
| `c-grid` | layout | CSS Grid layout |
| `c-stack` | layout | Flexbox stack layout |
| `c-button` | actions | Interactive button |

## Data Structures

### Complex Data via `:` Attributes

Components can accept complex Python data structures:

```python
# Python view
def products_page(request):
    products = [
        {"name": "Widget", "price": 19.99, "in_stock": True},
        {"name": "Gadget", "price": 29.99, "in_stock": False},
    ]
    return render_template("products.html.j2", products=products)
```

```html
<!-- Template -->
<c-table :items="products" :columns="['name', 'price', 'in_stock']" />
```

### Supported Data Types

| Type | Example |
|------|---------|
| Lists | `:items="[{'label': 'Home'}]"` |
| Dicts | `:config="{'theme': 'dark'}"` |
| Variables | `:items="menu_items"` |
| Expressions | `:disabled="not user.is_admin"` |

## Validation

### Attribute Validation

The extension validates attributes against component definitions:

```python
# This raises an error:
# <c-button unknownAttr="value">
# ValueError: Unknown attribute 'unknownAttr' for component 'button'
```

### Type Coercion

Attribute values are automatically coerced to the correct type:

```html
<!-- Boolean coercion -->
<c-button disabled="true">  <!-- String "true" → boolean True -->

<!-- Number coercion -->
<c-grid cols="3">           <!-- String "3" → number 3 -->
```

### Data Structure Validation

For `:items` and similar attributes, the extension validates structure:

```python
# Validates that items is a list of dicts with required keys
<c-select :items="options" item-label="name" item-value="id" />
```

## HTMX Integration

Enable HTMX support for interactive components:

```python
setup_components(env, htmx=True)
```

```html
<c-button
  hx-post="/api/submit"
  hx-target="#result"
  hx-swap="outerHTML">
  Submit
</c-button>
```

## Custom Templates

### Override Component Templates

```python
# Add your templates directory first
env = Environment(loader=FileSystemLoader([
    "my_templates",      # Your overrides first
    "templates",         # Then defaults
]))

setup_components(env)
```

Create `my_templates/components/button.html.j2` to override the button.

### Template Context

Components receive context via `_component_context`:

```jinja2
{# components/button.html.j2 #}
{% set variant = _component_context.variant | default('primary') %}
{% set size = _component_context.size | default('md') %}
{% set content = _component_context.content | default('') %}

<button class="btn btn-{{ variant }} btn-{{ size }}">
  {{ content | safe }}
</button>
```

## Static Assets

### Asset Management

The `<c-page>` component automatically includes required assets:

```html
<c-page title="My App">
  <!-- Content -->
</c-page>
```

Generates:
```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="/static/lotc/tokens.css">
  <!-- Other CSS -->
</head>
<body>
  <!-- Content -->
  <!-- Scripts -->
</body>
</html>
```

### Custom Assets

```python
setup_components(
    env,
    user_css_files=["/css/custom.css"],
    user_js_files=["/js/app.js"],
    static_url_prefix="/assets/",
)
```

## Error Handling

### Helpful Error Messages

```python
# Unknown component
<c-unknown-component>
# → "Unknown component 'unknown-component'. Available: button, grid, layout, ..."

# Invalid attribute
<c-button badAttr="value">
# → "Unknown attribute 'badAttr' for component 'button'. Available: variant, size, ..."

# Missing required attribute
<c-page>
# → "Required attribute 'title' missing for component 'page'"
```

### Debug Mode

Enable verbose logging:

```python
import logging
logging.getLogger("lord_of_the_components").setLevel(logging.DEBUG)
```

## Best Practices

### 1. Use Semantic Attributes

```html
<!-- Good: semantic sizing -->
<c-button size="lg">Large Button</c-button>

<!-- Avoid: hardcoded CSS -->
<c-button style="font-size: 18px;">Large Button</c-button>
```

### 2. Leverage Data Binding

```html
<!-- Good: dynamic binding -->
<c-select :items="categories" :value="selected" />

<!-- Avoid: inline data -->
<c-select items='[{"label":"A"},{"label":"B"}]' />
```

### 3. Component Composition

```html
<!-- Good: compose components -->
<c-stack gap="md">
  <c-button variant="primary">Save</c-button>
  <c-button variant="secondary">Cancel</c-button>
</c-stack>
```

## Configuration

### Full Configuration Options

```python
setup_components(
    jinja_env,

    # Theme configuration
    theme="default",              # Theme name

    # HTMX integration
    htmx=True,                    # Include HTMX

    # Custom assets
    user_css_files=["/custom.css"],
    user_js_files=["/custom.js"],

    # Asset URL prefix
    static_url_prefix="/static/lotc/",
)
```

## Flask Integration

```python
from flask import Flask, render_template
from lord_of_the_components import setup_components

app = Flask(__name__)

with app.app_context():
    setup_components(app.jinja_env, htmx=True)

@app.route("/")
def index():
    return render_template("index.html.j2")
```

## Django Integration

```python
# settings.py
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.jinja2.Jinja2',
        'DIRS': [BASE_DIR / 'templates'],
        'OPTIONS': {
            'environment': 'myapp.jinja2.environment',
        },
    },
]

# myapp/jinja2.py
from jinja2 import Environment
from lord_of_the_components import setup_components

def environment(**options):
    env = Environment(**options)
    setup_components(env, htmx=True)
    return env
```
