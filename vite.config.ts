import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import UnoCSS from 'unocss/vite';
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite';
import svgLoader from 'vite-svg-loader';
import dts from 'vite-plugin-dts';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';
import { version } from './package.json';

export default defineConfig({
  plugins: [
    vue(),
    UnoCSS({ mode: 'vue-scoped' }),
    // the full vue-i18n build is bundled, SFC <i18n> blocks are still precompiled
    VueI18nPlugin({ runtimeOnly: false }),
    svgLoader({ svgo: false }),
    cssInjectedByJsPlugin(),
    dts({ rollupTypes: true }),
  ],
  define: {
    __VERSION__: JSON.stringify(version),
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    // vite skips terser for ES lib output, so only the UMD bundle gets minified
    minify: 'terser',
    lib: {
      entry: fileURLToPath(new URL('./src/widget.ts', import.meta.url)),
      name: 'CDEKWidget',
      fileName: (format) => `cdek-widget.${format}.js`,
      formats: ['es', 'umd'],
    },
  },
});
