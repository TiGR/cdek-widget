<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import PerfectScrollbar from 'perfect-scrollbar';
import map from '@/stores/map';
import core from '@/stores/core';
import { Popup } from '@/enums/Popup';
import { OfficeType } from '@/enums/OfficeType';
import { DeliveryMode } from '@/enums/DeliveryMode';
import TariffInfo from '@/components/TariffInfo.vue';

const mapStorage = map();
const coreStorage = core();
const { t } = useI18n();

const scrollable = ref<HTMLElement>();

onMounted(() => nextTick(() => {
  if (coreStorage.debug) console.debug('[CDEK] Initializing Office Prefect Scrollbar');

  try {
    new PerfectScrollbar(scrollable.value!);
  } catch (e) {
    // the popup may be hidden
  }
}));
</script>

<template>
  <div
    :class="{ ':uno: -right-80': !coreStorage.openedPopups[Popup.INFO] || coreStorage.mode !== DeliveryMode.OFFICE || !mapStorage.exactOffice }"
    class=":uno: drop-shadow-md bg-white text-text-primary font-sans text-sm absolute right-0 top-0 transition-all whitespace-normal z-20 h-full w-72 p-2"
  >
    <div class=":uno: pt-3 px-3">
      <a class=":uno: i-tabler-x text-brand-primary-main cursor-pointer block absolute right-3 top-3 h-6 w-6" @click="coreStorage.togglePopup(Popup.INFO)" />
      <div class=":uno: text-text-secondary font-sans mb-1">
        {{ t(mapStorage.exactOffice?.type === OfficeType.OFFICE ? 'title.office' : 'title.pickup') }} - {{ mapStorage.exactOffice?.code }}
      </div>
    </div>
    <div ref="scrollable" class=":uno: h-[calc(100%-2rem)] overflow-hidden relative">
      <div class=":uno: mb-1 px-3">
        <div class=":uno: text-base font-bold mb-2">{{ mapStorage.exactOffice?.city }}, {{ mapStorage.exactOffice?.address }}</div>
        <div class=":uno: mb-1">
          <div v-for="(time, index) in mapStorage.exactOffice?.work_time?.split(', ')" :key="index">{{ time }}</div>
        </div>
      </div>
      <TariffInfo
        :tariffs="mapStorage.exactOffice?.type === OfficeType.OFFICE ? coreStorage.tariffs.office : coreStorage.tariffs.pickup"
      />
    </div>
  </div>
</template>

<i18n lang="json">
{
  "eng": {
    "title": {
      "office": "Office",
      "pickup": "Postamat"
    },
    "address": "Office address",
    "workingTime": "Office working time",
    "code": "Office code"
  },
  "rus": {
    "title": {
      "office": "Пункт выдачи",
      "pickup": "Постамат"
    },
    "address": "Адрес пункта выдачи заказов",
    "workingTime": "Время работы",
    "code": "Код ПВЗ"
  }
}
</i18n>
