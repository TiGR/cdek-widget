<script setup lang="ts">
import { ref } from 'vue';
import { useResizeObserver } from '@vueuse/core';
import core from '@/stores/core';
import { DeliveryMode } from '@/enums/DeliveryMode';
import App from '@/App.vue';

const coreStorage = core();

const el = ref(null);
const height = ref(600);

useResizeObserver(el, (entries) => (height.value = entries[0].contentRect.height));
</script>

<template>
  <div v-if="coreStorage.params.popup" ref="el" :class="{ ':uno: hidden': !coreStorage.globalPopup }" class=":uno: items-center text-text-primary grid justify-items-center fixed z-[99999] bottom-0 left-0 right-0 top-0">
    <div
      :class="{
        ':uno: h-[710px]': !coreStorage.params.hideDeliveryOptions[DeliveryMode.OFFICE] && !coreStorage.params.hideDeliveryOptions[DeliveryMode.DOOR],
        ':uno: h-[460px]': height <= 600,
        ':uno: h-[660px]': height > 660,
      }"
      class=":uno: bg-white rounded-md relative z-[100000] p-4 pt-12"
    >
      <a class=":uno: i-tabler-x text-brand-primary-active cursor-pointer block absolute right-3 top-3 z-[100001] h-6 w-6" @click="() => (coreStorage.globalPopup = false)" />
      <App :class="{ ':uno: h-[400px]': height <= 600, 'h-[600px]': height > 600 }" class=":uno: max-w-4xl w-[300px] sm:w-[500px] md:w-[600px] lg:w-[800px]" />
    </div>
    <div class=":uno: bg-black/50 absolute z-[99999] bottom-0 left-0 right-0 top-0" @click="() => (coreStorage.globalPopup = false)" />
  </div>
  <App v-else />
</template>
