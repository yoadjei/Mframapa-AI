import { defineConfig, devices } from '@playwright/test'

const websitePort = 5173
const pwaPort = 5174

export default defineConfig({
  testDir: '.',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 60_000,
  expect: { timeout: 12_000 },
  use: {
    trace: 'on-first-retry',
    video: 'off',
  },
  projects: [
    {
      name: 'website-desktop',
      testMatch: /website\/.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `http://127.0.0.1:${websitePort}`,
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: 'website-mobile',
      testMatch: /website\/.*\.spec\.ts/,
      use: {
        ...devices['Pixel 7'],
        baseURL: `http://127.0.0.1:${websitePort}`,
      },
    },
    {
      name: 'pwa-mobile',
      testMatch: /pwa\/.*\.spec\.ts/,
      use: {
        ...devices['Pixel 7'],
        baseURL: `http://127.0.0.1:${pwaPort}`,
      },
    },
  ],
  webServer: [
    {
      command: 'npm run preview -- --host 127.0.0.1 --port 5173 --strictPort',
      cwd: '../website',
      url: `http://127.0.0.1:${websitePort}`,
      reuseExistingServer: true,
      timeout: 180_000,
    },
    {
      command: 'npm run preview -- --host 127.0.0.1 --port 5174 --strictPort',
      cwd: '../frontend-pwa',
      url: `http://127.0.0.1:${pwaPort}`,
      reuseExistingServer: true,
      timeout: 180_000,
    },
  ],
})
