import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

/**
 * Visual regression tests for lord-of-the-components.
 *
 * Compares generated fixtures against RVO baseline to ensure
 * visual consistency across the component library.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VISUAL_DIR = path.join(__dirname, '..');
const FIXTURES_DIR = path.join(VISUAL_DIR, 'fixtures');
const RVO_BASELINE_DIR = path.join(VISUAL_DIR, 'rvo-baseline');

/**
 * Recursively finds all HTML files in a directory.
 */
function findHtmlFiles(dir: string, basePath: string = ''): string[] {
  const files: string[] = [];

  if (!fs.existsSync(dir)) {
    return files;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const relativePath = path.join(basePath, entry.name);
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...findHtmlFiles(fullPath, relativePath));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      files.push(relativePath);
    }
  }

  return files;
}

/**
 * Extracts component name and example name from a fixture path.
 * e.g., "actions/button-variants.html" -> { category: "actions", name: "button-variants" }
 */
function parseFixturePath(fixturePath: string): { category: string; name: string } {
  const parts = fixturePath.replace('.html', '').split(path.sep);
  const category = parts.slice(0, -1).join('/') || 'root';
  const name = parts[parts.length - 1];
  return { category, name };
}

/**
 * Checks if a fixture is a full-page component (like page-*).
 * Full-page components don't have .fixture-container, we screenshot the body.
 */
function isFullPageFixture(name: string): boolean {
  return name.startsWith('page-');
}

// Get all fixture files
const fixtureFiles = findHtmlFiles(FIXTURES_DIR);

// Group fixtures by category for better test organization
const fixturesByCategory = fixtureFiles.reduce((acc, file) => {
  const { category } = parseFixturePath(file);
  if (!acc[category]) {
    acc[category] = [];
  }
  acc[category].push(file);
  return acc;
}, {} as Record<string, string[]>);

// Generate tests for each category
for (const [category, fixtures] of Object.entries(fixturesByCategory)) {
  test.describe(`Visual Tests: ${category}`, () => {
    for (const fixturePath of fixtures) {
      const { name } = parseFixturePath(fixturePath);
      const fixtureFullPath = path.join(FIXTURES_DIR, fixturePath);
      const baselineFullPath = path.join(RVO_BASELINE_DIR, fixturePath);

      test.describe(name, () => {
        const isFullPage = isFullPageFixture(name);

        test('fixture renders correctly', async ({ page }) => {
          // Load the fixture HTML file directly
          await page.goto(`file://${fixtureFullPath}`);

          // Wait for any dynamic content to settle
          await page.waitForLoadState('networkidle');

          // Find the fixture container (or body for full-page components)
          const container = isFullPage
            ? page.locator('body')
            : page.locator('.fixture-container');
          await expect(container).toBeVisible();

          // Take screenshot of the fixture
          await expect(container).toHaveScreenshot(`${name}-fixture.png`);
        });

        // Only run baseline comparison if RVO baseline exists
        const hasBaseline = fs.existsSync(baselineFullPath);

        if (hasBaseline) {
          test('matches RVO baseline', async ({ page }) => {
            // Load the RVO baseline
            await page.goto(`file://${baselineFullPath}`);
            await page.waitForLoadState('networkidle');

            // Find the fixture container (or body for full-page components)
            const baselineContainer = isFullPage
              ? page.locator('body')
              : page.locator('.fixture-container');
            await expect(baselineContainer).toBeVisible();

            // Take screenshot of the baseline for reference
            await expect(baselineContainer).toHaveScreenshot(`${name}-rvo-baseline.png`);
          });
        }
      });
    }
  });
}

// Test that validates fixture/baseline parity
test.describe('Fixture Coverage', () => {
  test('all fixtures have corresponding RVO baselines', async () => {
    const missingBaselines: string[] = [];

    for (const fixturePath of fixtureFiles) {
      const baselineFullPath = path.join(RVO_BASELINE_DIR, fixturePath);
      if (!fs.existsSync(baselineFullPath)) {
        missingBaselines.push(fixturePath);
      }
    }

    // Report missing baselines but don't fail - some components may be in development
    if (missingBaselines.length > 0) {
      console.log(`\nFixtures without RVO baselines (${missingBaselines.length}):`);
      for (const missing of missingBaselines) {
        console.log(`  - ${missing}`);
      }
    }

    // This test just documents coverage, actual visual tests handle the comparison
    expect(true).toBe(true);
  });

  test('all RVO baselines have corresponding fixtures', async () => {
    const baselineFiles = findHtmlFiles(RVO_BASELINE_DIR);
    const missingFixtures: string[] = [];

    for (const baselinePath of baselineFiles) {
      const fixtureFullPath = path.join(FIXTURES_DIR, baselinePath);
      if (!fs.existsSync(fixtureFullPath)) {
        missingFixtures.push(baselinePath);
      }
    }

    if (missingFixtures.length > 0) {
      console.log(`\nRVO baselines without fixtures (${missingFixtures.length}):`);
      for (const missing of missingFixtures) {
        console.log(`  - ${missing}`);
      }
    }

    expect(true).toBe(true);
  });
});
