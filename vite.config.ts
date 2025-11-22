import { defineConfig } from 'vite';

export default defineConfig({
  base: '/animi/', // Set to your repo name
  server: {
    port: 3000,
    open: true
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    outDir: 'dist'
  }
});
