import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for visual regression testing.
 * Uses the Python serve.py to render LOTC fixtures through the Jinja2 pipeline.
 */
export default defineConfig({
  testDir: './specs',

  /* Run tests in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Reporter to use */
  reporter: process.env.CI ? 'github' : 'html',

  /* Shared settings for all the projects below */
  use: {
    /* Base URL -- serve.py runs on port 5555 */
    baseURL: 'http://localhost:5555',

    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',

    /* Screenshot options */
    screenshot: 'only-on-failure',
  },

  /* Configure snapshot paths */
  snapshotDir: './snapshots',
  snapshotPathTemplate: '{snapshotDir}/{testFilePath}/{arg}{ext}',

  /* Configure visual comparison */
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
      threshold: 0.2,
      animations: 'disabled',
    },
    toMatchSnapshot: {
      maxDiffPixelRatio: 0.01,
    },
  },

  /* Configure projects for headless Chromium */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        headless: true,
      },
    },
  ],

  /* Start the Python visual test server before running tests */
  webServer: {
    command: 'python serve.py --port 5555',
    url: 'http://localhost:5555',
    reuseExistingServer: !process.env.CI,
    timeout: 10000,
  },
});
