/// <reference types="vite/client" />
/// <reference types="vite-svg-loader" />
/// <reference types="@yandex/ymaps3-types" />

// package version, injected by vite.config.ts
declare const __VERSION__: string;

// VITE_DEFAULT_KEY (.env) is deliberately not declared: like upstream it stays `any`, which shows up in the
// published typings as `apiKey: any`
