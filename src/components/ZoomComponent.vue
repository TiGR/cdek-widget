<script setup lang="ts">
import map from '@/stores/map';
import core from '@/stores/core';

const mapStorage = map();
const coreStorage = core();

const changeZoom = (value: number) => {
  if (coreStorage.debug) {
    console.debug('[CDEK] Changing zoom', mapStorage.location.zoom, value);
  }

  mapStorage.location.zoom += value;
};
</script>

<template>
  <div class=":uno: text-text-primary cursor-pointer p-2" @click="changeZoom(1)">
    <div class=":uno: i-tabler-plus h-6 w-6" />
  </div>
  <div class=":uno: text-text-primary cursor-pointer p-2" @click="changeZoom(-1)">
    <div class=":uno: i-tabler-minus h-6 w-6" />
  </div>
</template>
