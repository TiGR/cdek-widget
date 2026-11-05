<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { iExtensionContext, tRenderHook } from '@/extensions/types';

// a DOM element owned by a consumer render hook; re-rendered whenever the context changes
const props = defineProps<{
  hook: tRenderHook;
  context: iExtensionContext;
  part: string;
  // the hook is not called while this is false, e.g. when no office is selected
  active: boolean;
}>();

const el = ref<HTMLElement>();
let cleanup: (() => void) | null = null;

const reset = () => {
  if (cleanup) {
    const fn = cleanup;

    cleanup = null;

    try {
      fn();
    } catch (e) {
      console.error(`[CDEK] Extension ${props.part} cleanup failed`, e);
    }
  }

  if (el.value) el.value.innerHTML = '';
};

const render = () => {
  reset();

  if (!el.value || !props.active) return;

  try {
    const result = props.hook(el.value, props.context);

    if (typeof result === 'string') {
      el.value.innerHTML = result;
    } else if (typeof result === 'function') {
      cleanup = result;
    }
  } catch (e) {
    console.error(`[CDEK] Extension ${props.part} failed`, e);
  }
};

onMounted(render);
watch(() => [props.context, props.active], render);
onBeforeUnmount(reset);
</script>

<template>
  <div ref="el" :data-part="part" />
</template>
