<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet />

      <ion-tab-bar slot="bottom" class="tabbar">
        <ion-tab-button
          v-for="t in TABS"
          :key="t.tab"
          :tab="t.tab"
          :href="`/tabs/${t.tab}`"
          class="tabbtn"
        >
          <span class="msym">{{ t.icon }}</span>
          <ion-label>{{ t.label }}</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonLabel,
  IonPage,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
} from '@ionic/vue';

const TABS = [
  { tab: 'discover', label: 'Discover', icon: 'explore' },
  { tab: 'search', label: 'Search', icon: 'search' },
  { tab: 'bookings', label: 'Bookings', icon: 'confirmation_number' },
  { tab: 'profile', label: 'Profile', icon: 'person' },
];
</script>

<style scoped>
.tabbar {
  --background: var(--museo-surface);
  --border: var(--museo-border) solid var(--museo-line);
  --color: var(--museo-muted-2);
  --color-selected: var(--museo-ember);
  height: 56px;
  padding: 9px 12px 4px;
  padding-bottom: calc(4px + var(--ion-safe-area-bottom, 0px));
  box-sizing: content-box;
}

.tabbtn {
  --padding-top: 0;
  --padding-bottom: 0;
  --min-height: 0;
}

.tabbtn .msym {
  font-size: 23px;
  margin-bottom: 2px;
}

.tabbtn ion-label {
  font: 700 9px var(--museo-text);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin: 0;
}
</style>
