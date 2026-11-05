import fs from 'node:fs';
import {
  defineConfig,
  presetIcons,
  presetUno,
  presetWebFonts,
  transformerCompileClass,
  transformerDirectives,
} from 'unocss';

export default defineConfig({
  theme: {
    colors: {
      brand: {
        primary: {
          main: 'rgba(26, 178, 72, 1)',
          active: 'rgba(21, 142, 58, 1)',
          5: 'rgba(26, 178, 72, 0.05)',
          10: 'rgba(26, 178, 72, 0.1)',
          20: 'rgba(26, 178, 72, 0.2)',
          70: 'rgba(26, 178, 72, 0.7)',
        },
        surface: {
          neutral: 'rgba(51, 85, 104, 0.05)',
        },
      },
      text: {
        primary: '#44403c',
        secondary: '#78716c',
      },
      // The original names of the colors below are not recoverable from the bundle
      base: {
        white: 'rgba(255, 255, 255, 1)',
        gray: 'rgba(98, 119, 144, 1)',
        black: {
          20: 'rgba(0, 0, 0, 0.2)',
          35: 'rgba(0, 0, 0, 0.35)',
          50: 'rgba(0, 0, 0, 0.5)',
          60: 'rgba(0, 0, 0, 0.6)',
        },
      },
    },
  },
  variants: [
    // the App root gets the "mobile" class when narrower than 555px
    (matcher) => {
      if (!matcher.startsWith('mobile:')) return matcher;

      return {
        matcher: matcher.slice(7),
        selector: (s) => `.mobile ${s}`,
      };
    },
  ],
  presets: [
    presetUno({ important: true }),
    presetIcons({
      scale: 1.2,
      collections: {
        cdek: {
          pickup: () => fs.readFileSync('./src/assets/pickup-icon.svg', 'utf-8'),
        },
      },
    }),
    presetWebFonts({
      fonts: {
        sans: 'Roboto',
        mono: ['Fira Code', 'Fira Mono:400,700'],
      },
    }),
  ],
  transformers: [
    transformerDirectives(),
    transformerCompileClass({ classPrefix: 'cdek-' }),
  ],
});
