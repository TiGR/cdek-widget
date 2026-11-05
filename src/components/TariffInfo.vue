<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import core from '@/stores/core';
import search from '@/stores/search';
import CdekButton from '@/components/CdekButton.vue';
import type { iTariff } from '@/types/iTariff';
// @ext
import { usePriceFormatter } from '@/extensions';

defineProps<{
  tariffs: iTariff[];
}>();

const coreStorage = core();
const searchStorage = search();
const { t } = useI18n();
// @ext
const formatPrice = usePriceFormatter();

// tariffs are calculated only when the parcels and the sender city are known
const showTariffs = computed(
  () => Array.isArray(coreStorage.params.goods) && coreStorage.params.goods.length && coreStorage.params.from !== null,
);

const selectTariff = (tariff: iTariff) => {
  coreStorage.$patch((state) => {
    state.selectedTariff = tariff;
  });
};

const selectPoint = () => coreStorage.$patch((state) => {
  state.selected = true;
});
</script>

<template>
  <div>
    <div v-if="coreStorage.params.sender || (coreStorage.params.canChoose && !showTariffs)">
      <CdekButton data-part="select-button" :small="true" :theme="coreStorage.selected ? 'secondary' : 'primary'" @click="selectPoint">
        {{ t(coreStorage.selected ? 'selected' : 'select') }}
      </CdekButton>
    </div>
    <template v-else-if="showTariffs">
      <div data-part="tariff-title" class=":uno: font-sans font-semibold mb-2 ml-3">{{ t('title') }}</div>
      <div class=":uno: font-sans break-words relative whitespace-normal">
        <template v-if="tariffs.length > 0">
          <div
            v-for="tariff in tariffs"
            :key="tariff.tariff_code"
            data-part="tariff"
            :class="{ ':uno: border-1 bg-brand-primary-10': coreStorage.selectedTariff !== null && coreStorage.selectedTariff.tariff_code === tariff.tariff_code }"
            class=":uno: rounded-md border-solid cursor-pointer text-sm mb-3 relative bg-brand-surface-neutral p-3 border-brand-primary-main hover:bg-brand-primary-10"
            @click="selectTariff(tariff)"
          >
            <i
              data-part="tariff-check"
              v-if="coreStorage.selectedTariff !== null && coreStorage.selectedTariff.tariff_code === tariff.tariff_code"
              class=":uno: i-tabler-check text-brand-primary-active absolute right-2 top-2 h-6 w-6"
            />
            <p data-part="tariff-name">{{ tariff.tariff_name }}</p>
            <div data-part="tariff-meta" class=":uno: text-text-primary flex text-xs gap-2">
              <div>
                <template v-if="tariff.period_min !== tariff.period_max">{{ tariff.period_min }} - </template>
                {{ tariff.period_max }} {{ t('days', tariff.period_max) }}
              </div>
              <!-- @ext: formatPrice -->
              <div data-part="tariff-price">{{ formatPrice(tariff) }}</div>
            </div>
          </div>
        </template>
        <div v-else-if="searchStorage.loading" class=":uno: flex justify-center">
          <div class=":uno: i-tabler-loader-2 animate-spin text-text-primary h-6 w-6" />
        </div>
        <div v-else class=":uno: text-red-600 text-center">{{ t('priceError') }}</div>
      </div>
    </template>
  </div>
</template>

<i18n lang="json">
{
  "eng": {
    "priceError": "There was a problem during cost calculation",
    "title": "Select tariff",
    "days": "days | day | days",
    "select": "Select",
    "selected": "Selected"
  },
  "rus": {
    "priceError": "Не могу посчитать стоимость",
    "title": "Выберите тариф",
    "days": "дней | день | дня | дней",
    "select": "Выбрать",
    "selected": "Выбран"
  }
}
</i18n>
