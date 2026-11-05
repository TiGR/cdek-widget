<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import PerfectScrollbar from 'perfect-scrollbar';
import type { LngLat } from '@yandex/ymaps3-types/common/types';
import map from '@/stores/map';
import core from '@/stores/core';
import search from '@/stores/search';
import { Popup } from '@/enums/Popup';
import { DeliveryMode } from '@/enums/DeliveryMode';
import { YandexGeocoderKind } from '@/enums/YandexGeocoderKind';
import { YandexGeocoderPrecision } from '@/enums/YandexGeocoderPrecision';
import { YandexMapZoomVariants } from '@/enums/YandexMapZoomVariants';
import type { iGeocoderMember } from '@/types/iGeocoder';
import type { iOffice } from '@/types/iOffice';

const mapStorage = map();
const coreStorage = core();
const searchStorage = search();
const { t } = useI18n();

const scrollableSearch = ref<HTMLElement>();

onMounted(() => nextTick(() => {
  if (coreStorage.debug) console.debug('[CDEK] Initializing Search Prefect Scrollbar');

  new PerfectScrollbar(scrollableSearch.value!);
}));

const searchInput = ref<HTMLInputElement>();

const openSearchField = () => {
  searchStorage.$patch({ showSearchField: true });
  searchInput.value!.focus();
};

const clearSearch = () => {
  searchStorage.$patch({ value: '' });
  searchStorage.$patch({ showSearchField: false });
};

const changeLocation = (location: { center: LngLat; zoom: number }) => {
  clearSearch();
  mapStorage.$patch({ location });
};

const selectSearchPoint = (point: iGeocoderMember) => {
  let zoom = YandexMapZoomVariants.GENERAL;

  if (coreStorage.params.hideDeliveryOptions[DeliveryMode.DOOR]) {
    if ([YandexGeocoderKind.ENTRANCE, YandexGeocoderKind.HOUSE, YandexGeocoderKind.STREET].indexOf(point.kind) !== -1) {
      zoom = YandexMapZoomVariants.STREET;
    }
  } else {
    switch (point.kind) {
      case YandexGeocoderKind.ENTRANCE:
      case YandexGeocoderKind.HOUSE:
        zoom = YandexMapZoomVariants.HOME;
        break;
      case YandexGeocoderKind.STREET:
        zoom = YandexMapZoomVariants.STREET;
        break;
    }
  }

  changeLocation({ center: point.position as LngLat, zoom });

  if (coreStorage.debug) console.debug('[CDEK] Selected geopoint from search', point);

  // an exact address selects the door delivery to it
  if ((point.kind === YandexGeocoderKind.ENTRANCE
      || point.kind === YandexGeocoderKind.HOUSE
      || point.precision === YandexGeocoderPrecision.EXACT
      || point.precision === YandexGeocoderPrecision.NUMBER)
    && !coreStorage.params.hideDeliveryOptions[DeliveryMode.DOOR]) {
    if (coreStorage.debug) console.debug('[CDEK] Switching delivery mode to door');

    coreStorage.$patch({ mode: DeliveryMode.DOOR, selectedTariff: null, selected: false });
    mapStorage.$patch({ pointInfo: point, exactPoint: point.position as LngLat });
    coreStorage.togglePopup(Popup.INFO);
  }
};

const selectOffice = (point: iOffice) => {
  if (coreStorage.debug) console.debug('[CDEK] Selected office from search', point);
  if (coreStorage.debug) console.debug('[CDEK] Switching delivery mode to office');

  changeLocation({ center: point.location, zoom: YandexMapZoomVariants.HOME });
  coreStorage.$patch({ mode: DeliveryMode.OFFICE, selectedTariff: null, selected: false });
  coreStorage.closePopups();
  mapStorage.$patch({ exactOffice: point });
  coreStorage.togglePopup(Popup.INFO);
};
</script>

<template>
  <div :class="{ ':uno: mobile:w-10': !searchStorage.showSearchField }" class=":uno: text-text-primary flex font-sans text-base gap-2 relative w-64 p-2">
    <div @click="openSearchField">
      <div v-if="searchStorage.loading" class=":uno: i-tabler-loader-2 animate-spin h-6 w-6" />
      <div v-else class=":uno: i-tabler-search h-6 w-6" />
    </div>
    <div :class="{ ':uno: mobile:hidden': !searchStorage.showSearchField }" class=":uno: block w-full">
      <input
        ref="searchInput"
        :placeholder="t(coreStorage.mode === DeliveryMode.OFFICE ? 'title.office' : 'title.door')"
        :title="t(coreStorage.mode === DeliveryMode.OFFICE ? 'title.office' : 'title.door')"
        :value="searchStorage.value"
        class=":uno: shadow-none border-0 leading-6 min-h-[-moz-min-content] min-h-min outline-none w-44 caret-brand-primary-main"
        type="text"
        @input="searchStorage.$patch({ value: ($event.target as HTMLInputElement).value })"
      >
    </div>
    <div
      :class="{
        ':uno: hidden': !searchStorage.value,
        ':uno: mobile:hidden': !searchStorage.showSearchField,
        ':uno: mobile:block': searchStorage.showSearchField,
      }"
    >
      <a :title="t('clear')" class=":uno: i-tabler-square-rounded-x block h-6 w-6" @click="clearSearch" />
    </div>
  </div>
  <div ref="scrollableSearch" :class="{ ':uno: hidden': !searchStorage.value }" class=":uno: shadow-md bg-white rounded-md font-sans text-xs left-3 max-h-72 overflow-hidden absolute top-15 whitespace-normal w-64 z-50 p-2">
    <div v-if="searchStorage.loading">{{ t('loading') }}</div>
    <div
      v-else-if="searchStorage.searchResults.length === 0
        && (coreStorage.params.hideDeliveryOptions[DeliveryMode.OFFICE] || mapStorage.searchedOffices.length === 0)"
    >
      {{ t('notFound') }}
    </div>
    <div
      v-for="(result, key) in searchStorage.searchResults"
      :key="key"
      class=":uno: border-t-2 cursor-pointer mt-1 first:border-t-0 first:mt-0"
      @click="selectSearchPoint(result)"
    >
      <span
        v-if="([YandexGeocoderKind.HOUSE, YandexGeocoderKind.ENTRANCE].indexOf(result.kind) !== -1
          || [YandexGeocoderPrecision.EXACT, YandexGeocoderPrecision.NUMBER].indexOf(result.precision) !== -1)
          && !coreStorage.params.hideDeliveryOptions[DeliveryMode.DOOR]"
        class=":uno: items-center text-text-secondary flex gap-1 py-1"
      >
        <span class=":uno: i-tabler-door-enter h-4 w-4" />
        <span>{{ t('door') }}</span>
      </span>
      <span v-else class=":uno: items-center text-text-secondary flex gap-1 py-1">
        <span class=":uno: i-tabler-map-2 h-4 w-4" />
        <span>{{ t('region') }}</span>
      </span>
      <span>{{ result.formatted }}</span>
    </div>
    <template v-if="!coreStorage.params.hideDeliveryOptions[DeliveryMode.OFFICE]">
      <div
        v-for="office in mapStorage.searchedOffices"
        :key="office.code"
        class=":uno: border-t-2 cursor-pointer mt-1 first:border-t-0 first:mt-0"
        @click="selectOffice(office)"
      >
        <span class=":uno: items-center text-text-secondary flex gap-1 py-1">
          <span class=":uno: i-tabler-building-skyscraper h-4 w-4" />
          <span>{{ t('office') }}</span>
        </span>
        <span>{{ office.code }} - {{ office.name }}</span>
      </div>
    </template>
  </div>
</template>

<i18n lang="json">
{
  "eng": {
    "clear": "Clear",
    "notFound": "Nothing found",
    "loading": "Searching...",
    "office": "CDEK Office",
    "region": "Region at the map",
    "door": "Delivery address",
    "title": {
      "door": "Delivery address",
      "office": "Search"
    }
  },
  "rus": {
    "title": {
      "door": "Поиск адреса",
      "office": "Поиск"
    },
    "clear": "Очистить",
    "notFound": "Ничего не найдено",
    "loading": "Выполняется поиск...",
    "office": "Пункт СДЭК",
    "region": "Область на карте",
    "door": "Адрес доставки"
  }
}
</i18n>
