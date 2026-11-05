<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import config from '@/config';
import core from '@/stores/core';
import { Popup } from '@/enums/Popup';

const { t } = useI18n();
const coreStorage = core();
</script>

<template>
  <div class=":uno: font-sans relative">
    <a :title="t('hint')" class=":uno: cursor-pointer" @click="coreStorage.togglePopup(Popup.SUPPORT)">
      <div class=":uno: i-tabler-help-circle text-text-primary h-6 w-6" />
    </a>
    <div :class="{ ':uno: hidden': !coreStorage.openedPopups[Popup.SUPPORT] }" class=":uno: drop-shadow-md bg-white rounded-lg -bottom-2 text-text-primary left-10 absolute w-80 p-2">
      <h1 class=":uno: font-sans text-xl font-bold text-center">{{ t('title') }}</h1>
      <p class=":uno: whitespace-normal py-3">{{ t('text') }}</p>
      <div class=":uno: flex gap-2 mb-1">
        <a :href="`tel:${config.promo.tel.data}`">
          <div class=":uno: i-tabler-phone text-text-primary h-6 w-6" />
        </a>
        <a :href="`tel:${config.promo.tel.data}`">{{ config.promo.tel.title }}</a>
      </div>
      <div class=":uno: flex gap-2 underline">
        <a :href="`mailto:${config.promo.mail}`">
          <div class=":uno: i-tabler-mail text-text-primary h-6 w-6" />
        </a>
        <a :href="`mailto:${config.promo.mail}`">{{ config.promo.mail }}</a>
      </div>
    </div>
  </div>
</template>

<i18n lang="json">
{
  "eng": {
    "hint": "Support",
    "title": "Support service",
    "text": "If you have any questions, you can ask them to our specialists"
  },
  "rus": {
    "hint": "Поддержка",
    "title": "Служба поддержки",
    "text": "Если у вас есть вопросы, можете задать их нашим специалистам"
  }
}
</i18n>
