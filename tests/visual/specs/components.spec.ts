import { test, expect } from '@playwright/test';

/**
 * Visual regression tests for lord-of-the-components.
 *
 * Each fixture is rendered through the LOTC Jinja2 pipeline by serve.py,
 * which injects RVO/Utrecht CSS for proper visual rendering.
 */

const FIXTURES = [
  'button-variants.html',
  'card-variants.html',
  'heading-variants.html',
  'icon-variants.html',
  'layout-flow-variants.html',
  'layout-grid-variants.html',
  'typography-variants.html',
  'alert-variants.html',
  'data-list-variants.html',
  'page-structure-variants.html',
  'combined.html',
] as const;

for (const fixture of FIXTURES) {
  const name = fixture.replace('.html', '');

  test.describe(name, () => {
    test('renders correctly', async ({ page }) => {
      await page.goto(`/${fixture}`);
      await page.waitForLoadState('networkidle');

      const container = page.locator('.fixture-container');
      await expect(container).toBeVisible();
      await expect(container).toHaveScreenshot(`${name}.png`);
    });
  });
}
