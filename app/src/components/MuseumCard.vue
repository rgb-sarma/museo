<template>
  <button class="card" type="button" @click="$emit('open', museum.id)">
    <MuseumImage class="thumb" :src="museum.image_url" :alt="museum.name" :seed="museum.id">
      <span class="price">{{ price(museum.admission_fee) }}</span>
    </MuseumImage>
    <div class="body">
      <span class="name">{{ museum.name }}</span>
      <div class="meta">
        <span class="rating">★ {{ ratingStr(museum.avg_rating) }}</span>
        <span>·</span>
        <span>{{ CATEGORY_LABELS[museum.category] }}</span>
        <template v-if="distance">
          <span>·</span>
          <span>{{ distance }}</span>
        </template>
      </div>
    </div>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import type { Museum } from '@/api';
import MuseumImage from '@/components/MuseumImage.vue';
import { CATEGORY_LABELS, distanceLabel, price, ratingStr } from '@/utils/format';

const props = defineProps<{
  museum: Museum;
  origin?: { latitude: number; longitude: number } | null;
}>();

defineEmits<{ open: [id: number] }>();

const distance = computed(() => distanceLabel(props.museum, props.origin ?? null));
</script>

<style scoped>
.card {
  display: block;
  width: 100%;
  padding: 0;
  text-align: left;
  border-radius: var(--museo-radius);
  overflow: hidden;
  background: var(--museo-card);
  border: var(--museo-border) solid var(--museo-line);
  cursor: pointer;
}

.thumb {
  height: 108px;
}

.price {
  position: absolute;
  top: 8px;
  right: 8px;
  font: 700 12px var(--museo-text);
  color: #fff;
  background: var(--museo-ember);
  padding: 4px 8px;
  border-radius: var(--museo-radius-sm);
}

.body {
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.name {
  font: 700 14px var(--museo-display);
  letter-spacing: -0.01em;
  text-transform: uppercase;
  color: var(--museo-ink);
  line-height: 1.12;
}

.meta {
  display: flex;
  align-items: center;
  gap: 7px;
  font: 600 11px var(--museo-text);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--museo-muted);
}

.rating {
  color: var(--museo-ember);
}
</style>
