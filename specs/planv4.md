# Plan v4: Lord of the Components -- Jinja2 Pipeline

## Context

The lord-of-the-components project has solid TypeScript definitions (props, values, events, component definitions for button/card/header/menu) but the RigScript DSL proved over-engineered. Meanwhile, jinja-roos-components is a working, production-quality Jinja2 component library with 70+ templates and a battle-tested parser.

**Goal:** Replace RigScript with a simpler TypeScript implementation layer that generates `.html.j2` templates, fork the proven jinja-roos parser, and get Jinja2 rendering working end-to-end. Start with button, verify visually, then scale.

**Pipeline:**
```
definitions/*.def.ts → implementations/*.impl.ts → Jinja2 Generator → .html.j2 templates
                                                                            ↓
                                                         Forked Parser (from jinja-roos)
                                                                            ↓
                                                                      Final HTML
```

**Key decisions:**
- Prop naming: kebab-case from lord-of-the-components definitions (e.g., `type`, `show-icon`, `full-width`)
- Templates: generated from TypeScript implementation layer (not hand-written)
- Parser: forked from jinja-roos-components into this project

---

## Phase 1: Button End-to-End (Foundation)

### 1.1 Implementation Framework

Create `implementations/implementation.ts` with `defineImplementation()` helper:

```typescript
interface ComponentImplementation {
  component: ComponentDefinition;
  element: string | { prop: string; default: string };  // dynamic tag support
  classes: ClassRule[];          // base classes + conditional class rules
  attributes?: AttributeMapping[];  // prop → HTML attribute
  content?: string | ContentBlock[];  // inner HTML with conditions
  mixins?: { utilityClasses?: boolean; genericAttributes?: boolean };
}

// ClassRule types:
// - string: always applied ("utrecht-button")
// - ConditionalClass: { prop, eq?, class } -- add class when prop matches value
// - PatternClass: { prop, pattern, when? } -- e.g. "utrecht-button--rvo-{value}"
```

**Files:**
- `implementations/implementation.ts` -- types + `defineImplementation()` helper
- `implementations/components/button.impl.ts` -- button implementation mapping all props to RVO CSS classes
- `implementations/components/index.ts` -- exports
- `implementations/index.ts` -- re-exports

**Verify:** `tsc` compiles without errors. CSS class mappings match the jinja-roos button template.

### 1.2 Jinja2 Template Generator

Create `core/src/generators/jinja2/index.ts` with `Jinja2Generator` class that:
1. Emits `{% import %}` for shared mixins
2. Emits `{% set prop = _component_context.get('prop', default) %}` for each prop
3. Builds CSS class list with conditional additions
4. Emits utility class + custom class integration
5. Emits HTML element with classes, attributes, content blocks

Create `core/src/generators/jinja2/generate-all.ts` -- CLI script to generate all templates + `registry.json`.

**Generated output target pattern** (button example):
```jinja2
{% import 'components/_generic_attributes.j2' as attrs %}
{% import 'components/_attribute_mixin.j2' as attributes %}
{% set type = _component_context.get('type', 'primary') %}
{% set size = _component_context.get('size', 'md') %}
{% set name = _component_context.get('name', 'Button') %}
{% set disabled = _component_context.get('disabled', false) %}
{% set children = _component_context.get('content', '') %}
{% set css_classes = ['utrecht-button'] %}
{% if type == 'primary' %}{% set css_classes = css_classes + ['utrecht-button--primary-action'] %}{% endif %}
...
{% set utility_classes = attributes.render_utility_classes(_component_context) %}
{% if utility_classes %}{% set css_classes = css_classes + utility_classes.split() %}{% endif %}
{% if _component_context.get('class') %}{% set css_classes = css_classes + _component_context['class'].split() %}{% endif %}
<button class="{{ css_classes | join(' ') }}" data-lotc-component="button"
        {% if disabled %}disabled{% endif %}
        type="{{ html_type }}"
        {{ attrs.render_extra_attributes(_component_context) }}>
    {{ children if children else name | safe }}
</button>
```

**Verify:** Generated `button.html.j2` structurally matches the jinja-roos button template.

### 1.3 Shared Mixins

Copy from jinja-roos-components (no changes needed -- already kebab-case):
- `_attribute_mixin.j2` → `python/src/lord_of_the_components/templates/components/`
- `_generic_attributes.j2` → same directory

### 1.4 Fork Parser

Fork jinja-roos parser into `python/src/lord_of_the_components/`:

| File | Source | Changes |
|------|--------|---------|
| `html_parser.py` | Fork from jinja-roos | Remove `_fix_attribute_casing()` (not needed with kebab-case) |
| `extension.py` | Fork from jinja-roos | Load registry from generated JSON, remove alias system initially |
| `registry.py` | Rewrite | Load from TypeScript-generated `registry.json` |

Also create `core/src/generators/jinja2/generate-registry.ts` to export definitions → JSON format:
```json
{
  "components": [
    {
      "name": "button",
      "description": "Interactive button for user actions",
      "attributes": [
        { "name": "type", "type": "enum", "default": "primary", "enum_values": ["primary", "secondary", ...] },
        { "name": "disabled", "type": "boolean", "default": false }
      ]
    }
  ]
}
```

**Verify:** `<c-button type="primary" name="Click"/>` preprocesses to valid Jinja2 include.

### 1.5 End-to-End Test

Create `python/tests/test_button_e2e.py`:
- All type variants (primary, secondary, tertiary, quaternary, subtle, warning, warning-subtle)
- Size variants (xs, sm, md)
- Boolean props (disabled, full-width, active)
- Icon positions (show-icon="before", show-icon="after")
- Content between tags overrides `name` prop
- Events (@click → onclick attribute)
- Utility classes (text-style, margin, padding)

**Verify:** `<c-button type="primary" name="Submit"/>` → `<button class="utrecht-button utrecht-button--primary-action utrecht-button--rvo-md" type="button">Submit</button>`

---

## Phase 2: Expand to 5 Core Components

### 2.1 Heading (dynamic HTML tag)
- `definitions/components/heading.def.ts`: type (h1-h6), name, class
- `implementations/components/heading.impl.ts`: dynamic element `{ prop: 'type', default: 'h1' }`
- Tests: renders `<h1>` through `<h6>` with `utrecht-heading-N` class

### 2.2 Icon (pattern-based classes)
- `definitions/components/icon.def.ts`: icon, size, color, aria-label, class
- `implementations/components/icon.impl.ts`: patterns `rvo-icon-{icon}`, `rvo-icon--{size}`, `rvo-icon--{color}`
- Tests: renders `<span>` with correct icon classes

### 2.3 Card (conditional sections)
- Update `definitions/components/card.def.ts` to align with RVO card props
- `implementations/components/card.impl.ts`: conditional image section, optional link-wrapped title, content slot
- Tests: card with/without image, row/column layout, with link

### 2.4 Layout-flow (container)
- `definitions/components/layout-flow.def.ts`: gap, direction, align, class
- `implementations/components/layout-flow.impl.ts`: pattern classes for gap/alignment, children pass-through
- Tests: renders wrapper div with correct layout classes

### 2.5 Integration Tests
- Generate all 5 templates + registry.json
- `python/tests/test_components_e2e.py`: each component + nesting
- **Key test:** `<c-layout-flow gap="lg"><c-card title="X"><c-button name="Y"/></c-card></c-layout-flow>`

---

## Phase 3: Visual Testing with Playwright

### 3.1 Test Server
- `tests/visual/serve.py`: Flask/http.server rendering test pages with LOTC extension + RVO CSS

### 3.2 Test Fixtures
- `tests/visual/fixtures/`: HTML templates per component variant
  - button: primary, secondary, tertiary, disabled, with-icon, full-width
  - card: basic, with-image, row-layout, with-link
  - heading: h1 through h6
  - icon: sizes and colors
  - layout-flow: gap variations

### 3.3 Playwright Screenshots
- Screenshot tests for all fixtures
- Establish baseline for regression testing
- Compare against jinja-roos-components output for visual parity

---

## Phase 4: Full Component Catalog

Scale to all jinja-roos components in priority order:

| Priority | Category | Components |
|----------|----------|------------|
| 1 | Layout | layout-column, layout-row, max-width-layout, grid, page |
| 2 | Typography | paragraph, label, strong, em, link |
| 3 | Actions | action-group |
| 4 | Data display | alert, hero, data-list, footer, header |
| 5 | Navigation | menubar, breadcrumbs, tabs, progress-tracker |
| 6 | Forms | text-input-field, textarea-field, select-field, checkbox-field, radio-button-field, fieldset |
| 7 | Feedback | tag, status-icon, feedback |
| 8 | Table | table, thead, tbody, tr, th, td |

Create CLI command: `lotc generate:jinja2 [--component name]`

---

## Critical Files

| File | Purpose |
|------|---------|
| `implementations/implementation.ts` | Core `defineImplementation()` API and all types |
| `implementations/components/button.impl.ts` | Reference implementation pattern |
| `core/src/generators/jinja2/index.ts` | Jinja2 template generator |
| `core/src/generators/jinja2/generate-registry.ts` | Definition → JSON exporter |
| `python/src/lord_of_the_components/extension.py` | Forked Jinja2 preprocessor |
| `python/src/lord_of_the_components/html_parser.py` | Forked HTML parser |
| `python/src/lord_of_the_components/registry.py` | Component definition registry |

## Reference Files (read from, not modified)

| File | Used for |
|------|----------|
| `jinja-roos-components/.../extension.py` | Parser fork source |
| `jinja-roos-components/.../html_parser.py` | HTML parser fork source |
| `jinja-roos-components/.../button.html.j2` | Template output reference |
| `jinja-roos-components/.../card.html.j2` | Template output reference |
| `jinja-roos-components/.../_attribute_mixin.j2` | Mixin to copy |
| `jinja-roos-components/.../_generic_attributes.j2` | Mixin to copy |
| `rvo/components/button/src/template.tsx` | CSS class reference |
| `rvo/components/card/src/template.tsx` | CSS class reference |

## Risks & Mitigations

1. **Complex components won't fit the implementation API** → Add `rawTemplate` escape hatch in ContentBlock for hand-written Jinja2 when the declarative format isn't expressive enough
2. **Parser fork divergence** → Keep fork minimal, only change registry loading logic
3. **kebab-case in Jinja2** → Works fine: `_component_context.get('show-icon', 'no')` is valid Python dict access
4. **Generated template quality** → Phase 1.5 tests verify output immediately; visual tests in Phase 3 catch rendering issues

---

## Retrospective: Hand-tuned templates

During implementation, many component templates were hand-written or heavily hand-tuned by Claude rather than being fully generated from the TypeScript implementation layer. This happened because it seemed easier at the time to directly write the Jinja2 template than to extend the declarative `defineImplementation()` API to handle each component's complexity (nested structures, conditional sections, special attribute handling, etc.).

Components with hand-tuned templates include: card, layout-flow, grid, link, label, alert, header, hero, footer, and page. After running `generate-all.ts`, these must be manually restored from git to avoid overwriting the hand-tuned versions.

This defeats the core purpose of the project: being able to generate components to various targets (not just Jinja2) from a single declarative definition. If templates are hand-written per target, the intermediate TypeScript implementation layer adds no value for those components.

**Action needed:** Review each hand-tuned template and determine what's missing from the `defineImplementation()` API that forced the hand-tuning. Extend the API (e.g., nested element support, conditional sections, attribute conditionality, static content blocks) so that these components can be fully generated, and remove the need for post-generation git restores.