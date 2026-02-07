# Lord of the Components - Implementation Specification

## Overview

This specification defines a universal component system that generates templates for multiple platforms (Jinja2, React, WebComponents) from a single source of truth.

### Related Projects
- `lord-of-the-components` - Main project with definitions, RigScript DSL, and tooling
- `jinja-roos-components` - Jinja2 implementation (74 templates) - translated from RVO
- `rvo` - React design system (76 components with SCSS) - **original source / visual baseline**

### Target Priority Order
1. Jinja2
2. React
3. Web Components

---

## Core Architecture

### Layer 1: Core Dictionaries (TypeScript)

**PROPS** - Dictionary of allowed property NAMES
```typescript
// definitions/props.ts
export const PROPS = {
  // Identification
  NAME: "name",
  ID: "id",
Ok,.
  // Component type (primary, secondary, tertiary)
  TYPE: "type",

  // Visual
  VARIANT: "variant",
  SIZE: "size",
  COLOR: "color",

  // State (boolean props - no values needed)
  DISABLED: "disabled",
  REQUIRED: "required",
  LOADING: "loading",
  READONLY: "readonly",

  // Content
  HREF: "href",
  ICON: "icon",
  LABEL: "label",
} as const;

export type PropName = typeof PROPS[keyof typeof PROPS];
```

**VALUES** - Dictionary of allowed VALUES
```typescript
// definitions/values.ts
export const VALUES = {
  // Generic component types
  TYPES: ["primary", "secondary", "tertiary"] as const,

  // Semantic colors
  COLORS: ["primary", "secondary", "success", "warning", "error", "info", "neutral"] as const,

  // Size scale
  SIZES: ["xs", "sm", "md", "lg", "xl"] as const,

  // Direction
  DIRECTIONS: ["horizontal", "vertical"] as const,

  // HTML-specific
  BUTTON_HTML_TYPES: ["button", "submit", "reset"] as const,
  LINK_TARGETS: ["_self", "_blank", "_parent", "_top"] as const,
  INPUT_TYPES: ["text", "email", "password", "number", "tel", "url"] as const,
} as const;

export type ValueSet = typeof VALUES[keyof typeof VALUES];
```

### Layer 1b: Implementation Extensions (Theme/Project specific)

```typescript
// implementation/extensions.ts (provided by theme/project)
export const IMPLEMENTATION = {
  // Additional props (implementation-specific)
  PROPS: {
    BUTTON_STYLE: "button-style",      // custom prop for this theme
  },

  // Additional values (known at implementation time)
  VALUES: {
    THEME_COLORS: ["brand-blue", "corporate-red", "accent-gold"] as const,
    ICON_NAMES: ["home", "user", "settings", "arrow-right", "check"] as const,  // depends on icon set
  },
} as const;
```

### Layer 2: Component Definition (TypeScript)

Components specify which PROPS they use and which VALUES are allowed:
```typescript
// definitions/components/button.ts
import { PROPS } from '../props';
import { VALUES } from '../values';
import { IMPLEMENTATION } from '../../implementation/extensions';

export const button = {
  name: "button",
  description: "Interactive button for user actions",
  category: "actions",

  props: {
    // [PROP NAME]: ALLOWED VALUES

    // Core props with core values
    [PROPS.TYPE]: VALUES.TYPES,                    // type="primary|secondary|tertiary"
    [PROPS.SIZE]: VALUES.SIZES,                    // size="xs|sm|md|lg|xl"

    // Extensible: core + implementation values
    [PROPS.VARIANT]: [...VALUES.COLORS, ...IMPLEMENTATION.VALUES.THEME_COLORS],

    // Implementation-only values
    [PROPS.ICON]: IMPLEMENTATION.VALUES.ICON_NAMES,

    // Boolean props (no values, just presence)
    [PROPS.DISABLED]: null,
    [PROPS.LOADING]: null,

    // HTML-specific
    "html-type": VALUES.BUTTON_HTML_TYPES,         // HTML type attribute (button|submit|reset)
  },

  slots: {
    default: { required: true, description: "Button label" },
  },
};
```

**What this enforces:**
- ✅ "You may only use these prop NAMES" → from PROPS dictionary
- ✅ "These are the allowed VALUES" → from VALUES dictionary
- ✅ "Implementation can extend" → IMPLEMENTATION.PROPS, IMPLEMENTATION.VALUES
- ✅ IDE autocomplete and compile-time validation

**Output:** `<c-button type="primary" variant="brand-blue" size="md" disabled>`

### Layer 3: RigScript (Implementation Logic)

RigScript defines HOW the component renders - the if/then/else logic:
```rigscript
// packages/core/components/button/button.rig
component button

let classes = ["c-button"]

// Map variant to CSS class
if props.variant == "primary":
    classes += "c-button--primary"
elif props.variant == "secondary":
    classes += "c-button--secondary"
// ... etc

// Map size to CSS class
if props.size == "sm":
    classes += "c-button--sm"
elif props.size == "lg":
    classes += "c-button--lg"

// Boolean props
if props.disabled:
    classes += "c-button--disabled"
if props.loading:
    classes += "c-button--loading"
if props.required:
    classes += "c-button--required"

// Render the element
render.element("button", {
    class: join(classes, " "),
    type: props.type,
    disabled: props.disabled,
    "aria-busy": props.loading
}):
    render.slot("default")
```

### Layer 4: Transpilers

Convert RigScript to platform-specific implementations:

```
RigScript  →  Jinja2 Transpiler   →  button.html.j2
           →  React Transpiler    →  Button.tsx
           →  WebComponent Trans. →  c-button.js
```

**Jinja2 output:**
```jinja2
{%- set classes = ["c-button"] -%}
{% if ctx.variant == "primary" %}{% set classes = classes + ["c-button--primary"] %}{% endif %}
{% if ctx.variant == "secondary" %}{% set classes = classes + ["c-button--secondary"] %}{% endif %}
{# ... etc #}
<button class="{{ classes | join(' ') }}" type="{{ ctx.type }}" {{ "disabled" if ctx.disabled }} {{ 'aria-busy="true"' if ctx.loading }}>
    {{ content | safe }}
</button>
```

### Full Pipeline

```
┌─────────────────────────────────────────────────────────────────────────┐
│ LAYER 1: DICTIONARIES (KDL)                                             │
│ ┌─────────────────┐  ┌─────────────────┐                                │
│ │ props.kdl       │  │ values.kdl      │                                │
│ │ - name          │  │ - sizes         │                                │
│ │ - type          │  │ - colors        │                                │
│ │ - required      │  │ - button-types  │                                │
│ │ - disabled      │  │ - ...           │                                │
│ └────────┬────────┘  └────────┬────────┘                                │
│          │                    │                                         │
│          └──────────┬─────────┘                                         │
│                     ▼                                                   │
├─────────────────────────────────────────────────────────────────────────┤
│ LAYER 2: COMPONENT DEFINITION (KDL)                                     │
│ ┌─────────────────────────────────────┐                                 │
│ │ button.kdl                          │                                 │
│ │ component "button" {                │                                 │
│ │   props { name; type; variant; }    │  → <c-button name="" type="">   │
│ │   slots { default }                 │                                 │
│ │ }                                   │                                 │
│ └────────────────┬────────────────────┘                                 │
│                  ▼                                                      │
├─────────────────────────────────────────────────────────────────────────┤
│ LAYER 3: RIGSCRIPT (Implementation Logic)                               │
│ ┌─────────────────────────────────────┐                                 │
│ │ button.rig                          │                                 │
│ │ if props.variant == "primary":      │  Written manually using RVO    │
│ │   classes += "c-button--primary"    │  as visual reference           │
│ │ render.element("button", {...})     │                                 │
│ └────────────────┬────────────────────┘                                 │
│                  ▼                                                      │
├─────────────────────────────────────────────────────────────────────────┤
│ LAYER 4: TRANSPILERS                                                    │
│          ┌─────────────┬─────────────┬─────────────┐                    │
│          ▼             ▼             ▼             │                    │
│    ┌──────────┐  ┌──────────┐  ┌──────────────┐   │                    │
│    │ Jinja2   │  │ React    │  │ WebComponent │   │                    │
│    │ .html.j2 │  │ .tsx     │  │ .js          │   │                    │
│    └──────────┘  └──────────┘  └──────────────┘   │                    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 0: Migrate Definitions to TypeScript ⬅️ CURRENT PRIORITY

**Goal:** Replace KDL definitions with TypeScript for type safety, IDE support, and validation

### Current State
- KDL files in `definitions/` have no type checking
- References are just strings - no validation
- IDE can't help with autocomplete or error detection

### 0.1 Create TypeScript Definition Structure
- [ ] Create `definitions/values.ts` - All value enums
- [ ] Create `definitions/props.ts` - All prop definitions
- [ ] Create `definitions/types.ts` - Shared TypeScript types
- [ ] Create `definitions/index.ts` - Exports

**File structure:**
```
definitions/
├── values.ts          # All value enums (sizes, colors, etc.)
├── props.ts           # All prop definitions
├── types.ts           # TypeScript interfaces
├── index.ts           # Public exports
└── components/
    ├── button.ts      # Button component definition
    ├── card.ts        # Card component definition
    └── index.ts       # Component exports
```

### 0.2 Define PROPS Dictionary (definitions/props.ts)
- [ ] All prop NAMES as constants
- [ ] Naming: SCREAMING_CASE for constants
- [ ] Export PropName type

```typescript
export const PROPS = {
  TYPE: "type",           // component type (primary, secondary, tertiary)
  VARIANT: "variant",     // visual variant
  SIZE: "size",
  DISABLED: "disabled",   // boolean
  LOADING: "loading",     // boolean
  ICON: "icon",
  HREF: "href",
  // ...
} as const;
```

### 0.3 Define VALUES Dictionary (definitions/values.ts)
- [ ] Core value sets (universal)
- [ ] Naming: SCREAMING_CASE for constants
- [ ] Export type helpers

```typescript
export const VALUES = {
  TYPES: ["primary", "secondary", "tertiary"] as const,
  COLORS: ["primary", "secondary", "success", "warning", "error"] as const,
  SIZES: ["xs", "sm", "md", "lg", "xl"] as const,
  BUTTON_HTML_TYPES: ["button", "submit", "reset"] as const,
  // ...
} as const;
```

### 0.4 Define IMPLEMENTATION Extensions Structure
- [ ] Create `implementation/extensions.ts` template
- [ ] IMPLEMENTATION.PROPS for theme-specific props
- [ ] IMPLEMENTATION.VALUES for theme-specific values (colors, icons)

```typescript
export const IMPLEMENTATION = {
  PROPS: {
    // Theme can add custom props
  },
  VALUES: {
    THEME_COLORS: [] as const,     // to be filled by theme
    ICON_NAMES: [] as const,       // depends on icon set
  },
} as const;
```

### 0.5 Migrate Button Component Definition
- [ ] Create `definitions/components/button.ts`
- [ ] Use `[PROPS.X]: VALUES.Y` pattern
- [ ] Boolean props: `[PROPS.DISABLED]: null`
- [ ] Extensible props: `[PROPS.VARIANT]: [...VALUES.COLORS, ...IMPLEMENTATION.VALUES.THEME_COLORS]`

```typescript
export const button = {
  name: "button",
  props: {
    [PROPS.TYPE]: VALUES.TYPES,
    [PROPS.SIZE]: VALUES.SIZES,
    [PROPS.VARIANT]: VALUES.COLORS,
    [PROPS.DISABLED]: null,
    [PROPS.LOADING]: null,
  },
  slots: {
    default: { required: true },
  },
};
```

### 0.6 Remove KDL Definitions
- [ ] Delete `definitions/props.kdl`
- [ ] Delete `definitions/components/*.kdl`
- [ ] Update any tooling that reads KDL files
- [ ] Update imports in CLI/transpilers

---

## Appendix A: Complete Props & Values Inventory

**Source:** Analysis of jinja-roos-components (78 templates) and RVO (70 components)

### A.1 PROPS Dictionary (All Prop Names)

```typescript
export const PROPS = {
  // ═══════════════════════════════════════════════════════════════════
  // IDENTIFICATION
  // ═══════════════════════════════════════════════════════════════════
  ID: "id",
  NAME: "name",

  // ═══════════════════════════════════════════════════════════════════
  // VISUAL STYLING
  // ═══════════════════════════════════════════════════════════════════
  KIND: "kind",              // button kind: primary, secondary, tertiary...
  TYPE: "type",              // semantic type OR html type depending on context
  VARIANT: "variant",        // visual variant
  SIZE: "size",              // component size
  COLOR: "color",            // text/icon color
  BACKGROUND_COLOR: "backgroundColor",

  // ═══════════════════════════════════════════════════════════════════
  // STATE (Boolean - no values needed)
  // ═══════════════════════════════════════════════════════════════════
  DISABLED: "disabled",
  REQUIRED: "required",
  READONLY: "readOnly",
  INVALID: "invalid",
  LOADING: "loading",        // alias: busy
  BUSY: "busy",
  CHECKED: "checked",
  INDETERMINATE: "indeterminate",
  ACTIVE: "active",
  HOVER: "hover",
  FOCUS: "focus",
  FOCUS_VISIBLE: "focusVisible",
  OPEN: "open",
  CLOSABLE: "closable",

  // ═══════════════════════════════════════════════════════════════════
  // CONTENT
  // ═══════════════════════════════════════════════════════════════════
  LABEL: "label",
  TITLE: "title",
  SUBTITLE: "subtitle",
  CONTENT: "content",
  PLACEHOLDER: "placeholder",
  VALUE: "value",
  DEFAULT_VALUE: "defaultValue",
  HELPER_TEXT: "helperText",
  ERROR_TEXT: "errorText",
  WARNING_TEXT: "warningText",
  DESCRIPTION: "description",

  // ═══════════════════════════════════════════════════════════════════
  // LINKS & NAVIGATION
  // ═══════════════════════════════════════════════════════════════════
  HREF: "href",
  LINK: "link",
  TARGET: "target",
  URL: "url",

  // ═══════════════════════════════════════════════════════════════════
  // ICONS
  // ═══════════════════════════════════════════════════════════════════
  ICON: "icon",
  SHOW_ICON: "showIcon",
  ICON_PLACEMENT: "iconPlacement",
  ICON_SIZE: "iconSize",
  ICON_COLOR: "iconColor",
  ICON_ARIA_LABEL: "iconAriaLabel",

  // ═══════════════════════════════════════════════════════════════════
  // LAYOUT
  // ═══════════════════════════════════════════════════════════════════
  GAP: "gap",
  PADDING: "padding",
  COLUMNS: "columns",
  LAYOUT: "layout",
  DIRECTION: "direction",
  ALIGN: "align",
  JUSTIFY: "justify",
  FULL_WIDTH: "fullWidth",
  MAX_WIDTH: "maxWidth",
  WIDTH: "width",
  HEIGHT: "height",

  // ═══════════════════════════════════════════════════════════════════
  // IMAGES
  // ═══════════════════════════════════════════════════════════════════
  IMAGE: "image",
  IMAGE_ALT: "imageAlt",
  IMAGE_SIZE: "imageSize",
  IMAGE_WIDTH: "imageWidth",
  IMAGE_HEIGHT: "imageHeight",
  INLINE_IMAGE: "inlineImage",
  BACKGROUND_IMAGE: "backgroundImage",

  // ═══════════════════════════════════════════════════════════════════
  // FORM-SPECIFIC
  // ═══════════════════════════════════════════════════════════════════
  HTML_FOR: "htmlFor",
  FIELD_ID: "fieldId",
  LABEL_SIZE: "labelSize",
  LABEL_TYPE: "labelType",
  VALIDATION: "validation",
  PREFIX: "prefix",
  SUFFIX: "suffix",
  MAX_LENGTH: "maxLength",
  MIN: "min",
  MAX: "max",
  STEP: "step",
  PATTERN: "pattern",
  ACCEPT: "accept",
  MULTIPLE: "multiple",
  OPTIONS: "options",

  // ═══════════════════════════════════════════════════════════════════
  // COMPONENT-SPECIFIC (used by few components)
  // ═══════════════════════════════════════════════════════════════════
  OUTLINE: "outline",
  IS_PILL: "isPill",
  FULL_CARD_LINK: "fullCardLink",
  INVERTED_COLORS: "invertedColors",
  SHOW_LINK_INDICATOR: "showLinkIndicator",
  NO_UNDERLINE: "noUnderline",
  NO_MARGINS: "noMargins",
  NO_SPACING: "noSpacing",
  WEIGHT: "weight",
  IS_MODAL: "isModal",
  OVERLAY: "overlay",
  ANIMATION: "animation",
  DURATION: "duration",

  // ═══════════════════════════════════════════════════════════════════
  // DATA / COLLECTIONS
  // ═══════════════════════════════════════════════════════════════════
  ITEMS: "items",
  STEPS: "steps",
  TABS: "tabs",
  ROWS: "rows",

  // ═══════════════════════════════════════════════════════════════════
  // ACCESSIBILITY
  // ═══════════════════════════════════════════════════════════════════
  ARIA_LABEL: "ariaLabel",
  ARIA_DESCRIBEDBY: "ariaDescribedby",

  // ═══════════════════════════════════════════════════════════════════
  // STYLING OVERRIDE
  // ═══════════════════════════════════════════════════════════════════
  CLASS: "class",
  CLASS_NAME: "className",
} as const;
```

### A.2 VALUES Dictionary (All Value Sets)

```typescript
export const VALUES = {
  // ═══════════════════════════════════════════════════════════════════
  // BUTTON/ACTION KINDS
  // ═══════════════════════════════════════════════════════════════════
  BUTTON_KINDS: [
    "primary",
    "secondary",
    "tertiary",
    "quaternary",
    "subtle",
    "warning",
    "warning-subtle"
  ] as const,

  // ═══════════════════════════════════════════════════════════════════
  // SEMANTIC STATUS TYPES (for alerts, tags, feedback)
  // ═══════════════════════════════════════════════════════════════════
  STATUS_TYPES: [
    "info",
    "success",
    "warning",
    "error"
  ] as const,

  // ═══════════════════════════════════════════════════════════════════
  // SIZE SCALES
  // ═══════════════════════════════════════════════════════════════════
  SIZES_XS_XL: ["xs", "sm", "md", "lg", "xl"] as const,
  SIZES_SM_LG: ["sm", "md", "lg"] as const,
  SIZES_XS_MD: ["xs", "sm", "md"] as const,  // button sizes

  ICON_SIZES: [
    "xs", "sm", "md", "lg", "xl", "2xl", "3xl", "4xl"
  ] as const,

  GAP_SIZES: [
    "3xs", "2xs", "xs", "sm", "md", "lg", "xl", "2xl", "3xl", "4xl", "5xl"
  ] as const,

  PADDING_SIZES: [
    "none", "xs", "sm", "md", "lg", "xl", "2xl"
  ] as const,

  // ═══════════════════════════════════════════════════════════════════
  // HTML TYPES
  // ═══════════════════════════════════════════════════════════════════
  BUTTON_HTML_TYPES: ["button", "submit", "reset"] as const,

  INPUT_TYPES: [
    "text", "password", "email", "tel", "url", "search",
    "number", "date", "time", "datetime-local", "file"
  ] as const,

  HEADING_LEVELS: ["h1", "h2", "h3", "h4", "h5", "h6"] as const,

  LINK_TARGETS: ["_self", "_blank", "_parent", "_top"] as const,

  // ═══════════════════════════════════════════════════════════════════
  // ICON PLACEMENT
  // ═══════════════════════════════════════════════════════════════════
  ICON_POSITIONS: ["no", "before", "after"] as const,

  // ═══════════════════════════════════════════════════════════════════
  // LAYOUT
  // ═══════════════════════════════════════════════════════════════════
  DIRECTIONS: ["horizontal", "vertical"] as const,

  ALIGNMENTS: ["start", "center", "end", "stretch", "baseline"] as const,

  JUSTIFY: ["start", "center", "end", "space-between", "space-around"] as const,

  CARD_LAYOUTS: ["column", "row"] as const,

  GRID_COLUMNS: [
    "one", "two", "three", "four", "five", "six",
    "seven", "eight", "nine", "ten", "eleven", "twelve"
  ] as const,

  MAX_WIDTHS: ["sm", "md", "lg", "xl", "full"] as const,

  // ═══════════════════════════════════════════════════════════════════
  // FORM LABEL TYPES
  // ═══════════════════════════════════════════════════════════════════
  LABEL_TYPES: ["default", "optional", "required"] as const,

  VALIDATION_TYPES: ["none", "currency"] as const,

  // ═══════════════════════════════════════════════════════════════════
  // TEXT STYLING
  // ═══════════════════════════════════════════════════════════════════
  FONT_WEIGHTS: ["normal", "bold"] as const,

  // ═══════════════════════════════════════════════════════════════════
  // DIALOG/MODAL
  // ═══════════════════════════════════════════════════════════════════
  DIALOG_TYPES: [
    "centered-dialog", "inset-inline-start", "inset-inline-end"
  ] as const,

  DIALOG_SIZES: ["sm", "md", "lg", "xl"] as const,

  // ═══════════════════════════════════════════════════════════════════
  // ANIMATION
  // ═══════════════════════════════════════════════════════════════════
  ANIMATIONS: ["shimmer", "pulse"] as const,

  // ═══════════════════════════════════════════════════════════════════
  // IMAGE SIZES
  // ═══════════════════════════════════════════════════════════════════
  IMAGE_SIZES: ["sm", "md", "lg"] as const,

  // ═══════════════════════════════════════════════════════════════════
  // PROGRESS TRACKER STATES
  // ═══════════════════════════════════════════════════════════════════
  STEP_STATES: [
    "start", "incomplete", "doing", "completed", "disabled", "end"
  ] as const,

} as const;
```

### A.3 IMPLEMENTATION Values (Theme/Project Specific)

```typescript
// These are RVO-specific (Dutch government design system)
// Other implementations would have different values

export const IMPLEMENTATION = {
  VALUES: {
    // ═══════════════════════════════════════════════════════════════
    // RVO COLOR PALETTE (Dutch names)
    // ═══════════════════════════════════════════════════════════════
    COLORS: [
      "hemelblauw",      // sky blue (primary)
      "donkerblauw",     // dark blue
      "lintblauw",       // ribbon blue
      "lichtblauw-150",  // light blue
      "wit",             // white
      "zwart",           // black
      "grijs-100", "grijs-200", "grijs-300", "grijs-400",
      "grijs-500", "grijs-600", "grijs-700", "grijs-900",
    ] as const,

    // Status colors (Dutch)
    STATUS_COLORS: [
      "bevestiging",     // confirmation (success)
      "foutmelding",     // error message
      "waarschuwing",    // warning
    ] as const,

    // Status indicator colors
    INDICATOR_COLORS: [
      "groen", "groen-300",
      "oranje", "oranje-300",
      "rood", "rood-300",
      "hemelblauw", "hemelblauw-300",
    ] as const,

    // Background colors for cards
    CARD_BACKGROUNDS: [
      "none", "wit", "grijs-100", "hemelblauw", "lichtblauw-150"
    ] as const,

    // ═══════════════════════════════════════════════════════════════
    // ICON NAMES (from @nl-rvo/assets)
    // ═══════════════════════════════════════════════════════════════
    ICON_NAMES: [
      // This would be populated from the icon library
      // Examples from the codebase:
      "delta-omlaag",    // arrow down
      "delta-omhoog",    // arrow up
      "kruis",           // cross/close
      "vinkje",          // checkmark
      // ... many more
    ] as const,
  },
} as const;
```

### A.4 Component Inventory Summary

| Category | Components | Count |
|----------|------------|-------|
| **Layout** | grid, layout-flow, layout-row, layout-column, max-width-layout, page, header, footer, sidebar-layout | 9 |
| **Typography** | heading, paragraph, label, strong, em, small | 6 |
| **Buttons/Actions** | button, link, action-group, toggle | 4 |
| **Cards/Containers** | card, alert, hero, quote | 4 |
| **Form Inputs** | text-input, textarea, select, date-input, time-input, file-input, checkbox, radio-button | 8 |
| **Form Wrappers** | field, fieldset, label, feedback | 4 |
| **Form Composite** | text-input-field, textarea-field, select-field, checkbox-field, radio-button-field, date-input-field | 6 |
| **Navigation** | menubar, tabs, breadcrumbs, progress-tracker, pagination | 5 |
| **Data Display** | table, data-list, item-list | 3 |
| **Feedback** | tag, status-icon, loader, skeleton | 4 |
| **Interactive** | accordion, dialog, expandable-content | 3 |
| **Icons** | icon, status-icon | 2 |
| **Utility** | horizontal-rule, div, span | 3 |

**Total: ~61 unique components**

### A.5 Shared Props Analysis

**Universal (90%+ of components):**
- `className` / `class`
- `children` / `content`

**Very Common (50%+ of components):**
- `disabled`, `required`, `invalid` (form/interactive)
- `size` (most visual components)
- `onClick`, `onChange`, `onFocus`, `onBlur` (interactive)

**Common (20-50%):**
- `id`, `name` (form elements)
- `label`, `placeholder`, `value` (inputs)
- `icon`, `showIcon` (buttons, links, tags)
- `kind` / `type` / `variant` (styled components)
- `gap`, `padding` (layout)

**Component-Specific (<20%):**
- Button: `busy`, `alignToRightInGroup`
- Card: `fullCardLink`, `invertedColors`, `outline`
- Input: `prefix`, `suffix`, `validation`, `maxLength`
- Dialog: `isModal`, `centeredDialogSize`
- Table: `columns`, `rows`, `sortable`

---

## Phase 1: Foundation - RigScript Language Enhancement

**Goal:** RigScript can fully represent any component template logic

### 1.1 Lexer Enhancement: `or` Operator ✅ DONE
- **File:** `core/src/rigscript/lexer.ts`
- **Changes:**
  - Add `OR` to `TokenType` enum
  - Add keyword recognition in `scanToken()` method
- **Expected Input:** `props.variant or "primary"`
- **Expected Output:** Tokens: `[IDENTIFIER, OR, STRING]`

### 1.2 Parser Enhancement: `or` Expression ✅ DONE
- **File:** `core/src/rigscript/parser.ts`
- **Changes:**
  - Add `parseOr()` method
  - Integrate into expression parsing chain (precedence below `and`)
- **Expected Input:** `let x = a or b`
- **Expected AST:**
  ```
  VariableDeclaration {
    name: "x",
    init: OrExpression { left: Identifier("a"), right: Identifier("b") }
  }
  ```

### 1.3 AST Type Definition: OrExpression ✅ DONE
- **File:** `core/src/rigscript/types.ts`
- **Implementation:** Uses `BinaryExpression` with `operator: 'or'`

### 1.4 Transpiler: String Concatenation ✅ DONE
- **File:** `core/src/rigscript/transpiler-jinja2.ts`
- **Changes:** Handle `BinaryExpression` with `+` operator for strings
- **Mapping:** RigScript `+` → Jinja2 `~`
- **Example:**
  - Input: `"c-button--" + props.variant`
  - Output: `"c-button--" ~ props.variant`

### 1.5 Builtins Module: `join` Function ✅ DONE
- **File:** `core/src/rigscript/builtins.ts` (NEW)
- **Function:** `join(array, separator)`
- **Jinja2 Mapping:** `array | join(separator)`
- **Example:**
  - Input: `join(classes, " ")`
  - Output: `classes | join(" ")`

### 1.6 Builtins Module: `default` Function ✅ DONE
- **File:** `core/src/rigscript/builtins.ts`
- **Function:** `default(value, fallback)`
- **Jinja2 Mapping:** `value | default(fallback)`
- **Example:**
  - Input: `default(props.variant, "primary")`
  - Output: `props.variant | default("primary")`

### 1.7 Transpiler: Builtin Integration ✅ DONE
- **File:** `core/src/rigscript/transpiler-jinja2.ts`
- **Changes:**
  - Import builtins module
  - Handle `CallExpression` nodes for builtin functions
  - Map function calls to Jinja2 filter syntax

### 1.8 Transpiler: Array Concatenation ✅ DONE
- **File:** `core/src/rigscript/transpiler-jinja2.ts`
- **Changes:** Handle array concatenation with `+` operator
- **Example:**
  - Input: `classes + ["new-class"]`
  - Output: `classes + ["new-class"]`

### 1.9-1.13 Reference RigScript Implementations
| Component | File Path | Purpose |
|-----------|-----------|---------|
| button | `packages/core/components/button/button.rig` | Primary action component |
| card | `packages/core/components/card/card.rig` | Content container |
| stack | `packages/layout/components/stack/stack.rig` | Vertical/horizontal stacking |
| layout | `packages/layout/components/layout/layout.rig` | Page layout structure |
| page | `packages/core/components/page/page.rig` | Page wrapper |

### 1.14-1.15 Unit Tests
| Test File | Coverage | Status |
|-----------|----------|--------|
| `core/src/rigscript/or-operator.test.ts` | Lexer, parser, transpiler for `or` | ✅ DONE |
| `core/src/rigscript/builtins.test.ts` | `join()`, `default()` functions | ✅ DONE |

---

## Phase 2: Visual Testing with Playwright

**Goal:** Automated visual regression testing comparing to RVO baseline

### 2.1-2.2 Playwright Setup ✅ DONE
- **Dependency:** `@playwright/test` (devDependency)
- **Config File:** `tests/visual/playwright.config.ts`
- **Configuration:**
  - Browser: Headless Chromium
  - Snapshot directory: `tests/visual/snapshots/`
  - Diff threshold: Configurable pixel tolerance (maxDiffPixelRatio: 0.01)

### 2.3-2.5 Fixture Generation ✅ DONE
- **Generator:** `core/src/generators/fixtures/index.ts`
- **CLI Command:** `lotc test:fixtures --output <dir>`
- **Output:** `tests/visual/fixtures/` directory
- **Process:**
  1. Read KDL component definitions
  2. Extract example configurations
  3. Generate standalone HTML files

### 2.6 RVO Baseline ✅ DONE
- **Directory:** `tests/visual/rvo-baseline/`
- **Content:** HTML fixtures from RVO React components (29 fixtures for button, card, stack, layout, grid, page)
- **Purpose:** Visual comparison reference

### 2.7-2.12 Visual Test Infrastructure
| File | Purpose | Status |
|------|---------|--------|
| `tests/visual/specs/components.spec.ts` | Playwright test specifications | ✅ DONE |
| `tests/visual/snapshots/` | Baseline screenshots | ✅ DONE |
| `core/src/cli/commands/test-visual.ts` | CLI wrapper for Playwright | ✅ DONE |
| `.github/workflows/visual-tests.yml` | CI integration | ✅ DONE |

### 2.13 Documentation ✅ DONE
- **File:** `docs/features/visual-testing.md`
- **Content:**
  - Running visual tests
  - Updating baselines
  - Interpreting diff results
  - CI integration

---

## Phase 3: Python Preprocessor Refinement

**Goal:** Production-ready Jinja2 extension with excellent developer experience

### 3.1 Deterministic Placeholder System ✅ DONE
- **File:** `python/src/lord_of_the_components/extension.py`
- **Current:** ~~Random placeholders~~ Position-based hashes using SHA256
- **Implementation:** Counter-based hash combining template ID and position
- **Benefit:** Reproducible intermediate output

### 3.2-3.3 Source Location Tracking ✅ DONE
- **File:** `python/src/lord_of_the_components/extension.py`
- **Features:**
  - Track line/column for parsed component tags
  - Include location in error messages
  - "Did you mean?" suggestions using difflib
- **Error Format:** `Unknown attribute 'varient' at line 42, column 5. Did you mean 'variant'?`
- **Implementation:**
  - `SourceLocation` dataclass for line/column tracking
  - `ComponentError` exception with location and suggestion support
  - `_find_tag_location()` and `_find_attribute_location()` helpers

### 3.4 Named Slot Extraction ✅ DONE
- **Syntax:** `<template slot="name">content</template>`
- **Behavior:** Extract slot content, pass to component context
- **Access:** `slots.name` in component template
- **Implementation:**
  - `_extract_slots()` method separates named slots from default content
  - Named slots stored in `slots` dict in component context
  - Default content (non-slot children) captured as `content`
  - Supports multiple named slots, nested components, and Jinja expressions

### 3.5 Expression Validation ✅ DONE
- **File:** `python/src/lord_of_the_components/validation.py`
- **Validates:** `:attr="expression"` syntax
- **Timing:** Before template rendering (in `_parse_component_attributes`)
- **Errors:** Clear syntax error messages with location and suggestions
- **Implementation:**
  - `validate_expression()` function using Python AST parsing
  - Bracket balance checking with position reporting
  - Common mistake detection ({{ }}, {% %}, &&, ||)
  - Helpful suggestions for fixes (e.g., `&&` → `and`)
  - Integration with `ComponentError` for source location tracking

### 3.6 Topological Sort for Nesting ✅ DONE
- **Purpose:** Single-pass processing of nested components
- **Algorithm:** Kahn's algorithm for topological ordering
  1. Build dependency graph (parent→children relationships)
  2. Topologically sort components (leaves first)
  3. Process in sorted order (bottom-up)
- **Implementation:**
  - `_process_components_in_soup()` uses Kahn's algorithm
  - `_calculate_nesting_depth()` helper for depth checking
  - Cycle detection with clear error message

### 3.7 Nesting Depth Protection ✅ DONE
- **Constant:** `MAX_NESTING_DEPTH = 50`
- **Behavior:** Raise `ComponentError` if exceeded
- **Error:** Clear message with actual depth and maximum allowed

### 3.8-3.11 Python Unit Tests
| Test File | Coverage | Status |
|-----------|----------|--------|
| `python/tests/test_extension.py` | Placeholder system, source locations, error suggestions, expression validation | ✅ DONE |
| `python/tests/test_slots.py` | Named slot extraction | ✅ DONE |
| `python/tests/test_errors.py` | Error message quality | ✅ DONE |
| `python/tests/test_nesting.py` | Topological sort, depth limits | ✅ DONE |

### 3.12-3.14 Documentation and Validation
- **Documentation:** `docs/features/jinja-preprocessor.md`
- **Type Checking:** `mypy src/` (zero errors)
- **Test Suite:** `pytest tests/ -v` (all pass)

---

## Phase 4: End-to-End Validation ⬅️ CURRENT PRIORITY

**Goal:** Prove the full pipeline works before building more components

### The Pipeline
```
button.rig  →  Jinja2 Transpiler  →  button.html.j2  →  Python Preprocessor  →  Final HTML
                                                              ↓
                                                    <c-button variant="primary">
                                                              ↓
                                                    <button class="c-button c-button--primary">
```

### 4.1 Validate RigScript → Jinja2 Transpilation ✅ DONE
- [x] Pick ONE component as validation target (button)
- [x] Run transpilation via `compileToJinja2()` function
- [x] Verify generated `.html.j2` is syntactically valid Jinja2
- [x] Compare output to existing `button.html.j2` template
- [x] Document gaps and differences:
  - Fixed transpiler to handle computed attribute names (`attrs["data-variant"]`)
  - Fixed transpiler to handle conditional attributes (`if loading: attrs["aria-busy"] = "true"`)
  - Updated `button.rig` to explicitly build CSS classes
  - Generated template is functionally equivalent to manual template

### 4.2 Validate Generated Template Works with Python Preprocessor
- [ ] Use generated `button.html.j2` as the component template
- [ ] Create test page with `<c-button variant="primary">Click me</c-button>`
- [ ] Run through Python preprocessor
- [ ] Verify final HTML output is correct

### 4.3 Validate Visual Output
- [ ] Render the test page in browser
- [ ] Compare visually to RVO baseline
- [ ] Run Playwright visual test
- [ ] Document any visual differences

### 4.4 Fix Issues Found
- [ ] List all issues discovered during validation
- [ ] Fix transpiler bugs
- [ ] Fix RigScript language gaps
- [ ] Fix Python preprocessor issues
- [ ] Re-run validation until clean

### 4.5 Document the Working Pipeline
- [ ] Write step-by-step guide: "How to add a new component"
- [ ] Document the exact commands needed
- [ ] Document common pitfalls and solutions

### 4.6 Validate 5 Reference Components End-to-End
Once button works, validate these 4 additional components:
| Component | RigScript → Jinja2 | Preprocessor | Visual Test |
|-----------|-------------------|--------------|-------------|
| button    | ⏳                | ⏳           | ⏳          |
| card      | ⏳                | ⏳           | ⏳          |
| stack     | ⏳                | ⏳           | ⏳          |
| layout    | ⏳                | ⏳           | ⏳          |
| page      | ⏳                | ⏳           | ⏳          |

---

## Phase 5: Scale to All Components (PAUSED)

**Status:** ⏸️ PAUSED - Resume after Phase 4 validation complete

**Goal:** All ~95 components have RigScript implementations with visual tests

### 5.1 Scaffold CLI Command ✅ DONE
- **File:** `core/src/cli/commands/scaffold.ts`
- **Usage:** `lotc scaffold <component-name>`

### Components Created (for reference, not validated)

<details>
<summary>Click to expand component list (53 components created, not yet validated)</summary>

#### Layout (12)
page, layout, stack, grid, grid-item, container, section, spacer, divider, header, footer, hero

#### Action (4)
button, icon-button, link, action-group

#### Typography (3)
heading, text, prose

#### Data Display (13)
card, table, list, list-item, description-list, icon, avatar, avatar-group, image, figure, codeblock, code, time

#### Feedback (10)
badge, alert, notification, tag, skeleton, spinner, status-icon, empty, progress, progress-tracker

#### Navigation (11)
breadcrumb, breadcrumb-item, tabs, tab, tab-panel, menu, menu-item, menubar, menubar-item, pagination, skip-link

#### Overlay (2)
modal, drawer

</details>

### Remaining Components (after validation)
- Overlay: dialog, dropdown, tooltip, popover
- Input: All input components (~20)
- Utility: focus-trap, portal, visually-hidden

---

## Phase 6: React Transpiler Enhancement

**Goal:** React output matches RVO quality

### 6.1 Audit Gaps
- **File:** `core/src/rigscript/transpiler-react.ts`
- **Deliverable:** List of missing features vs RVO

### 6.2 className Building
- **Implementation:** Generate `clsx()` calls
- **Example:**
  ```typescript
  className={clsx('c-button', variant && `c-button--${variant}`)}
  ```

### 6.3 Props Destructuring
- **Output:** TypeScript interface + destructuring
- **Example:**
  ```typescript
  interface ButtonProps {
    variant?: 'primary' | 'secondary';
    children?: React.ReactNode;
  }

  export function Button({ variant = 'primary', children }: ButtonProps) {
  ```

### 6.4 Children/Slot Handling
- **Mapping:** `render.slot("default")` → `{children}`
- **Named Slots:** Props-based slot pattern

### 6.5-6.6 Generation and Testing
- **Command:** `lotc build --target react`
- **Validation:** TypeScript compilation
- **Visual Tests:** Compare to RVO baseline

---

## Phase 7: Web Components Target

**Goal:** Generate Web Components from RigScript

### 7.1 Architecture Design
- **Document:** `docs/design/webcomponents-transpiler.md`
- **Decisions:**
  - Custom Elements v1 API
  - Shadow DOM usage strategy
  - Slot mapping approach
  - Style encapsulation

### 7.2-7.4 Transpiler Implementation
- **File:** `core/src/rigscript/transpiler-webcomponents.ts` (NEW)
- **Features:**
  - Custom Element class generation
  - `attachShadow()` calls
  - `<slot>` element mapping
  - Attribute/property handling

### 7.5-7.7 Generation and Testing
- **Initial:** 5 reference components (button, card, stack, layout, page)
- **Full:** All 95 components
- **Validation:** Visual tests match Jinja2/React output

---

## Critical Files Reference

| File | Purpose | Phase |
|------|---------|-------|
| `definitions/values.ts` | Value enums (sizes, colors, etc.) | 0 |
| `definitions/props.ts` | Prop definitions | 0 |
| `definitions/types.ts` | TypeScript interfaces | 0 |
| `definitions/components/*.ts` | Component definitions | 0 |
| `core/src/rigscript/lexer.ts` | Token scanning | 1 |
| `core/src/rigscript/parser.ts` | AST generation | 1 |
| `core/src/rigscript/types.ts` | Type definitions | 1 |
| `core/src/rigscript/builtins.ts` | Built-in functions | 1 |
| `core/src/rigscript/transpiler-jinja2.ts` | Jinja2 output | 1, 4 |
| `core/src/rigscript/transpiler-react.ts` | React output | 6 |
| `core/src/rigscript/transpiler-webcomponents.ts` | Web Components output | 7 |
| `packages/*/components/*/*.rig` | RigScript implementations | 4, 5 |
| `core/src/generators/fixture-generator.ts` | Test fixtures | 2 |
| `python/src/lord_of_the_components/extension.py` | Jinja2 preprocessor | 3, 4 |
| `python/src/lord_of_the_components/validation.py` | Expression validation | 3 |
| `tests/visual/playwright.config.ts` | Visual test config | 2 |
| `tests/visual/specs/components.spec.ts` | Visual test specs | 2, 4 |

---

## CLI Commands Reference

### Build Commands
```bash
lotc build                          # Full build (all targets)
lotc build --target jinja2          # Jinja2 only
lotc build --target react           # React only
lotc build --target webcomponents   # Web Components only
lotc build --component button       # Single component
```

### Test Commands
```bash
npm test                            # Unit tests
npm test -- --grep "lexer"          # Specific test group
lotc test:fixtures                  # Generate visual fixtures
lotc test:visual                    # Run visual tests
npx playwright test --update-snapshots  # Update baselines
```

### Validation Commands
```bash
lotc validate                       # All components
lotc validate button                # Single component
```

### Scaffold Commands
```bash
lotc scaffold <component-name>      # Generate .rig skeleton
```

### Python Commands
```bash
cd python && pytest tests/ -v       # Python tests
cd python && mypy src/              # Type check
```

---

## Success Criteria

### Phase 0 Complete When: ⬅️ CURRENT PRIORITY
- [ ] `definitions/props.ts` - PROPS dictionary (prop NAMES)
- [ ] `definitions/values.ts` - VALUES dictionary (allowed values)
- [ ] `implementation/extensions.ts` - IMPLEMENTATION template for theme extensions
- [ ] `definitions/components/button.ts` - uses `[PROPS.X]: VALUES.Y` pattern
- [ ] IDE autocomplete works for PROPS and VALUES
- [ ] TypeScript compiles without errors
- [ ] KDL definition files removed

### Phase 1 Complete When:
- [x] `or` operator tokenizes, parses, and transpiles
- [x] `join()` and `default()` builtins work
- [x] String/array concatenation transpiles correctly
- [x] 5 reference .rig files transpile to valid Jinja2
- [x] All unit tests pass

### Phase 2 Complete When:
- [x] Playwright configured and running
- [x] RVO baseline screenshots captured
- [x] Visual comparison tests execute
- [x] CI workflow operational

### Phase 3 Complete When:
- [x] Deterministic placeholders implemented
- [x] Error messages include source locations
- [x] Named slots work correctly
- [x] Expression validation works
- [x] Nesting depth protected
- [x] All Python tests pass
- [x] mypy reports zero errors

### Phase 4 Complete When:
- [ ] Button component works end-to-end (RigScript → Jinja2 → Preprocessor → HTML)
- [ ] Generated Jinja2 template is syntactically valid
- [ ] Python preprocessor renders component correctly
- [ ] Visual output matches RVO baseline
- [ ] 5 reference components validated (button, card, stack, layout, page)
- [ ] Pipeline documentation written

### Phase 5 Complete When:
- [ ] 95 .rig files exist
- [ ] All transpile to valid Jinja2
- [ ] All visual tests pass

### Phase 6 Complete When:
- [ ] React transpiler feature-complete
- [ ] 95 React components generate
- [ ] Visual tests match RVO baseline

### Phase 7 Complete When:
- [ ] Web Components transpiler complete
- [ ] 95 Web Components generate
- [ ] Visual tests pass
