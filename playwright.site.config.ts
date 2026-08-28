import { defineConfig, devices } from '@playwright/test';

const externalBaseURL = process.env.SITE_BASE_URL;
const baseURL = externalBaseURL ?? 'http://localhost:4321';

export default defineConfig({
  testDir: './e2e-site',
  outputDir: '.playwright-results/site',
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  webServer: externalBaseURL
    ? undefined
    : {
        command: 'npm --prefix site run dev -- --host localhost --port 4321',
        port: 4321,
        reuseExistingServer: !process.env.CI,
      },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
