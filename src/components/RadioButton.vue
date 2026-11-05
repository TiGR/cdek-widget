<script setup lang="ts">
import { ref, unref, watch } from 'vue';

const emit = defineEmits(['update:modelValue']);

const props = withDefaults(defineProps<{
  modelValue: any;
  disabled?: boolean;
  items: { label: string; value: any }[];
}>(), {
  disabled: false,
});

const selectedIndex = ref(0);

props.items.forEach((e, i) => (e.value === props.modelValue ? (selectedIndex.value = i) : ''));

watch(
  () => props.modelValue,
  () => {
    props.items.forEach((e, i) => (e.value === props.modelValue ? (selectedIndex.value = i) : ''));
  },
);

const selectSegment = (key: number) => {
  if (props.disabled || unref(selectedIndex) === key) {
    return;
  }

  selectedIndex.value = key;
  emit('update:modelValue', props.items[key].value);
};
</script>

<template>
  <div class=":uno: font-sans">
    <div v-for="(segment, index) in props.items" :key="index" @click="selectSegment(index)">
      <input
        :checked="index === selectedIndex"
        :value="segment.value"
        type="radio"
        class=":uno: hidden"
        @input="selectSegment(index)"
      >
      <div :class="{ ':uno: text-base-black-50': props.disabled, ':uno: hover:text-brand-primary-active': !props.disabled }" class=":uno: items-center flex gap-1 group">
        <span
          :class="{
            ':uno: bg-base-white border-4': index === selectedIndex,
            ':uno: group-hover:border-brand-primary-70': !props.disabled && index === selectedIndex,
            ':uno: group-hover:bg-brand-primary-20': !props.disabled && index !== selectedIndex,
            ':uno: cursor-default border-base-black-35 bg-brand-surface-neutral': props.disabled,
          }"
          class=":uno: border rounded-full border-solid inline-block h-4 w-4 bg-brand-primary-5 border-brand-primary-main"
        />
        <label class=":uno: m-0">{{ segment.label }}</label>
      </div>
    </div>
  </div>
</template>
