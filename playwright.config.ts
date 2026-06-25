import { defineConfig, devices } from '@playwright/test';

// Smoke E2E for the production build. `npm run build` must run first; the
// config boots `vite preview` (serves dist at /fifa26/) and points tests at it.
const PORT = 4173;
const BASE = `http://localhost:${PORT}/fifa26/`;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: BASE,
    trace: 'on-first-retry',
  },
  // Cross-browser + mobile coverage.
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 14'] } },
  ],
  webServer: {
    command: 'npm run preview',
    url: BASE,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
