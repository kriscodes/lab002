import { defineConfig, devices } from '@playwright/test';

const localUrl = 'http://127.0.0.1:3002';

export default defineConfig({
  testDir: './tests',
  testMatch: '*.spec.ts',
  reporter: 'list',
  use: { baseURL: localUrl },
  projects: [
    { name: 'Chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'Firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'WebKit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: localUrl,
    reuseExistingServer: !process.env.CI,
  },
});
