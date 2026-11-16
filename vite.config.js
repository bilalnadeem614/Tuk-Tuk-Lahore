import { defineConfig } from 'vite';

export default defineConfig({
  // three.js alone is ~500 kB minified; that is expected, not a mistake.
  build: { chunkSizeWarningLimit: 900 },
});
