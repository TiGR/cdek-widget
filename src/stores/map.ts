import { defineStore } from 'pinia';
import { computed, reactive, ref } from 'vue';
import { debounce } from 'lodash-es';
import type { LngLat } from '@yandex/ymaps3-types/common/types';
import type { DomEvent, DomEventHandlerObject } from '@yandex/ymaps3-types';
import config from '@/config';
import core from '@/stores/core';
import search from '@/stores/search';
import { OfficeType } from '@/enums/OfficeType';
import { DeliveryMode } from '@/enums/DeliveryMode';
import { Popup } from '@/enums/Popup';
import { YandexGeocoderKind } from '@/enums/YandexGeocoderKind';
import { YandexMapZoomVariants } from '@/enums/YandexMapZoomVariants';
import type { YandexMapErrorCode } from '@/enums/YandexMapErrorCode';
import type { iOffice } from '@/types/iOffice';
import type { iGeocoderMember } from '@/types/iGeocoder';

export default defineStore('map', () => {
  const coreStorage = core();
  const searchStorage = search();

  const mapLoadError = ref<YandexMapErrorCode | null>(null);
  // point clicked or found by search in the door delivery mode
  const exactPoint = ref<LngLat | null>(null);
  const exactOffice = ref<iOffice | null>(null);
  // geocoder info about exactPoint
  const pointInfo = ref<iGeocoderMember | null>(null);

  // set by the fixBounds option: offices and clicks outside are ignored
  const fixedBounds = ref<{ lower: number[]; upper: number[] } | null>(null);
  const fixedParams = ref<Record<YandexGeocoderKind.COUNTRY | YandexGeocoderKind.LOCALITY | YandexGeocoderKind.PROVINCE, string | null>>({
    [YandexGeocoderKind.COUNTRY]: null,
    [YandexGeocoderKind.LOCALITY]: null,
    [YandexGeocoderKind.PROVINCE]: null,
  });

  const location = reactive({
    center: config.map.defaultCenter as LngLat,
    zoom: config.map.defaultZoom,
    duration: config.map.defaultDuration,
  });

  const geolocation = ref<LngLat | null>(null);

  const offices = ref<iOffice[]>([]);

  const packageSuitedOffices = computed(
    () => offices.value.filter((office) => {
      if (fixedBounds.value !== null && (
        office.location[0] < fixedBounds.value.lower[0]
        || office.location[1] < fixedBounds.value.lower[1]
        || office.location[0] > fixedBounds.value.upper[0]
        || office.location[1] > fixedBounds.value.upper[1]
        || (fixedParams.value[YandexGeocoderKind.COUNTRY] !== null
          && office.country_code.toLowerCase() !== fixedParams.value[YandexGeocoderKind.COUNTRY])
        || (fixedParams.value[YandexGeocoderKind.LOCALITY] !== null
          && office.city.toLowerCase() !== fixedParams.value[YandexGeocoderKind.LOCALITY])
        || (fixedParams.value[YandexGeocoderKind.PROVINCE] !== null
          && office.region.toLowerCase() !== fixedParams.value[YandexGeocoderKind.PROVINCE])
      )) {
        return false;
      }

      if (coreStorage.params.goods.length < 1) return true;

      // postamats without known cell dimensions can't take any parcel
      if (office.type === OfficeType.PICKUP && (office.dimensions === null || office.dimensions.length < 1)) {
        return false;
      }

      // every parcel has to fit into the office
      return coreStorage.params.goods.filter((parcel) => {
        if (parcel.weight < office.weight_min || (office.weight_max > 0 && parcel.weight > office.weight_max)) {
          return false;
        }

        return office.type === OfficeType.OFFICE || office.dimensions!.filter((dimension) => {
          if (dimension.width * dimension.height * dimension.depth < parcel.height * parcel.width * parcel.length) {
            return false;
          }

          const sortedDimension = [dimension.width, dimension.height, dimension.depth].sort(
            (a, b) => (a > b ? 1 : a < b ? -1 : 0),
          );
          const sortedParcel = [parcel.width, parcel.height, parcel.length].sort(
            (a, b) => (a > b ? 1 : a < b ? -1 : 0),
          );

          return !(sortedParcel[0] > sortedDimension[0]
            || sortedParcel[1] > sortedDimension[1]
            || sortedParcel[2] > sortedDimension[2]);
        }).length > 0;
      }).length === coreStorage.params.goods.length;
    }),
  );

  // visible map area: left is the top-left corner, right is the bottom-right one
  const bounds = reactive({
    left: config.map.defaultCenter as LngLat,
    right: config.map.defaultCenter as LngLat,
  });

  const filteredOffices = computed(
    () => packageSuitedOffices.value.filter(
      (office) => office.location[0] <= bounds.right[0]
        && office.location[1] >= bounds.right[1]
        && office.location[0] >= bounds.left[0]
        && office.location[1] <= bounds.left[1],
    ),
  );

  const searchedOffices = computed(() => {
    if (searchStorage.value.length === 0) return [];

    const searchValue = searchStorage.value.toLowerCase();
    const result: iOffice[] = [];

    for (const office of filteredOffices.value) {
      if (office.code.toLowerCase().indexOf(searchValue) !== -1
        || office.name.toLowerCase().indexOf(searchValue) !== -1
        || office.address.toLowerCase().indexOf(searchValue) !== -1) {
        result.push(office);
      }
    }

    return result;
  });

  const debouncedUpdate = debounce((updateObject: { location: { bounds: LngLat[]; center: LngLat; zoom: number } }) => {
    const newBounds = updateObject.location.bounds;

    bounds.left = newBounds[0];
    bounds.right = newBounds[1];
    location.center = updateObject.location.center;
    location.zoom = updateObject.location.zoom;
    searchStorage.loading = false;
  }, 2000);

  // YandexMapListener onUpdate handler
  const update = (updateObject: { location: { bounds: LngLat[]; center: LngLat; zoom: number } }) => {
    searchStorage.loading = true;
    debouncedUpdate(updateObject);
  };

  // YandexMapListener onClick handler: selects a point for the door delivery
  const customClick = (_updateObject: DomEventHandlerObject, event: DomEvent) => {
    if (coreStorage.debug) {
      console.debug('[CDEK] Map clicked', event.coordinates);
    }

    if (coreStorage.params.hideDeliveryOptions[DeliveryMode.DOOR]) {
      if (coreStorage.debug) {
        console.debug('[CDEK] Door delivery disabled, doing nothing');
      }

      return;
    }

    if (fixedBounds.value !== null && (
      event.coordinates[0] < fixedBounds.value.lower[0]
      || event.coordinates[1] < fixedBounds.value.lower[1]
      || event.coordinates[0] > fixedBounds.value.upper[0]
      || event.coordinates[1] > fixedBounds.value.upper[1]
    )) {
      if (coreStorage.debug) {
        console.debug('[CDEK] User clicked outside of fixed bounds, doing nothing');
      }

      return;
    }

    searchStorage.loading = true;
    exactPoint.value = event.coordinates;

    if (coreStorage.debug) {
      console.debug('[CDEK] Switching delivery mode to door');
    }

    coreStorage.$patch({
      mode: DeliveryMode.DOOR,
      selectedTariff: null,
      selected: false,
    });

    if (!coreStorage.openedPopups[Popup.INFO]) coreStorage.togglePopup(Popup.INFO);

    location.center = event.coordinates;
    location.zoom = YandexMapZoomVariants.HOME;
    pointInfo.value = null;
  };

  return {
    pointInfo,
    customClick,
    exactPoint,
    exactOffice,
    searchedOffices,
    mapLoadError,
    location,
    offices,
    packageSuitedOffices,
    update,
    bounds,
    filteredOffices,
    fixedBounds,
    fixedParams,
    geolocation,
  };
});
