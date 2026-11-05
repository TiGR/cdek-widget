<script setup lang="ts">
const props = withDefaults(defineProps<{
  theme?: 'primary' | 'secondary';
  small?: boolean;
  disabled?: boolean;
}>(), {
  theme: 'primary',
});
</script>

<template>
  <button
    :class="{
      ':uno: text-base-white bg-brand-primary-main': props.theme === 'primary' && !props.disabled,
      ':uno: bg-brand-primary-10 text-brand-primary-main': props.theme === 'secondary' && !props.disabled,
      ':uno: h-9': props.small,
      ':uno: text-base-white bg-base-black-35': props.disabled,
    }"
    class=":uno: items-center border-transparent border rounded-lg inline-flex text-base justify-center h-12 w-full py-3 px-6 cursor-pinter"
    type="button"
  >
    <slot />
  </button>
</template>
