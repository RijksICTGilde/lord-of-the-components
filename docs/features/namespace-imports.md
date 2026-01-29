# Namespace Imports (Future Feature)

> **Status**: Planned for v2.0

## Overview

Namespace imports allow using components from multiple packages with explicit namespacing to avoid conflicts.

## Syntax

```html
<!-- Explicit namespace -->
<c-rvo:button variant="primary">RVO styled button</c-rvo:button>
<c-bootstrap:button variant="primary">Bootstrap styled button</c-bootstrap:button>

<!-- Default namespace (from config) -->
<c-button variant="primary">Uses default theme</c-button>
```

## Configuration

```kdl
// lotc.config.kdl
imports {
    // Import all components from a package
    * from "@lotc/layout"

    // Import with namespace prefix
    * from "@rvo/components" as "rvo"
    * from "@bootstrap/components" as "bootstrap"

    // Import specific components with aliases
    button from "@rvo/components" as "rvo-button"

    // Set default namespace for non-prefixed components
    default "@rvo/components"
}
```

## Use Cases

### 1. Multiple Design Systems

When an application needs components from multiple design systems:

```html
<!-- Use RVO for government sections -->
<c-rvo:card>
    <c-rvo:heading level="2">Government Notice</c-rvo:heading>
    <c-rvo:button>Submit Form</c-rvo:button>
</c-rvo:card>

<!-- Use Bootstrap for internal admin sections -->
<c-bootstrap:card>
    <c-bootstrap:heading level="2">Admin Panel</c-bootstrap:heading>
    <c-bootstrap:button>Save Changes</c-bootstrap:button>
</c-bootstrap:card>
```

### 2. Migration Between Systems

When migrating from one design system to another:

```kdl
imports {
    * from "@old-system/components" as "legacy"
    * from "@new-system/components" as "new"

    // New components use new system by default
    default "@new-system/components"
}
```

```html
<!-- Old pages still work -->
<c-legacy:button>Old Style</c-legacy:button>

<!-- New pages use new system -->
<c-button>New Style</c-button>
```

### 3. Component Name Conflicts

When two packages define the same component name:

```kdl
imports {
    * from "@lotc/layout"
    * from "@custom/widgets" {
        grid as "widget-grid"  // Rename to avoid conflict with layout grid
    }
}
```

```html
<c-grid>Layout grid from @lotc/layout</c-grid>
<c-widget-grid>Custom grid from @custom/widgets</c-widget-grid>
```

## Implementation Notes

- Namespace resolution happens at build time
- No runtime overhead for namespace lookups
- IDE autocomplete will show available namespaces
- Validation ensures all namespaced components exist

## Timeline

This feature is planned for v2.0 after the core component system is stable.
