<script setup lang="ts">
import { ref } from 'vue';
import type { LngLat } from '@yandex/ymaps3-types/common/types';
import map from '@/stores/map';
import core from '@/stores/core';
import { YandexMapZoomVariants } from '@/enums/YandexMapZoomVariants';

const loading = ref(false);
const mapStorage = map();
const coreStorage = core();

const captureLocation = () => {
  loading.value = true;

  if (!Object.prototype.hasOwnProperty.call(window, 'ymaps3')) {
    loading.value = false;
    console.error('[CDEK] ymaps3 unavailable when tried to geolocate');
  }

  ymaps3.geolocation.getPosition({
    enableHighAccuracy: true,
    maximumAge: 60000,
  }).then((result) => {
    if (coreStorage.debug) {
      console.debug('[CDEK] ymaps3 geocoded', result);
    }

    mapStorage.location.center = result.coords as LngLat;
    mapStorage.location.zoom = YandexMapZoomVariants.STREET;
    mapStorage.geolocation = result.coords as LngLat;
  }).catch((e) => {
    console.error('[CDEK] ymaps3 geolocate error', e);
  }).finally(() => {
    loading.value = false;
  });
};
</script>

<template>
  <div class=":uno: text-text-primary cursor-pointer p-2" @click="captureLocation">
    <div v-if="loading" class=":uno: i-tabler-loader-2 animate-spin h-6 w-6" />
    <div v-else class=":uno: i-tabler-location h-6 w-6" />
  </div>
</template>
