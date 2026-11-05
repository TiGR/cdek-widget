<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import search from '@/stores/search';
import core from '@/stores/core';
import { OfficeType } from '@/enums/OfficeType';
import CheckboxItem from '@/components/CheckboxItem.vue';
import RadioButton from '@/components/RadioButton.vue';

const searchStorage = search();
const coreStorage = core();
const { t } = useI18n();
</script>

<template>
  <div class=":uno: text-text-primary font-sans w-44">
    <h1 class=":uno: text-lg font-bold text-center">{{ t('title') }}</h1>
    <div class=":uno: text-sm">
      <CheckboxItem
        v-if="!searchStorage.hideFilters.have_cash"
        :disabled="coreStorage.params.forceFilters.have_cash !== null"
        :label="t('cash')"
        :model-value="searchStorage.filters.have_cash"
        @update:model-value="searchStorage.$patch({ filters: { ...searchStorage.filters, have_cash: $event ? true : null } })"
      />
      <CheckboxItem
        v-if="!searchStorage.hideFilters.have_cashless"
        :disabled="coreStorage.params.forceFilters.have_cashless !== null"
        :label="t('cashless')"
        :model-value="searchStorage.filters.have_cashless"
        @update:model-value="searchStorage.$patch({ filters: { ...searchStorage.filters, have_cashless: $event ? true : null } })"
      />
      <CheckboxItem
        v-if="!searchStorage.hideFilters.is_dressing_room"
        :disabled="coreStorage.params.forceFilters.is_dressing_room !== null"
        :label="t('dress')"
        :model-value="searchStorage.filters.is_dressing_room"
        @update:model-value="searchStorage.$patch({
          filters: { ...searchStorage.filters, is_dressing_room: $event ? true : null },
        })"
      />
      <div v-if="!searchStorage.hideFilters.type" class=":uno: border-t-2 mt-1 w-full">
        <RadioButton
          :disabled="coreStorage.params.forceFilters.type !== null"
          :items="[
            { label: t('type.all'), value: OfficeType.ALL },
            { label: t('type.pickup'), value: OfficeType.PICKUP },
            { label: t('type.office'), value: OfficeType.OFFICE },
          ]"
          :model-value="searchStorage.filters.type"
          @update:model-value="searchStorage.$patch({ filters: { ...searchStorage.filters, type: $event } })"
        />
      </div>
    </div>
  </div>
</template>

<i18n lang="json">
{
  "eng": {
    "hint": "Open filters",
    "title": "Filters",
    "cashless": "Card payment",
    "cash": "Cash payment",
    "dress": "Have dressing room",
    "type": {
      "all": "ALL",
      "office": "Offices only",
      "pickup": "Pickup points only"
    }
  },
  "rus": {
    "hint": "Открыть фильтры",
    "title": "Фильтры",
    "cashless": "Оплата картой",
    "cash": "Оплата наличными",
    "dress": "Есть примерочная",
    "type": {
      "all": "Все",
      "office": "Только ПВЗ",
      "pickup": "Только постаматы"
    }
  }
}
</i18n>
