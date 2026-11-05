<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import PerfectScrollbar from 'perfect-scrollbar';
import map from '@/stores/map';
import core from '@/stores/core';
import { Popup } from '@/enums/Popup';
import { DeliveryMode } from '@/enums/DeliveryMode';
import { YandexGeocoderKind } from '@/enums/YandexGeocoderKind';
import { YandexGeocoderPrecision } from '@/enums/YandexGeocoderPrecision';
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

// the selected point has to be inside the area set by the fixBounds option
const canShowTariffs = computed(() => {
  if (mapStorage.fixedParams[YandexGeocoderKind.COUNTRY] !== null
    && mapStorage.fixedParams[YandexGeocoderKind.COUNTRY] !== mapStorage.pointInfo?.country_code?.toLowerCase()) {
    return false;
  }

  if (mapStorage.fixedParams[YandexGeocoderKind.LOCALITY] !== null
    && (mapStorage.pointInfo?.components || []).filter((c) => c.kind === YandexGeocoderKind.LOCALITY).length < 1) {
    return false;
  }

  return !(mapStorage.fixedParams[YandexGeocoderKind.PROVINCE] !== null
    && (mapStorage.pointInfo?.components || []).filter((c) => c.kind === YandexGeocoderKind.PROVINCE).length < 1);
});
</script>

<template>
  <div
    :class="{ ':uno: -right-80': !coreStorage.openedPopups[Popup.INFO] || coreStorage.mode !== DeliveryMode.DOOR || !mapStorage.pointInfo }"
    class=":uno: drop-shadow-md bg-white text-text-primary font-sans text-sm absolute right-0 top-0 transition-all whitespace-normal z-20 h-full w-72 p-2"
  >
    <div class=":uno: pt-3 px-3">
      <a class=":uno: i-tabler-x text-brand-primary-main cursor-pointer block absolute right-3 top-3 h-6 w-6" @click="coreStorage.togglePopup(Popup.INFO)" />
      <div class=":uno: text-text-secondary font-sans mb-1">{{ t('title') }}</div>
    </div>
    <div ref="scrollable" class=":uno: h-[calc(100%-2rem)] overflow-hidden relative">
      <div class=":uno: font-sans font-bold mb-3 px-3">{{ mapStorage.pointInfo?.formatted }}</div>
      <TariffInfo
        v-if="(mapStorage.pointInfo?.precision === YandexGeocoderPrecision.EXACT || mapStorage.pointInfo?.precision === YandexGeocoderPrecision.NUMBER) && canShowTariffs"
        :tariffs="coreStorage.tariffs.door"
      />
      <div v-else-if="!canShowTariffs" class=":uno: text-red-600 text-center">{{ t('forbidden') }}</div>
      <div v-else class=":uno: text-red-600 text-center">{{ t('needExactAddress') }}</div>
    </div>
  </div>
</template>

<i18n lang="json">
{
  "eng": {
    "title": "Delivery address",
    "needExactAddress": "Please, select exact address",
    "forbidden": "Delivery to that address is unavailable"
  },
  "rus": {
    "title": "Адрес доставки",
    "needExactAddress": "Выберите адрес точнее",
    "forbidden": "Доставка в выбранный адрес недоступна"
  }
}
</i18n>
