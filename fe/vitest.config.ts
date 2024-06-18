import { default as react } from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

// eslint-disable-next-line import/no-default-export
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    clearMocks: true,
    coverage: {
      clean: true,
      include: ['app/**/*.ts'],
      reporter: ['html', 'json', 'text'],
    },
    environment: 'jsdom',
    include: ['**/*.test.ts'],
    setupFiles: ['dotenv/config', './vitest.setup.ts'],
  },
});
