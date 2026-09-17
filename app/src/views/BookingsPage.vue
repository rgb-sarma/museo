<template>
  <ion-page>
    <ion-content :fullscreen="true" :scroll-y="false">
      <div class="screen">
        <div class="head">
          <h1 class="title">Bookings</h1>
          <div v-if="auth.isAuthenticated" class="tabs">
            <button
              v-for="t in TABS"
              :key="t.value"
              type="button"
              class="tab"
              :class="{ on: bookings.tab === t.value }"
              @click="bookings.tab = t.value"
            >
              {{ t.label }}
            </button>
          </div>
        </div>

        <div class="list mscroll">
          <StateBlock
            v-if="!auth.isAuthenticated"
            icon="lock"
            title="Sign in for your tickets"
            message="Bookings are tied to your account. Log in and yours show up here."
            action-label="Log in"
            @action="signIn"
          />

          <StateBlock
            v-else-if="bookings.loading && !bookings.all.length"
            loading
          />

          <StateBlock
            v-else-if="bookings.error"
            icon="cloud_off"
            title="Can't load bookings"
            :message="bookings.error"
            action-label="Try again"
            @action="bookings.load()"
          />

          <div v-else-if="bookings.visible.length" class="cards">
            <button
              v-for="b in bookings.visible"
              :key="b.id"
              type="button"
              class="booking"
              @click="router.push(`/booking/${b.id}`)"
            >
              <div class="booking-top">
                <MuseumImage
                  class="thumb"
                  :src="b.museum.image_url"
                  :alt="b.museum.name"
                  :seed="b.museum.id"
                />
                <div class="booking-text">
                  <div class="booking-name">{{ b.museum.name }}</div>
                  <div class="booking-when">
                    {{ longDate(b.visit_date) }} · {{ b.time_slot }}
                  </div>
                </div>
                <span class="msym chev">chevron_right</span>
              </div>
              <div class="booking-foot">
                <span class="booking-meta">
                  {{ b.num_tickets }} × Adult · ref {{ b.reference }}
                </span>
                <span class="status" :class="statusClass(b)">{{ statusLabel(b) }}</span>
              </div>
            </button>
          </div>

          <StateBlock
            v-else
            icon="confirmation_number"
            title="Nothing here yet"
            :message="
              bookings.tab === 'upcoming'
                ? 'Book a visit and your tickets will show up here.'
                : 'Visits you\'ve already made will appear here.'
            "
            :action-label="bookings.tab === 'upcoming' ? 'Find a museum' : ''"
            @action="router.push('/tabs/discover')"
          />
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonPage } from '@ionic/vue';
import { watch } from 'vue';
import { useRouter } from 'vue-router';

import type { Booking } from '@/api';
import MuseumImage from '@/components/MuseumImage.vue';
import StateBlock from '@/components/StateBlock.vue';
import { useAuthStore } from '@/stores/auth';
import { useBookingsStore } from '@/stores/bookings';
import { longDate } from '@/utils/format';

const router = useRouter();
const auth = useAuthStore();
const bookings = useBookingsStore();

const TABS = [
  { label: 'Upcoming', value: 'upcoming' as const },
  { label: 'Past', value: 'past' as const },
];

function statusLabel(b: Booking): string {
  if (b.status === 'cancelled') return 'Cancelled';
  return bookings.tab === 'past' ? 'Visited' : 'Confirmed';
}

function statusClass(b: Booking): string {
  if (b.status === 'cancelled') return 'cancelled';
  return bookings.tab === 'past' ? 'past' : 'confirmed';
}

function signIn() {
  router.push({ path: '/login', query: { redirect: '/tabs/bookings' } });
}

// anonymous visitors would only get a 401 back. the tab stays mounted across a
// login round trip, so this watches the flag rather than firing once on mount.
watch(
  () => auth.isAuthenticated,
  (signedIn) => {
    if (signedIn) void bookings.load();
  },
  { immediate: true },
);
</script>

<style scoped>
.screen {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--museo-surface);
}

.head {
  flex: 0 0 auto;
  padding: 6px 20px 0;
  padding-top: calc(6px + var(--ion-safe-area-top, 0px));
}

.title {
  font: 700 22px var(--museo-display);
  letter-spacing: -0.01em;
  text-transform: uppercase;
  color: var(--museo-ink);
  margin: 12px 0 0;
}

.tabs {
  display: flex;
  margin-top: 14px;
  border: var(--museo-border) solid var(--museo-line);
  border-radius: var(--museo-radius);
  overflow: hidden;
}

.tab {
  flex: 1;
  text-align: center;
  padding: 10px 0;
  font: 700 11px var(--museo-text);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  background: var(--museo-card);
  color: var(--museo-muted);
  border: none;
}
.tab.on {
  background: var(--museo-ink);
  color: var(--museo-cream);
}

.list {
  flex: 1 1 auto;
  overflow-y: auto;
  min-height: 0;
  padding: 14px 20px 24px;
}

.cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.booking {
  display: block;
  width: 100%;
  padding: 0;
  text-align: left;
  border: var(--museo-border) solid var(--museo-line);
  border-radius: var(--museo-radius);
  background: var(--museo-card);
  overflow: hidden;
  cursor: pointer;
}

.booking-top {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 12px;
}

.thumb {
  width: 58px;
  height: 58px;
  flex: 0 0 auto;
  border-radius: var(--museo-radius-sm);
}

.booking-text {
  flex: 1;
  min-width: 0;
}

.booking-name {
  font: 700 13px var(--museo-display);
  letter-spacing: -0.01em;
  text-transform: uppercase;
  color: var(--museo-ink);
  line-height: 1.12;
}

.booking-when {
  font: 600 11px var(--museo-text);
  color: var(--museo-muted);
  margin-top: 5px;
}

.chev {
  font-size: 22px;
  color: var(--museo-muted-2);
  flex: 0 0 auto;
}

.booking-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-top: var(--museo-border) solid var(--museo-line-soft);
  background: var(--museo-card-alt);
}

.booking-meta {
  font: 600 11px var(--museo-text);
  color: var(--museo-muted);
}

.status {
  font: 700 9.5px var(--museo-text);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 3px 8px;
  border-radius: var(--museo-radius-sm);
}
.status.confirmed {
  color: var(--museo-open);
  background: var(--museo-open-bg);
}
.status.past {
  color: var(--museo-muted);
  background: #efe7d8;
}
.status.cancelled {
  color: #9a3b22;
  background: #f5e2db;
}
</style>
