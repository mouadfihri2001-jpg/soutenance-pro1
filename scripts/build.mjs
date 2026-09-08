import { build } from 'esbuild';
import { mkdir, copyFile, rm } from 'node:fs/promises';
await rm('dist', { recursive: true, force: true });
await mkdir('dist/assets', { recursive: true });
await copyFile('index.html', 'dist/index.html');
await copyFile('src/app.css', 'dist/assets/app.css');
await build({
  entryPoints: ['src/app.js'], outdir: 'dist/assets', bundle: true,
  minify: true, splitting: true, format: 'esm', platform: 'browser',
  target: ['es2022'], entryNames: 'app', chunkNames: 'chunk-[hash]',
  legalComments: 'eof'
});
