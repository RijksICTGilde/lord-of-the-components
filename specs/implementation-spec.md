# Lord of the Components - Implementation Specification

## Overview

This specification defines a universal component system that generates templates for multiple platforms (Jinja2, React, WebComponents) from a single source of truth: **RIG Script**.

### Related Projects
- `lord-of-the-components` - Main project with KDL definitions, RigScript DSL, and tooling
- `jinja-roos-components` - Original Jinja2 implementation (74 templates)
- `rvo` - React design system (76 components with SCSS) - visual baseline reference

### Target Priority Order
1. Jinja2
2. React
3. Web Components

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

## Phase 2: Template Extraction Pipeline

**Goal:** Extract existing HTML/Jinja2 templates to RigScript

### 2.1 Jinja2 Template Analyzer
- **File:** `core/src/extractors/jinja2-analyzer.ts` (NEW)
- **Purpose:** Parse Jinja2 templates, extract structure
- **Output:** Intermediate Representation (IR) data structure
- **Capabilities:**
  - Variable reference extraction
  - Conditional parsing
  - Loop detection
  - Filter identification

### 2.2 Pattern Recognition Mappings
| Jinja2 Pattern | RigScript Equivalent |
|----------------|---------------------|
| `{{ ctx.prop }}` | `props.prop` |
| `{% if x %}` | `if x:` |
| `{% for item in items %}` | `for item in items:` |
| `{{ content \| safe }}` | `render.slot("default")` |
| `{{ x \| default(y) }}` | `default(x, y)` |

### 2.3 HTML Structure Analyzer
- **File:** `core/src/extractors/html-analyzer.ts` (NEW)
- **Purpose:** Parse HTML, extract element hierarchy
- **Output:** Element tree with attribute metadata
- **Extracts:**
  - Tag hierarchy
  - Attribute names and values
  - Class patterns (static vs dynamic)
  - Event handlers

### 2.4 RigScript Generator
- **File:** `core/src/extractors/rigscript-generator.ts` (NEW)
- **Purpose:** Convert IR to RigScript
- **Process:**
  1. Receive IR from analyzers
  2. Build RigScript AST
  3. Serialize to formatted `.rig` file

### 2.5-2.6 CLI Command: `extract`
- **File:** `core/src/cli/commands/extract.ts` (NEW)
- **Registration:** `core/src/cli/index.ts`
- **Usage:** `lotc extract --input <file> --output <file>`
- **Options:**
  - `--input` - Source Jinja2 template
  - `--output` - Output .rig file path

### 2.7-2.8 Template Extraction Tasks
Extract these templates:
1. `button.html.j2` → `button.rig`
2. `page.html.j2` → `page.rig`
3. `layout.html.j2` → `layout.rig`
4. `stack.html.j2` → `stack.rig`
5. `card.html.j2` → `card.rig`

### 2.9-2.11 Documentation and Tests
| File | Purpose |
|------|---------|
| `docs/features/template-extraction.md` | Extraction process documentation |
| `core/tests/extractors/jinja2-analyzer.test.ts` | Analyzer unit tests |
| `core/tests/extractors/rigscript-generator.test.ts` | Generator unit tests |

---

## Phase 3: Visual Testing with Playwright

**Goal:** Automated visual regression testing comparing to RVO baseline

### 3.1-3.2 Playwright Setup
- **Dependency:** `@playwright/test` (devDependency)
- **Config File:** `tests/visual/playwright.config.ts`
- **Configuration:**
  - Browser: Headless Chromium
  - Snapshot directory: `tests/visual/snapshots/`
  - Diff threshold: Configurable pixel tolerance

### 3.3-3.5 Fixture Generation
- **Generator:** `core/src/generators/fixture-generator.ts` (NEW)
- **CLI Command:** `lotc test:fixtures --output <dir>`
- **Output:** `tests/visual/fixtures/` directory
- **Process:**
  1. Read KDL component definitions
  2. Extract example configurations
  3. Generate standalone HTML files

### 3.6 RVO Baseline
- **Directory:** `tests/visual/rvo-baseline/`
- **Content:** HTML fixtures from RVO React components
- **Purpose:** Visual comparison reference

### 3.7-3.12 Visual Test Infrastructure
| File | Purpose |
|------|---------|
| `tests/visual/specs/components.spec.ts` | Playwright test specifications |
| `tests/visual/snapshots/` | Baseline screenshots |
| `core/src/cli/commands/test-visual.ts` | CLI wrapper for Playwright |
| `.github/workflows/visual-tests.yml` | CI integration |

### 3.13 Documentation
- **File:** `docs/features/visual-testing.md`
- **Content:**
  - Running visual tests
  - Updating baselines
  - Interpreting diff results
  - CI integration

---

## Phase 4: Python Preprocessor Refinement

**Goal:** Production-ready Jinja2 extension with excellent developer experience

### 4.1 Deterministic Placeholder System
- **File:** `python/src/lord_of_the_components/extension.py`
- **Current:** Random placeholders
- **Target:** Position-based hashes
- **Benefit:** Reproducible intermediate output

### 4.2-4.3 Source Location Tracking
- **File:** `python/src/lord_of_the_components/extension.py`
- **Features:**
  - Track line/column for parsed component tags
  - Include location in error messages
- **Error Format:** `Unknown attribute 'varient' at line 42, column 5. Did you mean 'variant'?`

### 4.4 Named Slot Extraction
- **Syntax:** `<template slot="name">content</template>`
- **Behavior:** Extract slot content, pass to component context
- **Access:** `slots.name` in component template

### 4.5 Expression Validation
- **File:** `python/src/lord_of_the_components/validation.py`
- **Validates:** `:attr="expression"` syntax
- **Timing:** Before template rendering
- **Errors:** Clear syntax error messages

### 4.6 Topological Sort for Nesting
- **Purpose:** Single-pass processing of nested components
- **Algorithm:**
  1. Build dependency graph
  2. Topologically sort components
  3. Process in sorted order

### 4.7 Nesting Depth Protection
- **Constant:** `MAX_NESTING_DEPTH = 50`
- **Behavior:** Raise error if exceeded
- **Error:** Clear message about nesting limit

### 4.8-4.11 Python Unit Tests
| Test File | Coverage |
|-----------|----------|
| `python/tests/test_extension.py` | Placeholder system |
| `python/tests/test_slots.py` | Named slot extraction |
| `python/tests/test_errors.py` | Error message quality |
| `python/tests/test_nesting.py` | Topological sort, depth limits |

### 4.12-4.14 Documentation and Validation
- **Documentation:** `docs/features/jinja-preprocessor.md`
- **Type Checking:** `mypy src/` (zero errors)
- **Test Suite:** `pytest tests/ -v` (all pass)

---

## Phase 5: Scale to All Components

**Goal:** All ~95 components have RigScript implementations with visual tests

### 5.1 Scaffold CLI Command
- **File:** `core/src/cli/commands/scaffold.ts` (NEW)
- **Usage:** `lotc scaffold <component-name>`
- **Output:** `.rig` file skeleton from KDL definition

### 5.2-5.10 Component Categories

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

### 5.11-5.12 Completion Criteria
- **Visual Tests:** All 95 components pass
- **Documentation:** `docs/component-coverage.md` with 95/95 status

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
| `core/src/rigscript/lexer.ts` | Token scanning | 1 |
| `core/src/rigscript/parser.ts` | AST generation | 1 |
| `core/src/rigscript/types.ts` | Type definitions | 1 |
| `core/src/rigscript/builtins.ts` | Built-in functions | 1 |
| `core/src/rigscript/transpiler-jinja2.ts` | Jinja2 output | 1 |
| `core/src/rigscript/transpiler-react.ts` | React output | 6 |
| `core/src/rigscript/transpiler-webcomponents.ts` | Web Components output | 7 |
| `core/src/extractors/jinja2-analyzer.ts` | Template extraction | 2 |
| `core/src/extractors/html-analyzer.ts` | HTML parsing | 2 |
| `core/src/extractors/rigscript-generator.ts` | RigScript generation | 2 |
| `core/src/generators/fixture-generator.ts` | Test fixtures | 3 |
| `python/src/lord_of_the_components/extension.py` | Jinja2 preprocessor | 4 |
| `python/src/lord_of_the_components/validation.py` | Expression validation | 4 |
| `tests/visual/playwright.config.ts` | Visual test config | 3 |
| `tests/visual/specs/components.spec.ts` | Visual test specs | 3 |

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

### Extract Commands
```bash
lotc extract --input file.j2 --output file.rig
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
- [ ] 5 reference .rig files transpile to valid Jinja2
- [x] All unit tests pass

### Phase 2 Complete When:
- [ ] `lotc extract` command works
- [ ] 5 Jinja2 templates extract to valid RigScript
- [ ] Extracted output matches hand-written references

### Phase 3 Complete When:
- [ ] Playwright configured and running
- [ ] RVO baseline screenshots captured
- [ ] Visual comparison tests execute
- [ ] CI workflow operational

### Phase 4 Complete When:
- [ ] Deterministic placeholders implemented
- [ ] Error messages include source locations
- [ ] Named slots work correctly
- [ ] Nesting depth protected
- [ ] All Python tests pass
- [ ] mypy reports zero errors

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
