<template>
  <div class="museo-img" :style="{ background: gradient }">
    <img
      v-if="src && !failed"
      :src="src"
      :alt="alt"
      loading="lazy"
      @error="failed = true"
    />
    <slot />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";

import { fallbackGradient } from "@/utils/format";

const props = withDefaults(
  defineProps<{
    src?: string;
    alt?: string;
    /** seeds the placeholder gradient so each museum keeps a stable colour. */
    seed?: number;
    /** gradient stripe width -> the prototype used a wider stripe on the hero. */
    stripe?: number;
  }>(),
  { src: "", alt: "", seed: 0, stripe: 11 },
);

const failed = ref(false);
const gradient = fallbackGradient(props.seed, props.stripe);

watch(
  () => props.src,
  () => {
    failed.value = false;
  },
);
</script>

<style scoped>
.museo-img {
  position: relative;
  overflow: hidden;
}
.museo-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
</style>
