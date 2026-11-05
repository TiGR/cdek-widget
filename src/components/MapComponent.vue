<script setup lang="ts">
import { computed, ref, shallowRef, toRaw, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { watchOnce } from '@vueuse/core';
import type { YMap } from '@yandex/ymaps3-types';
import type { LngLat } from '@yandex/ymaps3-types/common/types';
import {
  YandexMap,
  YandexMapClusterer,
  YandexMapControl,
  YandexMapControls,
  YandexMapDefaultFeaturesLayer,
  YandexMapDefaultSchemeLayer,
  YandexMapListener,
  YandexMapMarker,
} from 'vue-yandex-maps';
import config from '@/config';
// imported under another name: the template ref below is called "map"
import mapStore from '@/stores/map';
import core from '@/stores/core';
import { Popup } from '@/enums/Popup';
import { OfficeType } from '@/enums/OfficeType';
import { DeliveryMode } from '@/enums/DeliveryMode';
import type { iOffice } from '@/types/iOffice';
import LogoIcon from '@/assets/logo.svg?component';
import OfficeIcon from '@/assets/office.svg?component';
import PickupIcon from '@/assets/pickup.svg?component';
import DoorIcon from '@/assets/door.svg?component';
import SegmentedControl from '@/components/SegmentedControl.vue';
import MenuComponent from '@/components/MenuComponent.vue';
import DoorExtendedInfo from '@/components/DoorExtendedInfo.vue';
import OfficeExtendedInfo from '@/components/OfficeExtendedInfo.vue';
import SearchComponent from '@/components/SearchComponent.vue';
import SupportComponent from '@/components/SupportComponent.vue';
import FilterComponent from '@/components/FilterComponent.vue';
import PostcodeRequestModal from '@/components/PostcodeRequestModal.vue';
import GeolocationComponent from '@/components/GeolocationComponent.vue';
import ZoomComponent from '@/components/ZoomComponent.vue';
// @ext
import { useClusterClick } from '@/extensions';

const mapStorage = mapStore();
const coreStorage = core();
const { t } = useI18n();

const location = ref(mapStorage.location);
const root = ref();
const map = shallowRef<YMap | null>(null);
// @ext
const clusterClick = useClusterClick(map);

// the map takes a new location only when the settings object changes
watch(mapStorage.location, () => (location.value = { ...mapStorage.location }));

const availableModels = computed(
  () => [
    {
      label: t(coreStorage.params.sender ? 'from.office' : 'to.office'),
      value: DeliveryMode.OFFICE,
    },
    {
      label: t(coreStorage.params.sender ? 'from.door' : 'to.door'),
      value: DeliveryMode.DOOR,
    },
  ].filter(
    (e) => !coreStorage.params.hideDeliveryOptions[e.value],
  ),
);

const updateMode = (mode: DeliveryMode) => {
  if (coreStorage.debug) console.debug('[CDEK] changed delivery mode via selector');

  coreStorage.$patch({ mode, selectedTariff: null, selected: false });
};

const selectOffice = (exactOffice: iOffice) => {
  if (coreStorage.debug) console.debug('[CDEK] Switching delivery mode to office');

  coreStorage.$patch({
    mode: DeliveryMode.OFFICE,
    selectedTariff: null,
    selected: false,
  });

  if (coreStorage.debug) {
    console.debug('[CDEK] Selected office from map', toRaw(exactOffice));
  }

  mapStorage.$patch({
    exactOffice,
    location: {
      ...mapStorage.location,
      center: exactOffice.location,
      zoom: 17,
    },
  });

  if (!coreStorage.openedPopups[Popup.INFO]) coreStorage.togglePopup(Popup.INFO);
};

// initial bounds, before the first YandexMapListener update
watchOnce(map, () => {
  mapStorage.bounds.left = map.value?.bounds[0] as LngLat;
  mapStorage.bounds.right = map.value?.bounds[1] as LngLat;
});

const showControl = computed(
  () => coreStorage.uiLoadLocksCounter < 1
    && !coreStorage.params.hideDeliveryOptions[DeliveryMode.OFFICE]
    && !coreStorage.params.hideDeliveryOptions[DeliveryMode.DOOR],
);
</script>

<template>
  <SegmentedControl
    v-if="showControl"
    :items="availableModels"
    :model-value="coreStorage.mode"
    class=":uno: mb-3"
    @update:model-value="updateMode($event)"
  />
  <div
    ref="root"
    :class="{
      'opened-menu': coreStorage.openedPopups[Popup.MENU]
        || (coreStorage.openedPopups[Popup.INFO] && (mapStorage.pointInfo || mapStorage.exactOffice)),
      ':uno: h-[calc(100%-3.375rem)]': showControl,
      ':uno: h-full': !showControl,
    }"
    class=":uno: border-stone-200 border-1 rounded-lg border-solid overflow-clip relative h-[calc(100%-3.375rem)] w-full"
  >
    <YandexMap v-model="map" :settings="{ location, copyrightsPosition: 'bottom left' }">
      <YandexMapListener :settings="{ onUpdate: mapStorage.update, onClick: mapStorage.customClick }" />
      <YandexMapDefaultSchemeLayer />
      <YandexMapDefaultFeaturesLayer />

      <YandexMapControls :settings="{ position: 'bottom right', orientation: 'vertical' }">
        <YandexMapControl>
          <ZoomComponent />
        </YandexMapControl>
        <YandexMapControl>
          <GeolocationComponent />
        </YandexMapControl>
      </YandexMapControls>

      <YandexMapControls :settings="{ position: 'top left', orientation: 'horizontal' }">
        <YandexMapControl>
          <SearchComponent />
        </YandexMapControl>
        <YandexMapControl
          v-if="!coreStorage.params.hideFilters.have_cashless
            || !coreStorage.params.hideFilters.have_cash
            || !coreStorage.params.hideFilters.is_dressing_room
            || !coreStorage.params.hideFilters.type"
          @click="coreStorage.togglePopup(Popup.FILTERS)"
        >
          <span class=":uno: i-tabler-filter text-text-primary cursor-pointer block h-6 w-6 m-2" />
        </YandexMapControl>
        <YandexMapControl v-if="coreStorage.openedPopups[Popup.FILTERS]">
          <FilterComponent class=":uno: m-2" />
        </YandexMapControl>
      </YandexMapControls>

      <YandexMapControls :settings="{ position: 'bottom left', orientation: 'vertical' }">
        <YandexMapControl>
          <SupportComponent class=":uno: m-2" />
        </YandexMapControl>
      </YandexMapControls>

      <YandexMapControls
        v-if="coreStorage.mode === DeliveryMode.OFFICE"
        :settings="{ position: 'top right', orientation: 'horizontal' }"
      >
        <YandexMapControl v-if="!coreStorage.openedPopups[Popup.MENU]" @click="coreStorage.togglePopup(Popup.MENU)">
          <span class=":uno: i-tabler-indent-decrease text-text-primary cursor-pointer block h-6 w-6 m-2" />
        </YandexMapControl>
      </YandexMapControls>

      <YandexMapClusterer v-if="coreStorage.mode === DeliveryMode.OFFICE" :grid-size="64">
        <YandexMapMarker
          v-for="office in mapStorage.packageSuitedOffices"
          :key="office.code"
          :settings="{ coordinates: office.location, hideOutsideViewport: true }"
        >
          <OfficeIcon v-if="office.type === OfficeType.OFFICE" class=":uno: cursor-pointer max-w-none [transform:translate(-50%,calc(-50%-13px))]" @click.stop.prevent="selectOffice(office)" />
          <PickupIcon v-else class=":uno: cursor-pointer max-w-none [transform:translate(-50%,calc(-50%-13px))]" @click.stop.prevent="selectOffice(office)" />
        </YandexMapMarker>

        <!-- @ext: onClusterClick -->
        <template #cluster="{ length, coordinates, clusterer }">
          <div
            data-part="cluster"
            :style="clusterClick.enabled ? { cursor: 'pointer' } : undefined"
            :class="{
              ':uno: px-2': length < 10,
              ':uno: px-1': length >= 10,
              ':uno: py-2.5': length > 999 && length < 10000,
              ':uno: py-1.5': length > 99 && length < 1000,
              ':uno: py-0.5': length < 100,
            }"
            class=":uno: bg-white border-brand-primary-active border-2 rounded-full text-text-primary font-sans text-sm"
            @click="clusterClick.onClick($event, coordinates, clusterer.features)"
          >
            {{ length }}
          </div>
        </template>
      </YandexMapClusterer>

      <YandexMapMarker
        v-if="mapStorage.exactPoint !== null && coreStorage.mode === DeliveryMode.DOOR"
        :settings="{ coordinates: toRaw(mapStorage.exactPoint) }"
      >
        <DoorIcon class=":uno: cursor-pointer max-w-none [transform:translate(-50%,calc(-50%-13px))]" />
      </YandexMapMarker>

      <YandexMapMarker v-if="mapStorage.geolocation !== null" :settings="{ coordinates: toRaw(mapStorage.geolocation) }">
        <div class=":uno: shadow bg-base-gray border-base-white border-2 rounded-full [transform:translate(-50%,calc(-50%-4px))] size-3.5" />
      </YandexMapMarker>
    </YandexMap>

    <MenuComponent v-if="coreStorage.mode === DeliveryMode.OFFICE" />
    <DoorExtendedInfo />
    <OfficeExtendedInfo />
    <PostcodeRequestModal
      v-if="coreStorage.mode === DeliveryMode.DOOR
        && coreStorage.params.requirePostcode
        && mapStorage.pointInfo !== null
        && mapStorage.pointInfo.postal_code === null
        && (coreStorage.selected || coreStorage.selectedTariff !== null)"
    />

    <a :href="config.promo.url" class=":uno: bottom-2.5 absolute right-2.5" target="_blank">
      <LogoIcon class=":uno: mt-1" />
    </a>
  </div>
</template>

<style scoped>
.opened-menu :deep(.ymaps3x0--controls_bottom.ymaps3x0--controls_right.ymaps3x0--controls_vertical) {
  @apply right-72;
}

:deep(.ymaps3x0--controls_bottom.ymaps3x0--controls_vertical) {
  @apply mb-8 transition-all;
}

:deep(.ymaps3x0--main-engine-container) {
  @apply grayscale;
}
</style>

<i18n lang="json">
{
  "eng": {
    "to": {
      "office": "Deliver to office",
      "door": "Delivery to door"
    },
    "from": {
      "office": "Deliver from office",
      "door": "Delivery from door"
    }
  },
  "rus": {
    "to": {
      "office": "Доставить в пункт выдачи",
      "door": "Доставить до двери"
    },
    "from": {
      "office": "Доставить от пункта выдачи",
      "door": "Доставить от двери"
    }
  }
}
</i18n>
