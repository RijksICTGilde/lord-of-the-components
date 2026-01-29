# Documentation System

> **Status**: Phase 3 Implementation

## Overview

The Documentation System automatically generates a complete documentation website from component definitions. It requires **no build system to view** - just a simple HTTP server.

Key features:
- Auto-generated from KDL component definitions
- Live, interactive component previews using Web Components
- Props and slots tables generated from definitions
- All examples from component `examples {}` blocks
- Works as static files (no server-side rendering needed)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    COMPONENT DEFINITIONS                     │
│   components/button/button.kdl (props, slots, examples)     │
└─────────────────────────────────┬───────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    DOCUMENTATION GENERATOR                   │
│   lotc docs → parses KDL, generates HTML/CSS/JS             │
└─────────────────────────────────┬───────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│                      STATIC OUTPUT                           │
│   dist/docs/                                                 │
│   ├── index.html          (component index)                 │
│   ├── components/                                            │
│   │   ├── button.html     (component docs)                  │
│   │   └── layout.html                                        │
│   ├── docs.css            (documentation styles)            │
│   └── lotc-docs.js        (Web Components for previews)     │
└─────────────────────────────────────────────────────────────┘
```

## Web Components

### `<lotc-preview>`

Live preview container for component examples:

```html
<lotc-preview component="button">
  <c-button variant="primary">Click me</c-button>
</lotc-preview>
```

Features:
- Renders the component in an isolated container
- Can show/hide code view
- Responsive preview (desktop/tablet/mobile)
- Theme switching

### `<lotc-props>`

Auto-generated props table:

```html
<lotc-props component="button"></lotc-props>
```

Renders:
| Name | Type | Default | Description |
|------|------|---------|-------------|
| variant | generic-color | primary | Visual style |
| size | generic-size | md | Size of button |
| disabled | boolean | false | Disabled state |

### `<lotc-slots>`

Auto-generated slots table:

```html
<lotc-slots component="button"></lotc-slots>
```

### `<lotc-examples>`

All examples from component definition:

```html
<lotc-examples component="button"></lotc-examples>
```

Renders each example with:
- Title and description
- Live preview
- Code snippet (collapsible)

## Generated HTML Structure

### Index Page (`index.html`)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <title>Lord of the Components - Documentation</title>
  <link rel="stylesheet" href="docs.css">
</head>
<body>
  <header>
    <h1>Lord of the Components</h1>
    <p>Implementation-agnostic component system</p>
  </header>

  <main>
    <section class="category">
      <h2>Layout</h2>
      <div class="component-grid">
        <a href="components/page.html" class="component-link">
          <span class="component-name">c-page</span>
          <span class="status status-stable">stable</span>
        </a>
        <a href="components/layout.html" class="component-link">
          <span class="component-name">c-layout</span>
          <span class="status status-stable">stable</span>
        </a>
      </div>
    </section>

    <section class="category">
      <h2>Actions</h2>
      <div class="component-grid">
        <a href="components/button.html" class="component-link">
          <span class="component-name">c-button</span>
          <span class="status status-stable">stable</span>
        </a>
      </div>
    </section>
  </main>

  <script src="lotc-docs.js"></script>
</body>
</html>
```

### Component Page (`components/button.html`)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <title>c-button - Lord of the Components</title>
  <link rel="stylesheet" href="../docs.css">
  <link rel="stylesheet" href="../tokens.css">
</head>
<body>
  <header>
    <a href="../index.html">← Back</a>
    <h1>c-button</h1>
    <p class="description">Interactive button for user actions</p>
    <div class="meta">
      <span class="status status-stable">stable</span>
      <span class="category">actions</span>
    </div>
  </header>

  <main>
    <section class="props">
      <h2>Props</h2>
      <lotc-props component="button"></lotc-props>
    </section>

    <section class="slots">
      <h2>Slots</h2>
      <lotc-slots component="button"></lotc-slots>
    </section>

    <section class="examples">
      <h2>Examples</h2>
      <lotc-examples component="button"></lotc-examples>
    </section>
  </main>

  <script src="../lotc-docs.js"></script>
</body>
</html>
```

## CLI Commands

```bash
# Generate documentation
lotc docs

# Generate with custom output directory
lotc docs --output ./my-docs

# Generate and serve locally
lotc docs --serve

# Watch mode (regenerate on changes)
lotc docs --watch
```

## Configuration

In `lotc.config.kdl`:

```kdl
generators {
    generator "docs" {
        output "dist/docs"
        include-examples true
        theme "default"

        // Optional: custom branding
        title "My Component Library"
        logo "/images/logo.svg"

        // Optional: extra head content
        head ```
            <link rel="icon" href="/favicon.ico">
            <meta property="og:title" content="My Components">
        ```
    }
}
```

## Theming Documentation

The documentation site uses CSS custom properties for theming:

```css
:root {
  /* Documentation colors */
  --docs-bg: #ffffff;
  --docs-text: #1f2937;
  --docs-link: #3b82f6;
  --docs-border: #e5e7eb;

  /* Code blocks */
  --docs-code-bg: #1e293b;
  --docs-code-text: #e2e8f0;

  /* Status badges */
  --docs-status-stable: #22c55e;
  --docs-status-beta: #f59e0b;
  --docs-status-experimental: #ef4444;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  :root {
    --docs-bg: #111827;
    --docs-text: #f9fafb;
    --docs-border: #374151;
  }
}
```

## Interactive Playground

The `<lotc-playground>` component provides an interactive code editor:

```html
<lotc-playground component="button">
  <!-- User can edit this code and see live preview -->
  <c-button variant="primary" size="lg">
    Click me
  </c-button>
</lotc-playground>
```

Features:
- Live code editing
- Instant preview updates
- Prop controls (dropdown for enums, toggle for booleans)
- Copy code button
- Reset to example code

## Search

Built-in fuzzy search across:
- Component names
- Prop names
- Descriptions

```html
<lotc-search></lotc-search>
```

## Best Practices

### 1. Write Good Examples

```kdl
examples {
    // Show each feature separately
    example "basic" {
        title "Basic Usage"
        description "Simple button with default settings"
        code ```
            <c-button>Click me</c-button>
        ```
    }

    // Show variations together
    example "variants" {
        title "All Variants"
        description "Visual styles available"
        code ```
            <c-button variant="primary">Primary</c-button>
            <c-button variant="secondary">Secondary</c-button>
        ```
    }
}
```

### 2. Include Real-World Examples

```kdl
example "form-submit" {
    title "Form Submit Button"
    description "Common pattern for form submission"
    code ```
        <form>
            <c-stack gap="md">
                <c-input label="Email" type="email" />
                <c-button type="submit" variant="primary">
                    Sign Up
                </c-button>
            </c-stack>
        </form>
    ```
}
```

### 3. Document Edge Cases

```kdl
example "disabled-with-tooltip" {
    title "Disabled with Explanation"
    description "Show why button is disabled using tooltip"
    code ```
        <c-tooltip content="Complete the form first">
            <c-button disabled>Submit</c-button>
        </c-tooltip>
    ```
}
```
