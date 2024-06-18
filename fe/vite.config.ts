import { devErrorBoundary } from '@metronome-sh/dev-error-boundary';
import { vitePlugin as remix } from '@remix-run/dev';
import { remixDevTools } from 'remix-development-tools';
import { flatRoutes } from 'remix-flat-routes';
import { defineConfig } from 'vite';
import { cjsInterop } from 'vite-plugin-cjs-interop';
import tsconfigPaths from 'vite-tsconfig-paths';

const ignoredRouteFiles = ['**!/.*', '**/*.css', '**/*.test.{js,jsx,ts,tsx}'];

// eslint-disable-next-line import/no-default-export
export default defineConfig(({ mode }) => {
  return {
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    plugins: [
      cjsInterop({
        dependencies: ['react-konami-code'],
      }),
      remixDevTools(),
      remix({
        ignoredRouteFiles: ['**/*'],
        routes: async (defineRoutes) => {
          return flatRoutes('routes', defineRoutes, {
            ignoredRouteFiles,
          });
        },
        serverModuleFormat: 'esm',
      }),
      tsconfigPaths(),
      devErrorBoundary(),
    ],
    ssr: {
      noExternal: ['@emotion/**', '@mui/**', 'material-react-table'],
    },
    resolve: {
      alias: {
        '@mui/base': '@mui/base/modern',
        '@mui/icons-material': '@mui/icons-material/esm',
        '@mui/material': '@mui/material/modern',
        '@mui/lab': '@mui/lab/modern',
        '@mui/styled-engine': '@mui/styled-engine/modern',
        '@mui/system': '@mui/system/modern',
        '@mui/utils': '@mui/utils/modern',
      },
    },
  };
});
