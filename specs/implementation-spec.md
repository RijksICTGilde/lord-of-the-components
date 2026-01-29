# Lord of the Components - Implementation Specification

## Overview

This specification defines a universal component system that generates templates for multiple platforms (Jinja2, React, WebComponents) from a single source of truth: **RIG Script**.

### Related Projects
- `lord-of-the-components` - Main project with KDL definitions, RigScript DSL, and tooling
- `jinja-roos-components` - Jinja2 implementation (74 templates) - translated from RVO
- `rvo` - React design system (76 components with SCSS) - **original source / visual baseline**

### Target Priority Order
1. Jinja2
2. React
3. Web Components

### Architecture

```
KDL Definition (agnostic)              RVO React (original source)
"button has variant, size"                    ↓
         ↓                              visual/behavioral reference
         ↓                                    ↓
    RigScript (implementation logic)  ←  written manually
    "if variant: add class, render element"
         ↓
    Transpilers
    ↓         ↓           ↓
 Jinja2    React    WebComponents
```

**Key Concepts:**
- **KDL Definition** - Declares WHAT a component is (props, slots, types) - platform agnostic
- **RigScript** - Defines HOW a component renders (logic, conditionals, element structure) - written manually using RVO as reference
- **Transpilers** - Convert RigScript to platform-specific implementations

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

## Phase 4: Scale to All Components

**Goal:** All ~95 components have RigScript implementations with visual tests

### 4.1 Scaffold CLI Command ✅ DONE
- **File:** `core/src/cli/commands/scaffold.ts`
- **Usage:** `lotc scaffold <component-name>`
- **Output:** `.rig` file skeleton from KDL definition
- **Features:**
  - Generates RigScript skeleton with header comments, render.element(), and slot rendering
  - Smart tag detection (button for buttons, a for links, etc.)
  - Groups props by type (core, boolean, special boolean with ARIA)
  - Filters invalid props from KDL parsing artifacts
  - Provides "Did you mean?" suggestions for typos
  - Supports custom output path with -o flag

### 4.2-4.10 Component Categories

| Category | Count | Components |
|----------|-------|------------|
| Layout | 9 | page, layout, stack, grid, grid-item, container, section, spacer, divider |
| Action | 4 | button, icon-button, link, action-group |
| Typography | 3 | heading, text, prose |
| Feedback | 10 | alert, notification, badge, tag, skeleton, spinner, status-icon, empty, progress, progress-tracker |
| Navigation | 8 | breadcrumb, menu, menubar, tabs, tab, pagination, skip-link |
| Data Display | 14 | card, table, list-item, description-list, avatar, avatar-group, image, figure, codeblock, code, time, icon |
| Overlay | 6 | modal, dialog, dropdown, tooltip, drawer, popover |
| Input | 20+ | text, email, password, number, date, time, file, checkbox, radio, switch, select, textarea, range, color, autocomplete, field wrappers |
| Utility | 3 | focus-trap, portal, visually-hidden |

#### Layout Components Progress (9 total)
| Component | Status | File |
|-----------|--------|------|
| page | ✅ DONE | `packages/core/components/page/page.rig` |
| layout | ✅ DONE | `packages/layout/components/layout/layout.rig` |
| stack | ✅ DONE | `packages/layout/components/stack/stack.rig` |
| grid | ✅ DONE | `packages/layout/components/grid/grid.rig` |
| grid-item | ✅ DONE | `packages/layout/components/grid-item/grid-item.rig` |
| container | ⏳ TODO | - |
| section | ⏳ TODO | - |
| spacer | ⏳ TODO | - |
| divider | ⏳ TODO | - |

#### Action Components Progress (4 total)
| Component | Status | File |
|-----------|--------|------|
| button | ✅ DONE | `packages/core/components/button/button.rig` |
| icon-button | ⏳ TODO | - |
| link | ⏳ TODO | - |
| action-group | ⏳ TODO | - |

#### Data Display Components Progress (partial)
| Component | Status | File |
|-----------|--------|------|
| card | ✅ DONE | `packages/core/components/card/card.rig` |
| (others) | ⏳ TODO | - |

### 4.11-4.12 Completion Criteria
- **Visual Tests:** All 95 components pass
- **Documentation:** `docs/component-coverage.md` with 95/95 status

---

## Phase 5: React Transpiler Enhancement

**Goal:** React output matches RVO quality

### 5.1 Audit Gaps
- **File:** `core/src/rigscript/transpiler-react.ts`
- **Deliverable:** List of missing features vs RVO

### 5.2 className Building
- **Implementation:** Generate `clsx()` calls
- **Example:**
  ```typescript
  className={clsx('c-button', variant && `c-button--${variant}`)}
  ```

### 5.3 Props Destructuring
- **Output:** TypeScript interface + destructuring
- **Example:**
  ```typescript
  interface ButtonProps {
    variant?: 'primary' | 'secondary';
    children?: React.ReactNode;
  }

  export function Button({ variant = 'primary', children }: ButtonProps) {
  ```

### 5.4 Children/Slot Handling
- **Mapping:** `render.slot("default")` → `{children}`
- **Named Slots:** Props-based slot pattern

### 5.5-5.6 Generation and Testing
- **Command:** `lotc build --target react`
- **Validation:** TypeScript compilation
- **Visual Tests:** Compare to RVO baseline

---

## Phase 6: Web Components Target

**Goal:** Generate Web Components from RigScript

### 6.1 Architecture Design
- **Document:** `docs/design/webcomponents-transpiler.md`
- **Decisions:**
  - Custom Elements v1 API
  - Shadow DOM usage strategy
  - Slot mapping approach
  - Style encapsulation

### 6.2-6.4 Transpiler Implementation
- **File:** `core/src/rigscript/transpiler-webcomponents.ts` (NEW)
- **Features:**
  - Custom Element class generation
  - `attachShadow()` calls
  - `<slot>` element mapping
  - Attribute/property handling

### 6.5-6.7 Generation and Testing
- **Initial:** 5 reference components (button, card, stack, layout, page)
- **Full:** All 95 components
- **Validation:** Visual tests match Jinja2/React output

---

## Critical Files Reference

| File | Purpose | Phase |
|------|---------|-------|
| `core/src/rigscript/lexer.ts` | Token scanning | 1 |
| `core/src/rigscript/parser.ts` | AST generation | 1 |
| `core/src/rigscript/types.ts` | Type definitions | 1 |
| `core/src/rigscript/builtins.ts` | Built-in functions | 1 |
| `core/src/rigscript/transpiler-jinja2.ts` | Jinja2 output | 1 |
| `core/src/rigscript/transpiler-react.ts` | React output | 5 |
| `core/src/rigscript/transpiler-webcomponents.ts` | Web Components output | 6 |
| `core/src/generators/fixture-generator.ts` | Test fixtures | 2 |
| `python/src/lord_of_the_components/extension.py` | Jinja2 preprocessor | 3 |
| `python/src/lord_of_the_components/validation.py` | Expression validation | 3 |
| `tests/visual/playwright.config.ts` | Visual test config | 2 |
| `tests/visual/specs/components.spec.ts` | Visual test specs | 2 |

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
- [ ] 95 .rig files exist
- [ ] All transpile to valid Jinja2
- [ ] All visual tests pass

### Phase 5 Complete When:
- [ ] React transpiler feature-complete
- [ ] 95 React components generate
- [ ] Visual tests match RVO baseline

### Phase 6 Complete When:
- [ ] Web Components transpiler complete
- [ ] 95 Web Components generate
- [ ] Visual tests pass
