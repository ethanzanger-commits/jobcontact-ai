import { build } from 'esbuild';
import { cpSync, mkdirSync, rmSync } from 'node:fs';
rmSync('dist', { recursive: true, force: true });
mkdirSync('dist', { recursive: true });
await build({ entryPoints: ['src/popup.tsx'], bundle: true, minify: true, outdir: 'dist', jsx: 'automatic', target: 'chrome110', define: { 'process.env.NODE_ENV': '"production"' }, logLevel: 'info' });
cpSync('public', 'dist', { recursive: true });
