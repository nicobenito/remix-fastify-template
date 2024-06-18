import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

// eslint-disable-next-line import/no-default-export
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    clearMocks: true,
    coverage: {
      clean: true,
      include: ['src/**/*.ts'],
      provider: 'v8',
      reporter: ['html', 'json', 'text'],
    },
    environment: 'node',
    include: ['**/*.test.ts'],
    setupFiles: ['dotenv/config', './vitest.setup.mts'],
  },
});
