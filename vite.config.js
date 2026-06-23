import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';
import Components from 'unplugin-vue-components/vite';
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isIsoprod = env.VITE_ENV === 'isoprod';

  return {
    base: env.VITE_BASE_URL || '/',

    plugins: [
      vue(),
      Components({
        resolvers: [
          AntDesignVueResolver({
            importStyle: false, // css in js
          }),
        ],
      }),
    ],

    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
        '@assets': fileURLToPath(new URL('./src/assets', import.meta.url)),
      },
    },

    build: {
      target: 'es2020',
      outDir: 'dist',
      assetsDir: 'assets',
      // Sourcemaps en isoprod uniquement (utile pour debug demo, retiré en prod
      // pour ne pas exposer le code lisible et économiser le bundle).
      sourcemap: isIsoprod ? 'hidden' : false,
      minify: 'esbuild',
      cssCodeSplit: true,
      chunkSizeWarningLimit: 1500,
      reportCompressedSize: false, // build plus rapide sur Render
      rollupOptions: {
        output: {
          // Code-splitting manuel des grosses libs pour de meilleurs caches.
          manualChunks: {
            'vendor-vue': ['vue', 'vue-router', 'pinia'],
            'vendor-antd': ['ant-design-vue'],
            'vendor-charts': ['chart.js', 'echarts', 'vue-echarts'],
            'vendor-pdf': ['jspdf', 'jspdf-autotable', 'pdfmake', 'html2pdf.js', 'html2canvas'],
            'vendor-xlsx': ['xlsx', 'papaparse', 'file-saver'],
          },
        },
      },
    },

    server: {
      port: 5173,
      strictPort: false,
    },

    preview: {
      port: 4173,
      strictPort: false,
    },
  };
});
