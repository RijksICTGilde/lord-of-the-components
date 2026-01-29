# Visual Testing

> **Status**: Phase 2 Implementation

## Overview

Lord of the Components uses Playwright for visual regression testing. Tests compare generated component fixtures against RVO (React Visual Baseline) screenshots to ensure visual consistency across the component library.

## Quick Start

```bash
# Install Playwright browsers (first time only)
npx playwright install --with-deps chromium

# Run visual tests
npm run test:visual

# Update baseline snapshots
npm run test:visual:update
```

## Architecture

```
tests/visual/
├── playwright.config.ts     # Playwright configuration
├── specs/
│   └── components.spec.ts   # Test specifications
├── fixtures/                # Generated component HTML files
│   ├── actions/
│   │   ├── button-variants.html
│   │   └── ...
│   ├── layout/
│   │   ├── stack-vertical.html
│   │   └── ...
│   └── data-display/
│       └── ...
├── rvo-baseline/            # RVO reference HTML files
│   ├── actions/
│   ├── layout/
│   └── data-display/
└── snapshots/               # Captured screenshots
    └── components.spec.ts/
        ├── button-variants-fixture.png
        ├── button-variants-rvo-baseline.png
        └── ...
```

## Running Tests

### Basic Test Run

```bash
npm run test:visual
```

This runs all visual tests in headless Chromium and generates an HTML report.

### Update Snapshots

When you make intentional visual changes, update the baseline snapshots:

```bash
npm run test:visual:update
```

### Filter by Component

Test a specific component:

```bash
npx playwright test --config=tests/visual/playwright.config.ts --grep "button"
```

### Interactive UI Mode

Debug tests with Playwright's visual UI:

```bash
npx playwright test --config=tests/visual/playwright.config.ts --ui
```

### Using the CLI

The LOTC CLI provides a wrapper for visual tests:

```bash
npm run lotc test:visual                    # Run all tests
npm run lotc test:visual --update           # Update snapshots
npm run lotc test:visual --component button # Filter by component
npm run lotc test:visual --ui               # Open UI mode
npm run lotc test:visual --verbose          # Show command being run
```

## Configuration

The Playwright configuration is located at `tests/visual/playwright.config.ts`.

### Key Settings

| Setting | Value | Description |
|---------|-------|-------------|
| `maxDiffPixelRatio` | `0.01` | Maximum allowed pixel difference (1%) |
| `threshold` | `0.2` | Color/anti-aliasing tolerance |
| `animations` | `disabled` | Prevents flaky tests from animations |
| `retries` | `2` (CI) | Retry failed tests in CI |

### Customizing Tolerance

For components with inherent variation, adjust the diff threshold:

```typescript
// In playwright.config.ts
expect: {
  toHaveScreenshot: {
    maxDiffPixelRatio: 0.02,  // Allow 2% difference
    threshold: 0.3,           // More lenient color matching
  },
}
```

## Interpreting Results

### Passing Tests

When tests pass, you'll see:

```
Visual tests passed!
```

### Failing Tests

When a visual difference is detected:

1. **HTML Report**: Opens automatically showing the diff
2. **Diff Images**: Created at `tests/visual/snapshots/**/*-diff.png`
3. **Expected vs Actual**: Side-by-side comparison in the report

### Understanding Diffs

The diff image highlights differences:
- **Pink/Red areas**: Pixels that differ between expected and actual
- **Unchanged areas**: Shown in original colors

### Common Failure Causes

| Cause | Solution |
|-------|----------|
| Intentional change | Update snapshots with `--update-snapshots` |
| Font rendering | Check font availability on CI |
| Animation timing | Ensure animations are disabled |
| Layout shift | Wait for content to settle |

## Writing Tests

### Test Structure

Tests are automatically generated from fixture files:

```typescript
// tests/visual/specs/components.spec.ts
for (const [category, fixtures] of Object.entries(fixturesByCategory)) {
  test.describe(`Visual Tests: ${category}`, () => {
    for (const fixturePath of fixtures) {
      test('fixture renders correctly', async ({ page }) => {
        await page.goto(`file://${fixtureFullPath}`);
        await page.waitForLoadState('networkidle');

        const container = page.locator('.fixture-container');
        await expect(container).toHaveScreenshot(`${name}-fixture.png`);
      });
    }
  });
}
```

### Adding New Fixtures

1. Create fixture HTML in `tests/visual/fixtures/<category>/<name>.html`
2. Add corresponding RVO baseline in `tests/visual/rvo-baseline/<category>/<name>.html`
3. Run tests to capture initial screenshots

### Fixture HTML Structure

Fixtures should use the `.fixture-container` class:

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="../../styles/tokens.css">
  <link rel="stylesheet" href="../../styles/components.css">
</head>
<body>
  <div class="fixture-container">
    <!-- Component HTML here -->
    <button class="c-button c-button--primary">Click me</button>
  </div>
</body>
</html>
```

### Full-Page Components

For page-level components (like `page-*`), the test screenshots the `body` element instead of `.fixture-container`.

## CI Integration

Visual tests run automatically on GitHub Actions for pushes and PRs to main/master branches.

### Workflow File

Located at `.github/workflows/visual-tests.yml`:

```yaml
name: Visual Tests

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  visual-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - run: npx playwright install --with-deps chromium
      - run: npm run test:visual
```

### CI Artifacts

On failure, CI uploads:
- **playwright-report**: Full HTML test report
- **visual-test-diffs**: Diff images for failed tests

Download artifacts from the GitHub Actions run to inspect failures.

### Updating Baselines in CI

If tests fail due to intentional changes:

1. Run tests locally with `npm run test:visual:update`
2. Review the updated snapshots in `tests/visual/snapshots/`
3. Commit the updated snapshots
4. Push to trigger CI again

## Troubleshooting

### Tests Fail Only on CI

**Cause**: Font rendering differences between local and CI environments.

**Solution**: Use web fonts or ensure consistent font availability:

```html
<head>
  <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet">
</head>
```

### Flaky Tests

**Cause**: Race conditions with dynamic content.

**Solution**: Add explicit waits:

```typescript
await page.waitForLoadState('networkidle');
await page.waitForSelector('.c-button');
```

### Missing Snapshots

**Cause**: Running tests for the first time or after deleting snapshots.

**Solution**: Run with `--update-snapshots` to create initial baselines:

```bash
npm run test:visual:update
```

### Large Diff Percentage

**Cause**: Significant layout or style changes.

**Solution**:
1. Review the diff carefully
2. If changes are intentional, update snapshots
3. If unexpected, investigate the cause

## Best Practices

1. **Keep fixtures minimal**: Test one visual aspect per fixture
2. **Use semantic names**: `button-variants.html`, not `test1.html`
3. **Organize by category**: Group related fixtures in subdirectories
4. **Review diffs carefully**: Always inspect before updating snapshots
5. **Commit snapshots**: Version control your baseline images
6. **Run locally first**: Verify tests pass before pushing to CI

## Coverage Report

The test suite includes coverage checks:

```typescript
test('all fixtures have corresponding RVO baselines', async () => {
  // Reports fixtures without baselines
});

test('all RVO baselines have corresponding fixtures', async () => {
  // Reports baselines without fixtures
});
```

These tests document coverage status without failing, allowing incremental development.
