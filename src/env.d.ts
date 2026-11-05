/// <reference types="vite/client" />
/// <reference types="vite-svg-loader" />
/// <reference types="@yandex/ymaps3-types" />

// package version, injected by vite.config.ts
declare const __VERSION__: string;

interface ImportMetaEnv {
  readonly VITE_DEFAULT_KEY?: string;
}
