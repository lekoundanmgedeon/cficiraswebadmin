import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

/**
 * Les tests couvrent en priorité `src/core` et `src/shared` : c'est le code le
 * plus réutilisé (fabrique de store, client HTTP, cache, guards), donc celui
 * dont une régression casserait tous les modules à la fois.
 */
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.{test,spec}.js'],
  },
});
