# Accessibility Validation

> **Status**: Phase 5 Implementation

## Overview

Lord of the Components includes built-in accessibility validation that checks component definitions for common accessibility issues. This helps ensure your components are accessible by default.

## Usage

### Command Line

```bash
# Validate components include accessibility checking
lotc validate --verbose
```

### Programmatic API

```typescript
import { AccessibilityValidator, validateAccessibility } from '@lotc/core';
import { ComponentLoader } from '@lotc/core';

// Load components
const loader = new ComponentLoader('/path/to/project');
const components = await loader.loadAll();

// Validate single component
const result = validateAccessibility(components[0]);
console.log(result.valid);
console.log(result.issues);

// Validate all components
const validator = new AccessibilityValidator();
const results = validator.validateAll(components);

// Get summary
const summary = validator.getSummary(results);
console.log(`Errors: ${summary.errors}, Warnings: ${summary.warnings}`);
```

## Built-in Rules

### A11Y001: Interactive Elements Need Labels

Interactive components (actions, inputs, navigation) must have a way to provide accessible labels.

**Severity:** Error

**Example fix:**
```kdl
component "button" {
    props {
        // Add a label prop
        label type="string"
    }
    slots {
        // Or a default slot for content
        default required=true
    }
}
```

### A11Y002: Form Inputs Need Label Association

Input components should have either an `id` prop (for external `<label for="...">`) or a built-in `label` prop.

**Severity:** Warning

**Example fix:**
```kdl
component "input" {
    props {
        id type="string" description="ID for label association"
        label type="string" description="Built-in label text"
    }
}
```

### A11Y003: Buttons Should Have Type

Button components should specify the HTML button type to prevent unintended form submission.

**Severity:** Warning

**Example fix:**
```kdl
component "button" {
    props {
        type type="enum" default="button" {
            enum "button" "submit" "reset"
        }
    }
}
```

### A11Y004: Images Need Alt Text

Image components must have an `alt` prop for screen reader descriptions.

**Severity:** Error

**Example fix:**
```kdl
component "image" {
    props {
        alt type="string" required=true description="Alternative text for the image"
    }
}
```

### A11Y005: Links Need Href

Link components must have an `href` prop for navigation.

**Severity:** Error

**Example fix:**
```kdl
component "link" {
    props {
        href type="string" required=true description="Link destination"
    }
}
```

### A11Y006: Disabled State Communication

Components with `disabled` prop should consider using `aria-disabled` for screen reader support.

**Severity:** Info

### A11Y007: Loading State Announcement

Components with loading states should announce changes via `aria-busy` or `aria-live` regions.

**Severity:** Info

### A11Y008: Modal Focus Management

Overlay components (modal, dialog, drawer) require proper focus management.

**Severity:** Info

**Requirements:**
- Implement focus trap when open
- Return focus to trigger element on close
- Use appropriate ARIA roles (`role="dialog"`, `aria-modal="true"`)

### A11Y009: Tables Need Captions

Table components should have a caption or summary for screen readers.

**Severity:** Warning

**Example fix:**
```kdl
component "table" {
    props {
        caption type="string" description="Visible table caption"
    }
}
```

### A11Y010: Color Contrast

Components using color variants should meet WCAG 2.1 contrast requirements.

**Severity:** Info

**Requirements:**
- Text contrast: 4.5:1 (AA) or 7:1 (AAA)
- UI element contrast: 3:1

## Custom Rules

Add custom accessibility rules:

```typescript
import { AccessibilityValidator } from '@lotc/core';

const validator = new AccessibilityValidator();

// Add custom rule
validator.addRule({
  code: 'CUSTOM001',
  check: (component) => {
    if (component.name.includes('interactive') && !component.props.some(p => p.name === 'tabIndex')) {
      return {
        severity: 'warning',
        code: 'CUSTOM001',
        message: `Interactive component '${component.name}' should have tabIndex prop`,
        suggestion: 'Add tabIndex prop for keyboard navigation',
      };
    }
    return null;
  },
});
```

## Issue Severities

| Severity | Meaning | CI Behavior |
|----------|---------|-------------|
| `error` | Must fix, accessibility barrier | Build fails |
| `warning` | Should fix, potential issue | Build warns |
| `info` | Consider, best practice | Build passes |

## Integration with CI/CD

```yaml
# GitHub Actions example
- name: Validate Components
  run: lotc validate
  # Returns exit code 1 if errors found
```

## Best Practices

### 1. Design for Keyboard Navigation

Ensure all interactive components can be operated with keyboard:
- Tab to focus
- Enter/Space to activate
- Escape to close modals/popovers
- Arrow keys for navigation

### 2. Provide Visible Focus States

```kdl
component "button" {
    tokens {
        "focus-ring-width" "2px"
        "focus-ring-color" "{color.primary}"
        "focus-ring-offset" "2px"
    }
}
```

### 3. Use Semantic HTML

Define components that map to proper semantic elements:
- `<button>` for actions
- `<a>` for navigation
- `<nav>`, `<main>`, `<header>`, `<footer>` for landmarks

### 4. Test with Screen Readers

Validate your implementations with actual screen readers:
- VoiceOver (macOS)
- NVDA (Windows)
- JAWS (Windows)
- Orca (Linux)
