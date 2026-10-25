import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `npm run build`         -> normal multi-file build (GitHub Pages / any static host)
// `npm run build:single`  -> one self-contained index.html (easy to share / embed)
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [react(), ...(mode === 'single' ? [viteSingleFile()] : [])],
  // pdf.js + its worker are big but only load when someone uploads a PDF
  build: { outDir: mode === 'single' ? 'dist-single' : 'dist', chunkSizeWarningLimit: 2000 },
  test: { environment: 'node' },
}));
