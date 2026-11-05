<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import map from '@/stores/map';
import { YandexMapErrorCode } from '@/enums/YandexMapErrorCode';

const { t } = useI18n();
const { mapLoadError, serviceVersion } = storeToRefs(map());

const errorMessage = computed(() => {
  if (mapLoadError.value !== YandexMapErrorCode.SERVICE_VERSION_MISMATCH || !serviceVersion.value) {
    return t('error');
  }

  const serviceMajorVersion = Number(serviceVersion.value.split('.')[0]);
  const widgetMajorVersion = Number(__VERSION__.split('.')[0]);
  const messageKey = serviceMajorVersion > widgetMajorVersion ? 'updateWidget' : 'updateService';

  return t(messageKey, { serviceVersion: serviceVersion.value, widgetVersion: __VERSION__ });
});
</script>

<template>
  <div class=":uno: items-center bg-gray-100 flex justify-center absolute z-[9999] h-full w-full">
    <h1 class=":uno: text-xl">{{ errorMessage }}</h1>
  </div>
</template>

<i18n lang="json">
{
  "eng": {
    "error": "Can't load map due to critical error",
    "updateWidget": "The API version ({serviceVersion}) is incompatible with the widget version ({widgetVersion}). Update the widget.",
    "updateService": "The API version ({serviceVersion}) is incompatible with the widget version ({widgetVersion}). Update the API service."
  },
  "rus": {
    "error": "Произошла непредвиденная ошибка при загрузке карты",
    "updateWidget": "Версия API ({serviceVersion}) несовместима с версией виджета ({widgetVersion}). Обновите виджет.",
    "updateService": "Версия API ({serviceVersion}) несовместима с версией виджета ({widgetVersion}). Обновите API-сервис."
  }
}
</i18n>
