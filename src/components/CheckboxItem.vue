<script setup lang="ts">
const props = withDefaults(defineProps<{
  label: string;
  disabled?: boolean;
  modelValue: boolean | null;
}>(), {
  disabled: false,
});

const emit = defineEmits(['update:modelValue']);

const check = () => {
  if (props.disabled) return;

  emit('update:modelValue', !props.modelValue);
};
</script>

<template>
  <div :class="{ ':uno: text-base-black-50': props.disabled }" class=":uno: items-center text-text-primary flex font-sans gap-1 group" @click="check">
    <input :checked="props.modelValue || false" class=":uno: hidden" type="checkbox" @input="check">
    <span
      :class="{
        ':uno: group-hover:bg-brand-primary-20': !props.disabled,
        ':uno: border-0 cursor-default bg-base-black-35': props.disabled && props.modelValue,
        ':uno: cursor-default border-base-black-35 bg-brand-surface-neutral': props.disabled && !props.modelValue,
        ':uno: group-hover:border-0 group-hover:bg-brand-primary-70 bg-brand-primary-main': !props.disabled && props.modelValue,
      }"
      class=":uno: items-center border rounded border-solid flex inline-block justify-center size-4 bg-brand-primary-5 border-brand-primary-main"
    >
      <span :class="{ ':uno: hidden': !props.modelValue }" class=":uno: i-tabler-check text-base-white inline-block size-3" />
    </span>
    <label :class="{ ':uno: group-hover:text-brand-primary-active': !props.disabled }" class=":uno: m-0">{{ props.label }}</label>
  </div>
</template>
