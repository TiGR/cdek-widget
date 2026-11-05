<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import core from '@/stores/core';
import map from '@/stores/map';
import CdekInput from '@/components/CdekInput.vue';
import CdekButton from '@/components/CdekButton.vue';

const postcode = ref('');
const { t } = useI18n();
const coreStorage = core();
const mapStorage = map();

const save = () => {
  if (!postcode.value) return;

  mapStorage.$patch((state) => (state.pointInfo!.postal_code = postcode.value));
  // an empty "patch function" mutation triggers the onChoose subscription in Widget.init()
  coreStorage.$patch(() => {});
};
</script>

<template>
  <div class=":uno: items-center flex justify-center absolute z-[99999] bottom-0 left-0 right-0 top-0">
    <div class=":uno: bg-white rounded-lg w-96 p-5">
      <h4 class=":uno: font-bold pb-5 text-center">{{ t('title') }}</h4>
      <CdekInput v-model="postcode" :label="t('label')" class=":uno: mb-3" />
      <CdekButton :disabled="!postcode" @click="save">{{ t('button') }}</CdekButton>
    </div>
  </div>
  <div class=":uno: absolute z-9999 bg-base-black-20 inset-0" />
</template>

<i18n lang="json">
{
  "eng": {
    "title": "It was not possible to determine the departure address index, please enter it manually",
    "label": "Postal code",
    "button": "Save"
  },
  "rus": {
    "title": "Не получилось определить индекс адреса отправления, введите его вручную",
    "label": "Почтовый индекс",
    "button": "Сохранить"
  }
}
</i18n>
