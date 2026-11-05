<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<template>
  <div class=":uno: items-center bg-gray-100 flex justify-center absolute z-[9999] h-full w-full">
    <h1 class=":uno: text-xl">{{ t('error') }}</h1>
  </div>
</template>

<i18n lang="json">
{
  "eng": {
    "error": "Can't load map due to critical error"
  },
  "rus": {
    "error": "Произошла непредвиденная ошибка при загрузке карты"
  }
}
</i18n>
