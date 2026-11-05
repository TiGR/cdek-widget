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
