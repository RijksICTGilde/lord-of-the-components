# Generic Value System

> **Status**: Phase 2 Implementation

## Overview

The Generic Value System provides a **semantic abstraction** for common design values like sizes and colors. Components use generic values (like `sm`, `md`, `lg` for sizes) which are then mapped to implementation-specific values by theme connectors.

This allows the same component definition to work across different design systems (RVO, Bootstrap, Tailwind, custom) without modification.

## Generic Types

### Generic Size (`generic-size`)

Semantic size values that adapt to any design system:

| Value | Meaning |
|-------|---------|
| `xs` | Extra small |
| `sm` | Small |
| `md` | Medium (default) |
| `lg` | Large |
| `xl` | Extra large |
| `2xl` | 2x large |
| `3xl` | 3x large |

**Usage in component definition:**

```kdl
component "button" {
    props {
        size type="generic-size" default="md"
    }
}
```

**Usage in templates:**

```html
<c-button size="lg">Large Button</c-button>
```

### Generic Color (`generic-color`)

Semantic color values that map to design system colors:

| Value | Meaning |
|-------|---------|
| `primary` | Primary brand color |
| `secondary` | Secondary brand color |
| `success` | Positive/success state |
| `warning` | Warning/caution state |
| `error` | Error/danger state |
| `info` | Informational state |
| `neutral` | Neutral/gray |

**Usage in component definition:**

```kdl
component "alert" {
    props {
        color type="generic-color" default="info"
    }
}
```

**Usage in templates:**

```html
<c-alert color="success">Operation completed!</c-alert>
<c-alert color="error">Something went wrong.</c-alert>
```

## Theme Adapters

Connectors define **adapters** that map generic values to implementation-specific values:

### RVO Theme Example

```kdl
// themes/rvo/connectors/jinja2/connector.kdl
connector "jinja2" {
    adapters {
        generic-size {
            xs "rvo-size-xs"
            sm "rvo-size-sm"
            md "rvo-size-md"
            lg "rvo-size-lg"
            xl "rvo-size-xl"
        }
        generic-color {
            primary "hemelblauw"
            secondary "groen"
            success "donkergroen"
            warning "oranje"
            error "rood"
            info "lichtblauw"
            neutral "grijs"
        }
    }
}
```

### Bootstrap Theme Example

```kdl
// themes/bootstrap/connectors/jinja2/connector.kdl
connector "jinja2" {
    adapters {
        generic-size {
            xs "btn-xs"
            sm "btn-sm"
            md ""           // Default, no class needed
            lg "btn-lg"
            xl "btn-xl"
        }
        generic-color {
            primary "primary"
            secondary "secondary"
            success "success"
            warning "warning"
            error "danger"
            info "info"
            neutral "light"
        }
    }
}
```

### Tailwind Theme Example

```kdl
// themes/tailwind/connectors/jinja2/connector.kdl
connector "jinja2" {
    adapters {
        generic-size {
            xs "text-xs px-2 py-1"
            sm "text-sm px-3 py-1.5"
            md "text-base px-4 py-2"
            lg "text-lg px-5 py-2.5"
            xl "text-xl px-6 py-3"
        }
        generic-color {
            primary "bg-blue-500 text-white"
            secondary "bg-gray-500 text-white"
            success "bg-green-500 text-white"
            warning "bg-yellow-500 text-black"
            error "bg-red-500 text-white"
            info "bg-cyan-500 text-white"
            neutral "bg-gray-200 text-gray-800"
        }
    }
}
```

## How It Works

### 1. Component Definition

```kdl
component "button" {
    props {
        variant type="generic-color" default="primary"
        size type="generic-size" default="md"
    }
}
```

### 2. Component Usage

```html
<c-button variant="primary" size="lg">Click me</c-button>
```

### 3. Build Process

During build, the adapter transforms generic values:

```python
# Input props
variant = "primary"
size = "lg"

# After adapter transformation (RVO theme)
variant_class = "hemelblauw"
size_class = "rvo-size-lg"

# After adapter transformation (Bootstrap theme)
variant_class = "btn-primary"
size_class = "btn-lg"
```

### 4. Template Output

The Jinja2 template receives the adapted values:

```jinja2
{# RVO output #}
<button class="rvo-button rvo-button--hemelblauw rvo-size-lg">Click me</button>

{# Bootstrap output #}
<button class="btn btn-primary btn-lg">Click me</button>
```

## Adapter API

### TypeScript Interface

```typescript
interface GenericValueAdapter {
  type: 'generic-size' | 'generic-color';
  mappings: {
    [genericValue: string]: string;
  };
}

interface ConnectorDefinition {
  // ...
  adapters?: GenericValueAdapter[];
}
```

### Runtime Usage

```typescript
import { resolveGenericValue } from '@lotc/core';

// In template preprocessing
const resolvedSize = resolveGenericValue('generic-size', 'lg', adapter);
// Returns: "rvo-size-lg" (or whatever the adapter maps to)
```

## Validation

The build system validates:

1. **Type checking**: Props with `generic-size` only accept valid size values
2. **Adapter completeness**: All generic values have mappings in the theme
3. **Missing mappings**: Warnings for generic values without adapter entries

```bash
$ lotc validate

Validating components...
  ✓ button.kdl
  ✓ alert.kdl

Validating theme adapters...
  ⚠ Theme "custom" is missing mapping for generic-color.info
  ✓ Theme "default" has complete adapters
```

## Best Practices

### 1. Use Generic Values for Design Tokens

```kdl
// Good - semantic, adaptable
props {
    size type="generic-size"
    color type="generic-color"
}

// Avoid - implementation-specific
props {
    size type="enum" { enum "btn-sm" "btn-md" "btn-lg" }
    color type="string"  // "blue-500", "#3b82f6"
}
```

### 2. Provide Sensible Defaults

```kdl
props {
    size type="generic-size" default="md"  // Most common size
    color type="generic-color" default="primary"  // Most common intent
}
```

### 3. Document Adapter Mappings

Include comments in your connector explaining the mapping rationale:

```kdl
adapters {
    generic-color {
        // Maps to RVO official colors per style guide v3.2
        primary "hemelblauw"      // Main interactive color
        secondary "groen"         // Secondary actions
        error "rood"              // Error states, validation
    }
}
```

## Future Extensions

### Custom Generic Types

Future versions may support custom generic types:

```kdl
// Define custom generic type
generic-types {
    "spacing" {
        values "none" "tight" "normal" "loose" "wide"
    }
}

// Use in component
props {
    padding type="generic-spacing" default="normal"
}
```

### Responsive Adapters

Future versions may support responsive mappings:

```kdl
adapters {
    generic-size responsive=true {
        sm {
            mobile "text-xs"
            tablet "text-sm"
            desktop "text-sm"
        }
        md {
            mobile "text-sm"
            tablet "text-base"
            desktop "text-base"
        }
    }
}
```
