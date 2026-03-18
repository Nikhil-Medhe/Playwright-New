import path from 'path';
import { defineConfig, devices } from '@playwright/test';
import { envConfig } from './config/env';

// One RUN_ID per run: run-YYYY-MM-DD_HH-mm-ss (set by scripts/run-tests-with-id.js)
function getRunId() {
  if (process.env.PLAYWRIGHT_RUN_ID) return process.env.PLAYWRIGHT_RUN_ID;
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const datePart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const timePart = `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
  return (process.env.PLAYWRIGHT_RUN_ID = `run-${datePart}_${timePart}`);
}
const runId = getRunId();

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  outputDir: path.join(process.cwd(), 'test-results', runId),
  reporter: [
    ['html', { outputFolder: path.join(process.cwd(), 'playwright-reports', runId), open: 'never' }],
    ...(process.env.CI ? [['junit', { outputFile: path.join(process.cwd(), 'test-results', 'junit.xml') }]] : []),
  ],
  timeout: envConfig.timeout,
  use: {
    baseURL: envConfig.baseURL,
    headless: process.env.HEADLESS === 'true',
    /* Capture screenshots/videos only on failures. */
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          slowMo: Number(process.env.SLOW_MO) || 0,
        },
      },
    },

    /*{
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    //{
      //name: 'webkit',
      //use: { ...devices['Desktop Safari'] },
    //},

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
