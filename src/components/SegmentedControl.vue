<script setup lang="ts">
import { ref, unref, watch } from 'vue';

const props = defineProps<{
  modelValue: any;
  items: { label: string; value: any }[];
}>();

const emit = defineEmits(['update:modelValue']);

const selectedIndex = ref(0);

props.items.forEach((e, i) => (e.value === props.modelValue ? (selectedIndex.value = i) : ''));

watch(
  () => props.modelValue,
  () => {
    props.items.forEach((e, i) => (e.value === props.modelValue ? (selectedIndex.value = i) : ''));
  },
);

const selectSegment = (e: Event, key: number) => {
  e.preventDefault();
  e.stopPropagation();

  if (unref(selectedIndex) === key) {
    return;
  }

  selectedIndex.value = key;
  emit('update:modelValue', props.items[key].value);
};
</script>

<template>
  <div class=":uno: rounded-lg text-text-primary grid font-sans text-sm font-normal font-medium auto-cols-fr grid-flow-col bg-brand-surface-neutral p-1 mobile:gap-2 mobile:grid-flow-row">
    <div
      v-for="(segment, index) in props.items"
      :key="index"
      :class="{ ':uno: shadow-md bg-base-white text-brand-primary-active': index === selectedIndex, ':uno: hover:bg-brand-primary-10': index !== selectedIndex }"
      class=":uno: rounded-lg cursor-pointer relative mx-1 first-of-type:ml-0 last-of-type:mr-0"
      @click="selectSegment($event, index)"
    >
      <input
        :checked="index === selectedIndex"
        :value="segment.value"
        class=":uno: hidden"
        type="radio"
        @input="selectSegment($event, index)"
      >
      <div class=":uno: items-center flex gap-2 justify-center text-center py-1 px-1">
        <label class=":uno: cursor-pointer uppercase m-0">{{ segment.label }}</label>
      </div>
    </div>
  </div>
</template>
