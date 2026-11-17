import { defineConfig, devices } from '@playwright/test';

const origin = 'http://127.0.0.1:4174';
const path = process.env.GITHUB_ACTIONS ? '/tasteprint/' : '/';

export default defineConfig({
  testDir: './tests/browser',
  reporter: 'list',
  use: { baseURL: origin + path, trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4174 --strictPort',
    url: origin + path,
    reuseExistingServer: false,
  },
});
