# IDE Autocomplete Support

> **Status**: Phase 5 Implementation

## Overview

Lord of the Components generates autocomplete data for popular IDEs, providing:
- Component tag autocomplete (`<c-button`)
- Attribute suggestions with types
- Slot documentation
- Inline documentation on hover

## Supported IDEs

| IDE | Format | File |
|-----|--------|------|
| VS Code | Custom Data | `lotc.html-data.json` |
| WebStorm/IntelliJ | Web Types | `web-types.json` |

## Generating IDE Files

### Command Line

```bash
# Generate all IDE autocomplete files
lotc ide

# Generate specific format
lotc ide --format vscode
lotc ide --format webstorm

# Custom output directory
lotc ide --output ./editor-support

# Include documentation URLs
lotc ide --doc-base-url https://my-docs.example.com
```

### Programmatic API

```typescript
import { generateWebTypes, generateVSCodeCustomData } from '@lotc/core';
import { ComponentLoader } from '@lotc/core';

const loader = new ComponentLoader('/path/to/project');
const components = await loader.loadAll();

// Generate VS Code custom data
await generateVSCodeCustomData(components, {
  outputPath: './dist/ide/lotc.html-data.json',
  docBaseUrl: 'https://docs.example.com',
});

// Generate WebStorm web-types
await generateWebTypes(components, {
  outputPath: './dist/ide/web-types.json',
  docBaseUrl: 'https://docs.example.com',
});
```

## VS Code Setup

### 1. Generate Custom Data

```bash
lotc ide --format vscode --output ./vscode
```

### 2. Configure VS Code

Add to `.vscode/settings.json`:

```json
{
  "html.customData": [
    "./vscode/lotc.html-data.json"
  ]
}
```

Or for workspace-level:

```json
{
  "html.customData": [
    "${workspaceFolder}/dist/ide/lotc.html-data.json"
  ]
}
```

### 3. Reload Window

Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac), type "Reload Window".

### Features

- Component tag completion: `<c-` → shows all components
- Attribute completion: `<c-button ` → shows variant, size, etc.
- Value completion: `variant="` → shows "primary", "secondary", etc.
- Hover documentation: shows description, props, slots

## WebStorm / IntelliJ Setup

### 1. Generate Web Types

```bash
lotc ide --format webstorm
```

### 2. Add to package.json

```json
{
  "name": "my-project",
  "web-types": "./dist/ide/web-types.json"
}
```

### 3. Restart IDE

Restart WebStorm/IntelliJ to pick up the new web-types.

### Features

- Component completion with documentation
- Attribute suggestions with types
- Quick documentation (Ctrl+Q / Cmd+J)
- Go to definition (Ctrl+Click)

## Generated Data Structure

### VS Code Custom Data

```json
{
  "version": 1.1,
  "tags": [
    {
      "name": "c-button",
      "description": {
        "kind": "markdown",
        "value": "Interactive button...\n\n**Category:** actions"
      },
      "attributes": [
        {
          "name": "variant",
          "description": {
            "kind": "markdown",
            "value": "Visual style\n\n**Type:** `generic-color`"
          },
          "values": [
            { "name": "primary", "description": "Primary brand color" },
            { "name": "secondary", "description": "Secondary color" }
          ]
        }
      ]
    }
  ]
}
```

### Web Types

```json
{
  "$schema": "...",
  "framework": "html",
  "name": "lord-of-the-components",
  "version": "0.1.0",
  "contributions": {
    "html": {
      "elements": [
        {
          "name": "c-button",
          "description": "Interactive button...",
          "doc-url": "https://docs.example.com/components/button.html",
          "attributes": [
            {
              "name": "variant",
              "value": {
                "type": "\"primary\" | \"secondary\" | ..."
              }
            }
          ],
          "slots": [
            {
              "name": "default",
              "description": "Button content"
            }
          ]
        }
      ]
    }
  }
}
```

## Automatic Updates

### Build Integration

Add to your build script:

```json
{
  "scripts": {
    "build": "lotc build && lotc ide",
    "watch": "lotc build --watch"
  }
}
```

### Pre-commit Hook

```bash
#!/bin/sh
# .husky/pre-commit
lotc ide --output ./dist/ide
git add ./dist/ide
```

## Type Mappings

| Component Type | VS Code/WebStorm Type |
|---------------|----------------------|
| `string` | `string` |
| `boolean` | `boolean` |
| `number` | `number` |
| `enum` | Union of values |
| `generic-size` | `"xs" \| "sm" \| "md" \| "lg" \| "xl"` |
| `generic-color` | `"primary" \| "secondary" \| ...` |
| `array` | `array` |
| `object` | `object` |

## Troubleshooting

### VS Code Not Showing Completions

1. Check settings.json path is correct
2. Ensure JSON file exists and is valid
3. Reload window after changes
4. Check Output panel for HTML language server errors

### WebStorm Not Picking Up Changes

1. Invalidate caches: File → Invalidate Caches
2. Restart IDE
3. Check package.json web-types path
4. Ensure web-types.json is valid

### Missing Attributes

Ensure component props are defined in KDL:

```kdl
component "my-component" {
    props {
        myProp type="string" description="This will show in IDE"
    }
}
```

### Slow Completions

If completions are slow:
1. Reduce number of components in registry
2. Use simpler descriptions
3. Report issue if persistent

## Extending

### Custom IDE Format

```typescript
import type { ComponentDefinition } from '@lotc/core';

function generateMyIdeFormat(components: ComponentDefinition[]): string {
  // Transform components to your IDE's format
  return JSON.stringify({
    components: components.map(c => ({
      tag: `c-${c.name}`,
      attrs: c.props.map(p => p.name),
    })),
  });
}
```
