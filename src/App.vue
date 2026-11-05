<script setup lang="ts">
import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useResizeObserver } from '@vueuse/core';
import core from '@/stores/core';
import map from '@/stores/map';
import LoaderComponent from '@/components/MapLoader.vue';
import MapComponent from '@/components/MapComponent.vue';
import ErrorMessageComponent from '@/components/ErrorScreen.vue';

const coreStorage = core();
const mapStorage = storeToRefs(map());

const el = ref(null);
const width = ref(800);

useResizeObserver(el, (entries) => (width.value = entries[0].contentRect.width));
</script>

<template>
  <div ref="el" :class="{ mobile: width < 555 }" class=":uno: font-sans relative h-full w-full">
    <LoaderComponent v-if="coreStorage.uiLoadLocksCounter > 0" />
    <!-- storeToRefs() refs are not unwrapped here, hence .value -->
    <MapComponent v-if="mapStorage.mapLoadError.value === null" />
    <ErrorMessageComponent v-else />
  </div>
</template>
