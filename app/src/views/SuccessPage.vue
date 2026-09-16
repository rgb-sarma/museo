<template>
  <ion-page>
    <ion-content :fullscreen="true" class="dark-content" :scroll-y="false">
      <div class="screen">
        <div class="body">
          <div class="check"><span class="msym">check</span></div>
          <h1 class="headline">
            You're going to<br />{{ b?.museum.name }}
          </h1>
          <p class="when">{{ b ? longDate(b.visit_date) : '' }} · {{ b?.time_slot }}</p>
          <p class="ref">
            {{ b?.num_tickets }} ticket(s) · ref {{ b?.reference }}
          </p>
        </div>

        <div class="actions">
          <button class="museo-btn" type="button" @click="router.replace(`/booking/${b?.id}`)">
            View ticket
          </button>
          <button class="ghost" type="button" @click="router.replace('/tabs/bookings')">
            Go to bookings
          </button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonPage } from '@ionic/vue';
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useBookingsStore } from '@/stores/bookings';
import { longDate } from '@/utils/format';

const route = useRoute();
const router = useRouter();
const bookings = useBookingsStore();

const id = computed(() => Number(route.params.id));
const b = computed(() => bookings.active);

onMounted(() => {
  if (bookings.active?.id !== id.value) void bookings.open(id.value);
});
</script>

<style scoped>
.dark-content {
  --background: var(--museo-dark);
}

.screen {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--museo-dark);
  color: var(--museo-cream);
  padding-top: var(--ion-safe-area-top, 0px);
}

.body {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 0 32px;
}

.check {
  width: 76px;
  height: 76px;
  border-radius: 50%;
  background: var(--museo-ember);
  display: flex;
  align-items: center;
  justify-content: center;
}
.check .msym {
  font-size: 44px;
  color: #fff;
}

.headline {
  font: 700 26px var(--museo-display);
  letter-spacing: -0.01em;
  text-transform: uppercase;
  margin: 24px 0 0;
  line-height: 1.05;
}

.when {
  font: 500 14px var(--museo-text);
  color: var(--museo-muted-dark-2);
  margin: 12px 0 0;
}

.ref {
  font: 600 12px var(--museo-text);
  color: var(--museo-muted-dark);
  margin: 6px 0 0;
}

.actions {
  flex: 0 0 auto;
  padding: 0 24px 8px;
  padding-bottom: calc(8px + var(--ion-safe-area-bottom, 0px));
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ghost {
  width: 100%;
  height: 46px;
  border-radius: var(--museo-radius);
  border: var(--museo-border) solid var(--museo-dark-line-2);
  background: transparent;
  color: var(--museo-cream);
  font: 700 13px var(--museo-text);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  cursor: pointer;
}
</style>
