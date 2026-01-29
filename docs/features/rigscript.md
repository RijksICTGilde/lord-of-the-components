# RigScript - Component Logic Language

> **Status**: Phase 2 Implementation

## Overview

RigScript is a Python-like domain-specific language (DSL) for defining component rendering logic. It provides a **semantic abstraction** layer that describes WHAT a component renders, not HOW it's styled. The actual HTML output and CSS classes are determined by theme connectors.

## Purpose

RigScript solves the problem of defining component behavior once and rendering it to multiple targets:
- Jinja2 templates
- React components
- Vue components
- Raw HTML
- Web Components

## Syntax

### Basic Structure

RigScript uses Python-like indentation for blocks:

```python
# Comment
render.element("button"):
    attrs.type = "button"
    attrs.disabled = props.disabled
    render.slot("default")
```

### Keywords

| Keyword | Description |
|---------|-------------|
| `let` | Variable declaration |
| `if` / `elif` / `else` | Conditionals |
| `for ... in` | Iteration |
| `and` / `or` / `not` | Logical operators |
| `true` / `false` | Boolean literals |

### Render Methods

| Method | Description | Example |
|--------|-------------|---------|
| `render.element(tag)` | Render an HTML element | `render.element("div")` |
| `render.slot(name)` | Render a named slot | `render.slot("default")` |
| `render.text(value)` | Render text content | `render.text(props.label)` |
| `render.html(value)` | Render raw HTML | `render.html(props.content)` |
| `render.component(name)` | Render another component | `render.component("icon", name=props.icon)` |

### Props and Attrs

- `props.*` - Access component props defined in KDL
- `attrs.*` - Set attributes on the current element

```python
render.element("button"):
    # Set attributes from props
    attrs.variant = props.variant
    attrs.size = props.size

    # Conditional attributes
    if props.disabled:
        attrs.disabled = true
```

### Variables

```python
let classes = ["c-button"]

if props.variant == "primary":
    let classes = classes + ["c-button--primary"]
```

### Conditionals

```python
if props.icon and props.iconPosition == "before":
    render.component("icon", name=props.icon)

render.slot("default")

if props.icon and props.iconPosition == "after":
    render.component("icon", name=props.icon)
```

### Loops

```python
for item in props.items:
    render.element("li"):
        render.text(item.label)

# With index
for index, item in props.items:
    render.element("li"):
        attrs.data-index = index
        render.text(item.label)
```

### Expressions

```python
# Ternary
let buttonType = props.submit ? "submit" : "button"

# Member access
let label = item.label
let first = items[0]

# Function calls
let formatted = format(props.value, "currency")
```

## Example: Button Component

```python
# components/button/button.rig

render.element("button"):
    # Semantic attributes - connector maps these to actual classes
    attrs.variant = props.variant
    attrs.size = props.size
    attrs.type = props.type

    if props.disabled:
        attrs.disabled = true

    if props.icon and props.iconPosition == "before":
        render.component("icon", name=props.icon, size=props.size)

    render.slot("default")

    if props.icon and props.iconPosition == "after":
        render.component("icon", name=props.icon, size=props.size)
```

## Transpilation

RigScript is transpiled to target-specific code:

### To Jinja2

```jinja2
{% set ctx = _component_context %}
<button
    data-variant="{{ ctx.variant }}"
    data-size="{{ ctx.size }}"
    type="{{ ctx.type | default('button') }}"
    {% if ctx.disabled %}disabled{% endif %}
>
    {% if ctx.icon and ctx.iconPosition == 'before' %}
        {% include "components/icon.html.j2" with context %}
    {% endif %}
    {{ ctx.content | safe }}
    {% if ctx.icon and ctx.iconPosition == 'after' %}
        {% include "components/icon.html.j2" with context %}
    {% endif %}
</button>
```

### To React (Future)

```tsx
function Button({ variant, size, type, disabled, icon, iconPosition, children }) {
  return (
    <button
      data-variant={variant}
      data-size={size}
      type={type ?? 'button'}
      disabled={disabled}
    >
      {icon && iconPosition === 'before' && <Icon name={icon} size={size} />}
      {children}
      {icon && iconPosition === 'after' && <Icon name={icon} size={size} />}
    </button>
  );
}
```

## Theme Connector Integration

The semantic attributes (`data-variant`, `data-size`) are then styled by the theme's CSS or transformed by the connector:

```kdl
// themes/rvo/connectors/jinja2/connector.kdl
connector "jinja2" {
    adapters {
        generic-size {
            sm "rvo-sm"
            md "rvo-md"
            lg "rvo-lg"
        }
    }

    transforms {
        button {
            // Transform data-variant="primary" to class="rvo-button--hemelblauw"
            variant {
                primary "rvo-button--hemelblauw"
                secondary "rvo-button--groen"
            }
        }
    }
}
```

## File Extension

RigScript files use the `.rig` extension:
- `button.rig`
- `card.rig`
- `layout.rig`

## AST Structure

RigScript is parsed into an Abstract Syntax Tree with these node types:

### Statements
- `LetStatement` - Variable declaration
- `AssignmentStatement` - Variable/property assignment
- `IfStatement` - Conditional with elif/else
- `ForStatement` - Loop with optional index
- `RenderStatement` - Render method call
- `ExpressionStatement` - Expression as statement

### Expressions
- `Literal` - String, number, boolean
- `Identifier` - Variable reference
- `BinaryExpression` - Operators (+, -, ==, and, or, etc.)
- `UnaryExpression` - Negation (not, -)
- `TernaryExpression` - Conditional expression
- `CallExpression` - Function call
- `MemberExpression` - Property access (obj.prop, obj["key"])
- `ArrayExpression` - Array literal
- `ObjectExpression` - Object literal

## Tooling

### CLI Commands

```bash
# Transpile a single file
lotc transpile button.rig --target jinja2

# Transpile all components
lotc build --components

# Validate RigScript syntax
lotc validate --rigscript
```

### IDE Support (Future)

- Syntax highlighting for VS Code
- Autocomplete for render methods and props
- Error checking and diagnostics

## Design Decisions

1. **Python-like syntax**: Familiar to many developers, easy to read
2. **Indentation-based**: Clean, minimal syntax without braces
3. **Semantic attributes**: Components describe behavior, not styling
4. **No CSS classes**: Themes/connectors handle all styling
5. **Props validation**: Props are validated against KDL definitions
