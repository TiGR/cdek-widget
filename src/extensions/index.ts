import { computed, inject, toRaw, type InjectionKey, type Ref } from 'vue';
import type { YMap } from '@yandex/ymaps3-types';
import type { LngLat } from '@yandex/ymaps3-types/common/types';
import core from '@/stores/core';
import map from '@/stores/map';
import { Popup } from '@/enums/Popup';
import { OfficeType } from '@/enums/OfficeType';
import { DeliveryMode } from '@/enums/DeliveryMode';
import type { iTariff } from '@/types/iTariff';
import type { iExtensionContext, iExtensions } from '@/extensions/types';

export type * from '@/extensions/types';

export const extensionsKey: InjectionKey<iExtensions> = Symbol('cdek-extensions');

export const useExtensions = (): iExtensions => inject(extensionsKey, {});

export const useExtensionContext = () => {
  const coreStorage = core();
  const mapStorage = map();

  return computed<iExtensionContext>(() => {
    const office = coreStorage.mode === DeliveryMode.OFFICE ? mapStorage.exactOffice : null;
    let tariffs: iTariff[] = [];

    if (coreStorage.mode === DeliveryMode.DOOR) {
      tariffs = coreStorage.tariffs.door;
    } else if (office) {
      tariffs = office.type === OfficeType.OFFICE ? coreStorage.tariffs.office : coreStorage.tariffs.pickup;
    }

    return {
      mode: coreStorage.mode,
      office: office ? toRaw(office) : null,
      tariffs: tariffs.map((tariff) => toRaw(tariff)),
      selectedTariff: coreStorage.selectedTariff ? toRaw(coreStorage.selectedTariff) : null,
      selected: coreStorage.selected,
      lang: coreStorage.params.lang,
      currency: coreStorage.params.currency,
    };
  });
};

export const usePriceFormatter = () => {
  const { formatPrice } = useExtensions();
  const context = useExtensionContext();

  return (tariff: iTariff) => (formatPrice
    ? formatPrice(toRaw(tariff), context.value)
    : `${tariff.delivery_sum} ${context.value.currency}`);
};

const MAX_ZOOM = 19;

export const useClusterClick = (ymap: Ref<YMap | null>) => {
  const { onClusterClick } = useExtensions();
  const coreStorage = core();
  const mapStorage = map();

  const onClick = (event: Event, coordinates: LngLat, features: Array<{ geometry: { coordinates: LngLat } }>) => {
    if (!onClusterClick || !ymap.value) return;

    // keep the map click listener from treating it as a door-delivery click
    event.stopPropagation();

    const points = new Set(features.map((f) => f.geometry.coordinates.join(',')));
    const zoom = ymap.value.zoom;
    const bounds = ymap.value.bounds;

    const action = onClusterClick({
      zoom,
      bounds,
      coordinates,
      offices: mapStorage.packageSuitedOffices
        .filter((office) => points.has(office.location.join(',')))
        .map((office) => toRaw(office)),
    });

    if (coreStorage.debug) console.debug('[CDEK] Cluster click', action);

    if (action === 'zoom') {
      mapStorage.$patch({
        location: { ...mapStorage.location, center: coordinates, zoom: Math.min(zoom + 2, MAX_ZOOM) },
      });
    } else if (action === 'list') {
      // the store bounds are debounced; the list must show what is on the screen right now
      mapStorage.$patch({ exactOffice: null, bounds: { left: bounds[0], right: bounds[1] } });

      if (!coreStorage.openedPopups[Popup.MENU]) {
        coreStorage.closePopups();
        coreStorage.togglePopup(Popup.MENU);
      }
    }
  };

  return { enabled: !!onClusterClick, onClick };
};
