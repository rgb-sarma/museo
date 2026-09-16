<template>
  <button class="row" type="button" @click="$emit('open', museum.id)">
    <MuseumImage class="thumb" :src="museum.image_url" :alt="museum.name" :seed="museum.id" />
    <div class="text">
      <div class="name">{{ museum.name }}</div>
      <div class="meta">
        <span class="rating">★ {{ ratingStr(museum.avg_rating) }}</span>
        <span>·</span>
        <span>{{ CATEGORY_LABELS[museum.category] }}</span>
      </div>
    </div>
    <span class="price">{{ price(museum.admission_fee) }}</span>
  </button>
</template>

<script setup lang="ts">
import type { Museum } from '@/api';
import MuseumImage from '@/components/MuseumImage.vue';
import { CATEGORY_LABELS, price, ratingStr } from '@/utils/format';

defineProps<{ museum: Museum }>();
defineEmits<{ open: [id: number] }>();
</script>

<style scoped>
.row {
  display: flex;
  gap: 12px;
  align-items: center;
  width: 100%;
  padding: 10px;
  text-align: left;
  border: var(--museo-border) solid var(--museo-line);
  border-radius: var(--museo-radius);
  background: var(--museo-card);
  cursor: pointer;
}

.thumb {
  width: 62px;
  height: 62px;
  border-radius: var(--museo-radius-sm);
  flex: 0 0 auto;
}

.text {
  flex: 1;
  min-width: 0;
}

.name {
  font: 700 13px var(--museo-display);
  letter-spacing: -0.01em;
  text-transform: uppercase;
  color: var(--museo-ink);
  line-height: 1.1;
}

.meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 5px;
  font: 600 11px var(--museo-text);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--museo-muted);
}

.rating {
  color: var(--museo-ember);
}

.price {
  font: 700 13px var(--museo-text);
  color: var(--museo-ink);
  flex: 0 0 auto;
}
</style>
