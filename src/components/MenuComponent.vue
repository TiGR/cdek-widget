<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import PerfectScrollbar from 'perfect-scrollbar';
import { watchDebounced } from '@vueuse/core';
import map from '@/stores/map';
import core from '@/stores/core';
import search from '@/stores/search';
import { Popup } from '@/enums/Popup';
import { OfficeType } from '@/enums/OfficeType';
import { DeliveryMode } from '@/enums/DeliveryMode';
import { YandexMapZoomVariants } from '@/enums/YandexMapZoomVariants';
import type { iOffice } from '@/types/iOffice';

const mapStorage = map();
const coreStorage = core();
const searchStorage = search();
const { t } = useI18n();

const scrollableMenu = ref<HTMLElement>();

onMounted(() => nextTick(() => {
  if (coreStorage.debug) console.debug('[CDEK] Initializing Menu Prefect Scrollbar');

  try {
    new PerfectScrollbar(scrollableMenu.value!);
  } catch (e) {
    // the menu may be hidden
  }
}));

watchDebounced(
  mapStorage.bounds,
  () => {
    if (!scrollableMenu.value) {
      return;
    }

    if (coreStorage.debug) console.debug('[CDEK] Resetting menu scroll');

    scrollableMenu.value.scroll(0, 0);
  },
  { debounce: 300 },
);

const selectOffice = (point: iOffice) => {
  if (coreStorage.debug) console.debug('[CDEK] Selected office from menu', point);
  if (coreStorage.debug) console.debug('[CDEK] Switching delivery mode to office');

  searchStorage.$patch({ showSearchField: false });
  mapStorage.$patch({ location: { center: point.location, zoom: YandexMapZoomVariants.HOME } });
  coreStorage.$patch({ mode: DeliveryMode.OFFICE, selectedTariff: null, selected: false });
  coreStorage.closePopups();
  mapStorage.$patch({ exactOffice: point });
  coreStorage.togglePopup(Popup.INFO);
};
</script>

<template>
  <div :class="{ ':uno: -right-80': !coreStorage.openedPopups[Popup.MENU] }" class=":uno: bg-white text-text-primary font-sans text-sm absolute right-0 top-0 transition-all z-10 h-full w-72">
    <div class=":uno: border-b-2 border-stone-200 p-2">
      <div class=":uno: items-center rounded-md cursor-pointer flex text-xs font-medium gap-2 justify-center uppercase w-40 bg-brand-surface-neutral my-1 py-2" @click="coreStorage.togglePopup(Popup.MENU)">
        <div class=":uno: i-tabler-indent-increase h-6 w-6" />
        <div>{{ t('hide') }}</div>
      </div>
    </div>
    <div ref="scrollableMenu" class=":uno: h-[calc(100%-4.25rem)] mt-1 break-words overflow-hidden relative whitespace-normal p-2">
      <div
        v-for="office in mapStorage.filteredOffices"
        :key="office.code"
        class=":uno: rounded-md cursor-pointer mb-2 bg-brand-surface-neutral p-2 hover:bg-brand-primary-10"
        @click="selectOffice(office)"
      >
        <span class=":uno: items-center flex gap-1 py-1">
          <template v-if="office.type === OfficeType.PICKUP">
            <span class=":uno: i-cdek-pickup size-4" />
            <span>{{ t('pickup') }}</span>
          </template>
          <template v-else-if="office.type === OfficeType.OFFICE">
            <span class=":uno: i-tabler-building-skyscraper h-4 w-4" />
            <span>{{ t('office') }}</span>
          </template>
        </span>
        <p class=":uno: mb-1">{{ office.address }}</p>
        <div class=":uno: mb-1">
          <p v-for="(time, index) in office.work_time.split(', ')" :key="index">{{ time }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<i18n lang="json">
{
  "eng": {
    "hide": "Hide list",
    "pickup": "Postamat",
    "office": "Office"
  },
  "rus": {
    "hide": "Скрыть список",
    "pickup": "Постамат",
    "office": "Пункт выдачи"
  }
}
</i18n>
