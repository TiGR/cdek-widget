# Extensions

This branch adds a small extension API on top of the upstream widget. Hooks get
plain public data only (`iOffice`, `iTariff`, ...), never the widget's stores, so
consumers don't depend on widget internals.

Version scheme: `<upstream version>-ext.<n>`, tagged as `v<version>` (e.g. `v4.1.0-ext.1`).
`dist/` is committed, so the package can be installed from a git tag.

## API

Pass `extensions` to the constructor:

```ts
import CDEKWidget, { type iExtensions } from '@cdek-it/widget';

const extensions: iExtensions = {
  // replaces the address + working hours block of the office sidebar
  officeDescription(el, { office }) {
    return `<p>${escape(office!.address)}</p><p>${escape(office!.work_time)}</p>`;
  },
  // tariff card price text, default `${delivery_sum} ${currency}`
  formatPrice: (tariff, { currency }) => (tariff.delivery_sum === 0 ? 'Бесплатно' : `${tariff.delivery_sum} ${currency}`),
  // rendered after the tariffs / select button
  officeFooter(el, ctx) {
    const app = createApp(FreeDeliveryInfo, { ctx });
    app.mount(el);
    return () => app.unmount();
  },
  // cluster marker click: 'zoom' (+2, max 19, centered), 'list' (open the office list) or nothing
  onClusterClick: ({ zoom, offices }) => (zoom >= 17 ? 'list' : 'zoom'),
};

new CDEKWidget({ /* ... */ extensions });
```

Render hooks (`officeDescription`, `officeFooter`):

- `(el: HTMLElement, ctx: iExtensionContext) => string | void | (() => void)`;
- a returned string is assigned to `el.innerHTML` as is (escape the data yourself);
- a returned function is called before the next run and on unmount / `destroy()`;
- they run again whenever the context changes (office, tariffs, selected tariff, ...);
  `el` is emptied before each run;
- they are not called while no office is selected (`el` is left empty);
- errors are caught and logged, the widget keeps working.

`iExtensionContext`: `{ mode, office, tariffs, selectedTariff, selected, lang, currency }`.
`office` keeps any extra fields passed through `offices` / `updateOffices()`.

Without a hook, the widget behaves exactly like upstream (cluster clicks are ignored).

## Styling hooks

Stable `data-part` attributes, use them instead of the compiled `cdek-xxxxxx` classes:

| `data-part`          | Element                                              |
|----------------------|------------------------------------------------------|
| `office-description` | `officeDescription` container (has `px-3 mb-1`)      |
| `office-footer`      | `officeFooter` container                             |
| `tariff-title`       | "Select tariff" title above the tariff cards         |
| `tariff`             | clickable tariff card                                |
| `tariff-check`       | check icon on the selected card                      |
| `tariff-name`        | tariff name                                          |
| `tariff-meta`        | period + price row                                   |
| `tariff-price`       | price (`formatPrice` output)                         |
| `select-button`      | "Select" button (no-tariff / sender mode)            |
| `cluster`            | cluster marker (gets `cursor: pointer` with `onClusterClick`) |

Widget styles use `!important`, so overrides need it too, e.g.
`#container [data-part="tariff-title"] { display: none !important; }`.

## Insertion points

All logic lives in `src/extensions/`. Upstream files only get small insertions,
each marked with `// @ext` or `<!-- @ext: ... -->` (`grep -rn '@ext' src`):

| File                                  | Change                                                                 |
|---------------------------------------|------------------------------------------------------------------------|
| `src/widget.ts`                       | import `extensionsKey`; `app.provide(extensionsKey, input.extensions)`; `export type *` of the extension types |
| `src/types/iWidget.ts`                | `extensions?: iExtensions`                                             |
| `src/components/OfficeExtendedInfo.vue` | `ExtensionHost` for `officeDescription` (`v-else` added to the original block) and `officeFooter` after `TariffInfo` |
| `src/components/TariffInfo.vue`       | price via `usePriceFormatter()`; `data-part` attributes                |
| `src/components/MapComponent.vue`     | `useClusterClick(map)`; cluster `data-part`, cursor and `@click`       |
| `package.json`, `package-lock.json`   | version suffix `-ext.<n>`                                              |

## Upgrading to a new upstream release

1. Port the release on the sources branch (see RESTORATION.md), then merge it into this branch.
2. Conflicts can only be at the insertion points above; re-apply them.
3. Check that the hooked markup still exists (the address block, the tariff card,
   the cluster slot props `coordinates` / `clusterer`) and `npm run build`.
4. Bump the version (`<upstream>-ext.1`), commit `dist/` and tag.
