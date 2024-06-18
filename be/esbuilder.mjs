/* eslint-disable no-console  */
/* eslint-disable unicorn/no-process-exit */
import {build} from 'esbuild';
import {nodeExternalsPlugin} from 'esbuild-node-externals';
import {rimraf} from 'rimraf';

const distPath = 'dist';
const outfile = `${distPath}/platform.js`;

try {
  await rimraf('dist');
  await build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    platform: 'node',
    outfile,
    sourcemap: true,
    plugins: [nodeExternalsPlugin()],
  });

  console.info('✅ platform.js has been built.');
  process.exit(0);
} catch (error) {
  console.error('🔴 Error building platform.js', error);
  process.exit(1);
}
