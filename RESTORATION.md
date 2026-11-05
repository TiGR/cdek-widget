# Restored sources of @cdek-it/widget 3.11.1

Recovered from `dist/cdek-widget.es.js` (the unminified ES build), not from the original repository.

```sh
npm ci
npm run build   # vue-tsc + vite build -> dist/
```

## How close it is

Rebuilt with the pinned toolchain, the output matches the published 3.11.1 bundle:

- every top-level declaration of the bundle (app code and libraries) is present under the same name;
- 97% of the original application code lines appear verbatim in the rebuild; the rest differs only in
  source line breaks (esbuild keeps them), hoisted constant numbering and the classes listed below;
- all `[CDEK] …` log messages are identical;
- 110 of 127 compiled `cdek-xxxxxx` class names come out byte-identical, i.e. their UnoCSS token lists
  are proven by the hash `transformerCompileClass` produces.

Variable names are the original ones wherever the bundle kept them (Rollup preserves top-level and most
local names in ES output); renamed duplicates (`map$1`, `update2`, `emit2`, …) were restored to the source
names they were generated from.

## What is not exact

- **17 class lists are best-effort** (`cdek-` hashes differ, the CSS is equivalent): hmeecb, b9aure,
  j30l3x, cpsdxs, 2dpwd5, 4ra8ok, yy00r7, lomc4o, 69tgzw, vvik0h, 6pvvrh, k4y6mp, q4k1hq, tcpfkz, esea3r,
  koxl8j, mfqq2r. Most of them use theme colors whose original names could not be brute-forced.
- **Theme color names** in `uno.config.ts`: `brand.primary.*` (main, active, 5, 10, 20, 70),
  `brand.surface.neutral` and `text.primary/secondary` are confirmed by hashes. `base.*` names are invented.
- **`i-cdek-pickup`** (the pickup-point filter icon) is a guess at how the custom background icon was
  declared; the SVG itself is exact (`src/assets/pickup-icon.svg`).
- **Scope ids** (`data-v-…`) differ: Vue derives them from file paths of the original checkout.

## Things found along the way (present in the original 3.11.1)

- `pluralizationRules` in `src/i18n.ts` is ignored: vue-i18n 9 in composition mode reads `pluralRules`, so
  the Russian plural rule never applies (current Rollup even tree-shakes the property away, hence the
  `rollup` override in package.json to keep the build faithful).
- `cursor-pinter` typo in `CdekButton.vue` (the button has no pointer cursor).
- The build embedded the whole `import.meta.env`, including a `VITE_TOKEN` (a sandbox CMS token); 3.12.0
  removed it.

## Upstream releases ported after 3.11.1

Each release is a merge of the upstream tag (its `dist/`, `service.php`, docs) plus the matching `src/` changes.
Checked by comparing the change between our builds with the change between the published bundles
(`data-v-…` scope ids normalized).

- **3.11.2**: `service.php` only.
- **3.12.0**: offices loaded by the visible map area (`action=byCoordinate`, `map.polygonBounds`) when no
  `offices`/`officesRaw` are passed; bounds filter works with any corner order; map update debounce 2s → 0.5s;
  init rewritten as one async `initializeLocationAndOffices()`. The Yandex fallback key now comes from `.env`
  (`VITE_DEFAULT_KEY`). Delta matches the published one except the "Widget … has been loaded" log: the
  published 3.12.0 still says 3.11.1 (version not bumped upstream).
- **3.12.1**: `service.php` only.
- **4.0.0**: `X-Service-Version` check on every service response (`CdekApi.ensureCompatibleServiceVersion`):
  a different major version sets `mapLoadError = SERVICE_VERSION_MISMATCH` and `map.serviceVersion`, and
  `ErrorScreen` asks to update the widget or the service. A missing header is accepted. Delta matches the
  published one; the only extra noise is module order (the `YandexMapErrorCode` enum is emitted elsewhere,
  since our import graph already differs from the original one, see the 3.11.1 notes).
- **4.1.0**: one Pinia per widget instance (`createPinia()` in the constructor, passed to the API classes
  through `AbstractApi`; the shared `src/stores/index.ts` is gone), and a real `destroy()`: watchers,
  subscriptions and debounces created in `init()` are collected in `disposers`, `isDestroyed` stops async
  callbacks, pending requests are cancelled and the stores disposed. Store-to-price/geocoder reactions moved
  from `$subscribe` mutation-type checks to `watch()` on `exactOffice`/`pointInfo`/`exactPoint`.
  `vue-yandex-maps` 2.1.2 → 2.3.3 (identified from the bundled code), which also needs
  `@yandex/ymaps3-types` 1.x and fixes the `vue-tsc` errors caused by two copies of those types.
  Every top-level declaration that matched the published 4.0.0 still matches; `Widget` and `CdekApi` differ
  only by the comments listed above and the "has been loaded" log (a template literal here, a plain string
  upstream). `cdek-widget.es.d.ts` is byte-identical to the published one.

Building with `vite build --outDir <elsewhere>` gives stale typings (the dts rollup ignores the override);
use plain `npm run build`.

**CSS reset (fixed after 4.1.0).** The restored `uno.config.ts` had lost the Tailwind reset
(`@unocss/reset/tailwind.css`) that upstream adds as a preflight, so every build from these sources lacked the
per-component reset (`p[data-v-…]{margin:0}`, borders, line-height, …) and host-page styles leaked into the
widget. It is now a small preset placed before `presetUno`, which reproduces the published order. Compared
with the published 4.1.0 bundle after normalising (scope ids, declaration order, quoting), the reset and
variable rules match; the only differences are minifier output (`transparent` vs `rgb(0 0 0 / 0)`, an
`-o-tab-size` prefix, merged selectors). JS declaration comparisons don't cover CSS: compare the injected
stylesheet too.
