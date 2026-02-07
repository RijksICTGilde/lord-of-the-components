# Lord of the Components -- v4 Todolist

Each task is designed to be self-contained and executable by an independent agent.
Dependencies are marked with `→ depends on: [task-id]`.

---

## Phase 1: Button End-to-End

### 1.1 Implementation Framework (TypeScript)

**T1: Create `defineImplementation()` types and helper** ✅
- File: `implementations/implementation.ts`
- Create all TypeScript interfaces: `ComponentImplementation`, `ClassRule` (union of `StaticClass | ConditionalClass | PatternClass`), `ConditionalClass`, `PatternClass`, `AttributeMapping`, `ContentBlock`
- Create `defineImplementation()` function that validates the definition and returns frozen object
- Export everything
- Reference: `definitions/component.ts` for the pattern to follow

**T2: Create button implementation** ✅
→ depends on: T1
- File: `implementations/components/button.impl.ts`
- Import button definition from `definitions/components/button.def.ts`
- Map every prop to RVO CSS classes using the API from T1
- Reference CSS class names from: `jinja-roos-components/.../button.html.j2` and `rvo/components/button/src/template.tsx`
- Key mappings:
  - `type` prop → `utrecht-button--primary-action`, `--secondary-action`, `--rvo-tertiary-action`, `--rvo-quaternary-action`, `--subtle`, `--warning`
  - `size` prop → `utrecht-button--rvo-{value}` for xs, sm, md
  - `active` → `utrecht-button--active`
  - `loading` → `utrecht-button--busy`
  - `disabled` → HTML attribute (not class)
  - `full-width` → `utrecht-button--rvo-full-width`
  - `show-icon` before/after → `utrecht-button--icon-before`, `--icon-after`
- Content: icon-before span + `{{ children if children else name | safe }}` + icon-after span

**T3: Create implementations index files** ✅
→ depends on: T2
- File: `implementations/components/index.ts` -- exports all implementations
- File: `implementations/index.ts` -- re-exports from components + helper

### 1.2 Jinja2 Template Generator

**T4: Create Jinja2 template generator** ✅
→ depends on: T1
- File: `core/src/generators/jinja2/index.ts`
- Class: `Jinja2Generator`
- Method: `generateTemplate(impl: ComponentImplementation): string`
- Must produce output matching this pattern:
  ```jinja2
  {% import 'components/_generic_attributes.j2' as attrs %}
  {% import 'components/_attribute_mixin.j2' as attributes %}
  {% set prop = _component_context.get('prop', default) %}
  ...
  {% set css_classes = ['base-class'] %}
  {% if prop == 'value' %}{% set css_classes = css_classes + ['conditional-class'] %}{% endif %}
  ...
  {% set utility_classes = attributes.render_utility_classes(_component_context) %}
  {% if utility_classes %}{% set css_classes = css_classes + utility_classes.split() %}{% endif %}
  {% if _component_context.get('class') %}{% set css_classes = css_classes + _component_context['class'].split() %}{% endif %}
  <element class="{{ css_classes | join(' ') }}" ...attributes {{ attrs.render_extra_attributes(_component_context) }}>
      ...content...
  </element>
  ```
- Handle all ClassRule types:
  - Static string → always in base list
  - ConditionalClass with `eq` (single value) → `{% if prop == 'value' %}`
  - ConditionalClass with `eq` (array) → `{% if prop == 'v1' or prop == 'v2' %}`
  - ConditionalClass without `eq` (boolean) → `{% if prop %}`
  - PatternClass → `{% if prop == 'val1' %}{% set css_classes = ... + ['pattern-val1'] %}{% endif %}` for each `when` value
- Handle AttributeMapping:
  - Boolean attrs → `{% if prop %}attrname{% endif %}`
  - Value attrs → `attrname="{{ prop_var }}"`
- Handle ContentBlock:
  - Unconditional → output template directly
  - With `when.eq` → wrap in `{% if prop == 'value' %}...{% endif %}`
  - With `when.truthy` → wrap in `{% if prop %}...{% endif %}`
- Handle dynamic element: `{ prop, default }` → use prop value as tag name

**T5: Create definition-to-JSON registry exporter** ✅
- File: `core/src/generators/jinja2/generate-registry.ts`
- Read all component definitions from `definitions/components/*.def.ts`
- Export to JSON format:
  ```json
  {
    "components": [{
      "name": "button",
      "description": "...",
      "attributes": [
        { "name": "type", "type": "enum", "default": "primary", "enum_values": [...] },
        { "name": "disabled", "type": "boolean", "default": false }
      ]
    }]
  }
  ```
- Map `PropSpec` to attribute types:
  - `null` → `"boolean"`
  - `{ values: [...] }` → `"enum"` with `enum_values`
  - `{ description }` → `"string"`

**T6: Create generate-all CLI script** ✅
→ depends on: T4, T5
- File: `core/src/generators/jinja2/generate-all.ts`
- Read all implementations from `implementations/components/index.ts`
- For each: generate `.html.j2` template using `Jinja2Generator`
- Write templates to `python/src/lord_of_the_components/templates/components/`
- Also run registry exporter to produce `python/src/lord_of_the_components/registry.json`
- Make it runnable: `npx tsx core/src/generators/jinja2/generate-all.ts`

**T7: Generate button template and verify** ✅
→ depends on: T2, T6
- Run the generator for button
- Manually compare generated `button.html.j2` with `jinja-roos-components/.../button.html.j2`
- Fix any discrepancies in the generator

### 1.3 Shared Mixins

**T8: Copy shared mixin templates** ✅
- Copy `jinja-roos-components/.../templates/components/_attribute_mixin.j2` → `python/src/lord_of_the_components/templates/components/_attribute_mixin.j2`
- Copy `jinja-roos-components/.../templates/components/_generic_attributes.j2` → `python/src/lord_of_the_components/templates/components/_generic_attributes.j2`
- No modifications needed (already kebab-case for utility attrs)

### 1.4 Fork Parser

**T9: Fork html_parser.py** ✅ (superseded: BeautifulSoup-based extension.py used instead of html_parser fork)

**T10: Fork and adapt extension.py** ✅ (superseded: custom BeautifulSoup-based ComponentExtension already implemented)

**T11: Rewrite registry.py** ✅ (already implemented: loads from registry.json, has all required classes/methods)

**T12: Create Python package __init__.py** ✅ (already implemented: exports setup_components, ComponentRegistry, etc.)

### 1.5 End-to-End Tests

**T13: Create test fixtures and conftest** ✅
→ depends on: T7, T10, T12
- File: `python/tests/conftest.py`
  - Fixture: configured Jinja2 `Environment` with LOTC extension
  - Helper: `render(template_str) → html_str`
- File: `python/tests/test_button_e2e.py`
  - Test: primary button renders correct classes
  - Test: each type variant (primary, secondary, tertiary, quaternary, subtle, warning, warning-subtle)
  - Test: size variants (xs, sm, md)
  - Test: disabled button (disabled attribute present)
  - Test: full-width button
  - Test: icon before/after
  - Test: content between tags overrides name prop
  - Test: @click → onclick attribute
  - Test: data-* and aria-* passthrough
  - Test: utility classes (text-style, margin, padding)
  - Test: custom class attribute appended

---

## Phase 2: Expand Components

### 2.1 Heading

**T14: Create heading definition** ✅
- File: `definitions/components/heading.def.ts`
- Props: type (values: h1-h6, default: h1), name (text), class
- Content: allowed (overrides name)

**T15: Create heading implementation** ✅
→ depends on: T1, T14
- File: `implementations/components/heading.impl.ts`
- Dynamic element: `{ prop: 'type', default: 'h1' }`
- Classes: pattern `utrecht-heading-{level}` (extract number from h1→1, h2→2, etc.)
- Content: `{{ children if children else name | safe }}`

**T16: Generate heading template and test** ✅
→ depends on: T6, T15
- Run generator
- File: `python/tests/test_heading_e2e.py`
- Test: renders `<h1>` through `<h6>` with correct classes

### 2.2 Icon

**T17: Create icon definition** ✅
- File: `definitions/components/icon.def.ts`
- Props: icon (required), size (xs-4xl, default: md), color (optional), aria-label, class
- No content (self-closing)

**T18: Create icon implementation** ✅
→ depends on: T1, T17
- File: `implementations/components/icon.impl.ts`
- Element: `span`
- Classes: `rvo-icon`, pattern `rvo-icon-{icon}`, pattern `rvo-icon--{size}`, conditional `rvo-icon--{color}` when color is set
- Attributes: role="img", aria-label from prop
- No children

**T19: Generate icon template and test** ✅
→ depends on: T6, T18
- Run generator
- File: `python/tests/test_icon_e2e.py`
- Test: renders with correct icon/size/color classes

### 2.3 Card

**T20: Update card definition for RVO alignment** ✅
- File: `definitions/components/card.def.ts` (update existing)
- Verify props match RVO card: title, image, image-alt, image-size, layout (column/row), padding, outline, background-color, href, full-card-link, show-link-indicator, class
- Content: allowed

**T21: Create card implementation** ✅
→ depends on: T1, T20
- File: `implementations/components/card.impl.ts`
- Element: `div`
- Classes: `rvo-card`, conditional `rvo-card--with-image`, `rvo-card--outline`, `rvo-card--padding-{value}`, etc.
- Content blocks:
  - Optional image section (when image is truthy)
  - Content div with optional title (with optional link wrapping)
  - Children slot
- Reference: `jinja-roos-components/.../card.html.j2`

**T22: Generate card template and test** ✅
→ depends on: T6, T21
- Run generator
- File: `python/tests/test_card_e2e.py`
- Test: basic card, with image, row layout, with link, outline, padding variants (45 tests)

### 2.4 Layout-flow

**T23: Create layout-flow definition** ✅
- File: `definitions/components/layout-flow.def.ts`
- Props: gap (spacing sizes), direction (horizontal/vertical), align, justify, class
- Content: allowed (children pass-through)

**T24: Create layout-flow implementation** ✅
→ depends on: T1, T23
- File: `implementations/components/layout-flow.impl.ts`
- Element: `div`
- Classes: `rvo-layout-flow`, pattern `rvo-layout-gap--{gap}`, conditional direction/alignment classes
- Content: `{{ children | safe }}`

**T25: Generate layout-flow template and test** ✅
→ depends on: T6, T24
- Run generator
- File: `python/tests/test_layout_flow_e2e.py`
- Test: renders with gap/direction classes, children passed through (37 tests)

### 2.5 Integration Tests

**T26: Update component registry and run all generators** ✅
→ depends on: T16, T19, T22, T25
- Update `implementations/components/index.ts` to export all 5 implementations
- Run generate-all to produce all templates + registry.json
- Verify all templates exist

**T27: Create nesting integration test** ✅
→ depends on: T26
- File: `python/tests/test_nesting_e2e.py`
- Test: `<c-layout-flow gap="lg"><c-card title="Test"><c-button name="Click"/></c-card></c-layout-flow>`
- Test: heading inside card
- Test: icon inside button content
- Verify correct HTML nesting (30 tests, all passing)

---

## Phase 3: Visual Testing

**T28: Create visual test server** ✅
→ depends on: T26
- File: `tests/visual/serve.py`
- Simple Python HTTP server (Flask or http.server)
- Renders fixture templates using LOTC Jinja2 extension
- Includes RVO CSS (from npm package or CDN)
- Serves on localhost:5555

**T29: Create visual test fixtures** ✅
→ depends on: T26
- Directory: `tests/visual/fixtures/`
- Files:
  - `button-variants.html` - all button types, sizes, states
  - `card-variants.html` - column, row, with-image, with-link, outline
  - `heading-variants.html` - h1 through h6
  - `icon-variants.html` - sizes and colors
  - `layout-flow-variants.html` - gap sizes, directions
  - `combined.html` - realistic page with multiple components nested

**T30: Set up Playwright visual tests** ✅
→ depends on: T28, T29
- File: `tests/visual/playwright.config.ts` (update or create)
- File: `tests/visual/specs/components.spec.ts`
- Screenshot tests for each fixture page (6 tests, all passing)
- Baseline establishment
- Ensure RVO CSS is loaded for correct visual rendering

**T31: Run visual tests and establish baselines** ✅
→ depends on: T30
- Run all Playwright tests (6 tests, all passing)
- Review screenshots manually for correctness
- Commit baseline screenshots

---

## Phase 4: Full Component Catalog

### 4.1 Layout Components

**T32: Implement layout-column, layout-row, max-width-layout** ✅
→ depends on: T26
- Create definitions + implementations for each
- Generate templates
- Unit tests (79 e2e tests, all passing)
- Visual test fixture + Playwright screenshot baseline
- layout-column: grid column with responsive sizes (xs-1 through lg-12)
- layout-row: grid row container with gap and vertical-spacing props
- max-width-layout: centered container with size, inline-padding, uncentered props

**T33: Implement grid component** ✅
→ depends on: T26
- Definition: columns (word names: one-twelve), gap, division, class
- Implementation: two nested divs (container + grid), pattern classes for columns/gap, division style attribute
- Template hand-tuned for outer container wrapper + division style
- 47 e2e tests (all passing), visual test fixture updated
- Added GRID_COLUMN_NAMES values, DIVISION prop

**T34: Implement page component**
→ depends on: T26
- Page wrapper with title, body-class, head content
- Includes CSS/JS assets
- Tests

### 4.2 Typography Components

**T35: Implement paragraph, label, strong, em, link** ✅
→ depends on: T26
- Definitions: paragraph (color, size, no-spacing), link (href, color, weight, show-icon, icon, target, states), label (id, for, size, type), strong, em
- Implementations: paragraph→p, link→a, label→label, strong→span, em→span
- Added VALUES: PARAGRAPH_COLORS, PARAGRAPH_SIZES, LINK_COLORS, LINK_WEIGHTS, LABEL_SIZES, LABEL_TYPES
- Added PROPS: WEIGHT, NO_SPACING, NO_UNDERLINE, FULL_CONTAINER_LINK, HOVER, FOCUS, ICON_COLOR, ICON_ARIA_LABEL
- Link template hand-tuned: conditional href/role/target attributes
- Label template hand-tuned: `for` is Jinja2 reserved word, uses `html_for` variable; conditional id/for
- 91 e2e tests (25 paragraph, 31 link, 17 label, 9 strong, 9 em), all passing
- Visual test fixture + Playwright screenshot baseline

### 4.3 Data Display Components

**T36: Implement alert component**
→ depends on: T26
- Status types (info, success, warning, error)
- Icon + title + content
- Tests

**T37: Implement hero, footer, header components**
→ depends on: T26
- More complex layouts
- May need rawTemplate escape hatch
- Tests

**T38: Implement data-list component**
→ depends on: T26
- Key-value pair display
- Tests

### 4.4 Navigation Components

**T39: Implement menubar component**
→ depends on: T26
- Complex: nested menu items, submenus, horizontal/vertical
- May need child component support in implementation layer
- Tests

**T40: Implement breadcrumbs, tabs, progress-tracker**
→ depends on: T26
- Each with items/children pattern
- Tests

### 4.5 Form Components

**T41: Implement base form controls (input, textarea, select, checkbox, radio)**
→ depends on: T26
- Each with field wrapper pattern (label + control + feedback)
- Tests

**T42: Implement form-field, fieldset, form layout**
→ depends on: T41
- Wrapper components for form structure
- Tests

### 4.6 Feedback & Table Components

**T43: Implement tag, status-icon, feedback**
→ depends on: T26
- Simple display components
- Tests

**T44: Implement table components (table, thead, tbody, tr, th, td)**
→ depends on: T26
- Table structure components
- Tests

### 4.7 CLI & Automation

**T45: Create `lotc generate:jinja2` CLI command**
→ depends on: T26
- File: `core/src/cli/commands/generate-jinja2.ts`
- Options: `--component name` (single), `--all` (all), `--output dir`
- Runs generator + registry export
- Reports success/failure per component

**T46: Full regression test suite**
→ depends on: T32-T44
- Run all unit tests
- Run all visual tests
- Verify no regressions

---

## Parallelization Guide

These tasks can be worked on simultaneously by different agents:

**Parallel group A** (no dependencies):
- T1 (implementation types)
- T5 (registry exporter)
- T8 (copy mixins)
- T11 (rewrite registry.py)

**Parallel group B** (after T1):
- T2 (button impl) + T4 (template generator) -- both depend only on T1

**Parallel group C** (after T2):
- T14 (heading def) + T17 (icon def) + T20 (card update) + T23 (layout-flow def)

**Parallel group D** (after T6):
- T15-T16 (heading) + T18-T19 (icon) + T21-T22 (card) + T24-T25 (layout-flow)

**Parallel group E** (after T26):
- T28-T31 (visual testing) + T32-T44 (remaining components) -- can all proceed in parallel