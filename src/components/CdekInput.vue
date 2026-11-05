<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  modelValue: string;
  label?: string;
}>();

const emit = defineEmits(['update:modelValue']);

const value = computed(() => props.modelValue);

const setValue = (event: Event) => {
  emit('update:modelValue', (event.target as HTMLInputElement).value);
};
</script>

<template>
  <div>
    <label :class="{ ':uno: bg-white border-2 border-solid border-brand-primary-main': value, ':uno: hover:bg-brand-primary-10': !value }" class=":uno: shadow-inner items-center rounded-lg box-border cursor-text flex h-14 pe-3.5 ps-3.5 relative bg-brand-surface-neutral p-1.5">
      <input :value="value" class=":uno: self-end bg-transparent border-none grow outline-none w-full caret-brand-primary-main peer" v-bind="$attrs" @input="setValue">
      <div v-if="label" :class="{ ':uno: translate-y-0 text-sm top-2': value }" class=":uno: -translate-y-1/2 absolute top-1/2 transition-all text-base-black-60 peer-active:translate-y-0 peer-active:text-sm peer-active:top-2 peer-focus:translate-y-0 peer-focus:text-sm peer-focus:top-2">{{ label }}</div>
    </label>
  </div>
</template>
