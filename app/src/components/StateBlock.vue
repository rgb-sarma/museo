<template>
  <div class="state" :class="{ dark }">
    <span v-if="icon" class="msym icon">{{ icon }}</span>
    <ion-spinner v-else-if="loading" name="crescent" class="spinner" />
    <div v-if="title" class="title">{{ title }}</div>
    <div v-if="message" class="message">{{ message }}</div>
    <button v-if="actionLabel" class="action" type="button" @click="$emit('action')">
      {{ actionLabel }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { IonSpinner } from '@ionic/vue';

withDefaults(
  defineProps<{
    icon?: string;
    title?: string;
    message?: string;
    actionLabel?: string;
    loading?: boolean;
    dark?: boolean;
  }>(),
  { icon: '', title: '', message: '', actionLabel: '', loading: false, dark: false },
);

defineEmits<{ action: [] }>();
</script>

<style scoped>
.state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 60px 20px;
  color: var(--museo-muted-2);
}

.icon {
  font-size: 40px;
}

.spinner {
  --color: var(--museo-ember);
  width: 28px;
  height: 28px;
}

.title {
  font: 700 13px var(--museo-display);
  text-transform: uppercase;
  letter-spacing: 0.02em;
  color: var(--museo-ink);
  margin-top: 12px;
}

.message {
  font: 500 12.5px var(--museo-text);
  margin-top: 6px;
  max-width: 220px;
  line-height: 1.5;
}

.action {
  margin-top: 16px;
  background: none;
  border: none;
  font: 700 11px var(--museo-text);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--museo-ember);
  cursor: pointer;
}

.dark .title {
  color: var(--museo-cream);
}
.dark {
  color: var(--museo-muted-dark);
}
</style>
