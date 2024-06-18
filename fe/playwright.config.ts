import { defineConfig } from '@playwright/test';

// eslint-disable-next-line import/no-default-export
export default defineConfig({
  fullyParallel: false,
  reporter: [['junit', { outputFile: 'coverage/e2e.xml' }]],
  retries: process.env.CI ? 2 : 0,
  testDir: './tests/e2e',
  use: {
    baseURL: process.env.TEST_BASE_URL || 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
    video: 'on-first-retry',
  },
  workers: process.env.CI ? 1 : undefined,
  webServer: {
    command: 'pnpm start:test',
    port: 3000,
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
    stderr: 'pipe',
    stdout: 'pipe',
  },
});
