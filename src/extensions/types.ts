import type { LngLat, LngLatBounds } from '@yandex/ymaps3-types/common/types';
import type { Lang } from '@/enums/Lang';
import type { DeliveryMode } from '@/enums/DeliveryMode';
import type { iOffice } from '@/types/iOffice';
import type { iTariff } from '@/types/iTariff';

/**
 * Plain (non-reactive) snapshot of what the sidebar shows. Hooks get a new
 * object every time any of these values changes. Do not mutate it.
 */
export interface iExtensionContext {
  mode: DeliveryMode;
  /** The selected office in office mode, null in door mode or when nothing is selected. Extra fields passed via `offices`/`updateOffices()` are kept. */
  office: iOffice | null;
  /** Tariffs shown for the current target. */
  tariffs: iTariff[];
  selectedTariff: iTariff | null;
  /** True after the user pressed the select button (no-tariff mode). */
  selected: boolean;
  lang: Lang;
  currency: string;
}

/**
 * Renders into `el`, which belongs to the hook (the widget never touches its content
 * except for clearing it). Return an HTML string to have it assigned to `el.innerHTML`
 * (it is not sanitized), or a cleanup function that is called before the next run and
 * on unmount/destroy().
 */
export type tRenderHook = (el: HTMLElement, context: iExtensionContext) => string | void | (() => void);

export interface iClusterContext {
  /** Current map zoom, read from the map itself (the store value is debounced). */
  zoom: number;
  /** Current map bounds: [top-left, bottom-right]. */
  bounds: LngLatBounds;
  /** Cluster position. */
  coordinates: LngLat;
  /** Offices inside the cluster. */
  offices: iOffice[];
}

/** 'zoom' - zoom in by 2 levels (max 19) centered on the cluster, 'list' - open the office list, nothing - do nothing. */
export type tClusterAction = 'zoom' | 'list' | void;

export interface iExtensions {
  /** Replaces the address and working hours block of the office sidebar. */
  officeDescription?: tRenderHook;
  /** Rendered in the office sidebar after the tariffs / select button. */
  officeFooter?: tRenderHook;
  /** Price text of a tariff card. Default: `${delivery_sum} ${currency}`. */
  formatPrice?: (tariff: iTariff, context: iExtensionContext) => string;
  /** Called on a cluster marker click. Without it, cluster clicks are ignored (upstream behavior). */
  onClusterClick?: (context: iClusterContext) => tClusterAction;
}
