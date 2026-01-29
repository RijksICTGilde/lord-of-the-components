import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for visual regression testing.
 * Compares generated component output against RVO baseline.
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
    /* Base URL for page.goto() */
    baseURL: 'http://localhost:3000',

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
      /* Maximum allowed pixel difference ratio (0-1) */
      maxDiffPixelRatio: 0.01,

      /* Threshold for anti-aliasing and color difference (0-1) */
      threshold: 0.2,

      /* Animations can cause flakiness, disable them */
      animations: 'disabled',
    },
    toMatchSnapshot: {
      /* Maximum allowed pixel difference ratio for image snapshots */
      maxDiffPixelRatio: 0.01,
    },
  },

  /* Configure projects for headless Chromium */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        /* Use headless mode */
        headless: true,
      },
    },
  ],

  /* Run local dev server before starting the tests (optional) */
  // webServer: {
  //   command: 'npm run serve:fixtures',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
