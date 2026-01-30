import esbuild from 'esbuild';

esbuild.build({
  entryPoints: ['src/main.ts'],
  outfile: 'main.js',
  format: 'cjs',
  platform: 'node',
  external: ['obsidian'],
  bundle: true,
  sourcemap: 'inline',
  target: 'es2020',
}).catch(() => process.exit(1));
