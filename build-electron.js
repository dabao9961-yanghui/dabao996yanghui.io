import { build } from 'esbuild';

build({
  entryPoints: ['electron/main.ts', 'electron/preload.ts'],
  outdir: 'dist-electron',
  platform: 'node',
  format: 'cjs',
  bundle: true,
  external: ['electron'],
  outExtension: { '.js': '.cjs' },
});
