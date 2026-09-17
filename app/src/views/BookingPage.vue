<template>
  <ion-page>
    <ion-content :fullscreen="true" :scroll-y="false">
      <div class="screen">
        <div class="museo-topbar">
          <button class="museo-iconbtn" type="button" @click="router.back()">
            <span class="msym">arrow_back</span>
          </button>
          <span class="museo-topbar-title">Choose your visit</span>
        </div>

        <div class="scroll mscroll">
          <div v-if="m" class="summary">
            <MuseumImage
              class="thumb"
              :src="m.image_url"
              :alt="m.name"
              :seed="m.id"
            />
            <div class="summary-text">
              <div class="summary-name">{{ m.name }}</div>
              <div class="summary-meta">
                {{ price(m.admission_fee) }} · {{ CATEGORY_LABELS[m.category] }}
              </div>
            </div>
          </div>

          <div class="museo-field-label section">Date</div>
          <div class="dates mscroll">
            <button
              v-for="d in dateChips"
              :key="d.iso"
              type="button"
              class="date"
              :class="{ on: bookings.draft.date === d.iso, closed: d.closed }"
              :disabled="d.closed"
              @click="bookings.patchDraft({ date: d.iso })"
            >
              <div class="dow">{{ d.dow }}</div>
              <div class="day">{{ d.day }}</div>
              <div class="mon">{{ d.closed ? "shut" : d.mon }}</div>
            </button>
          </div>

          <div class="museo-field-label section">Time slot</div>
          <div class="slots">
            <button
              v-for="s in bookings.slots"
              :key="s"
              type="button"
              class="slot"
              :class="{ on: bookings.draft.slot === s }"
              @click="bookings.patchDraft({ slot: s })"
            >
              {{ s }}
            </button>
          </div>

          <div class="museo-field-label section">Tickets</div>
          <div class="tickets">
            <div>
              <div class="ticket-type">Adult</div>
              <div class="ticket-price">
                {{ m ? price(m.admission_fee) : "" }} each
              </div>
            </div>
            <div class="stepper">
              <button
                type="button"
                class="step"
                :disabled="bookings.draft.qty <= 1"
                @click="bookings.patchDraft({ qty: bookings.draft.qty - 1 })"
              >
                <span class="msym">remove</span>
              </button>
              <span class="qty">{{ bookings.draft.qty }}</span>
              <button
                type="button"
                class="step on"
                :disabled="bookings.draft.qty >= 6"
                @click="bookings.patchDraft({ qty: bookings.draft.qty + 1 })"
              >
                <span class="msym">add</span>
              </button>
            </div>
          </div>
        </div>

        <div class="museo-footer">
          <div class="total">
            <span class="total-label">Total</span>
            <span class="total-value">{{ price(total) }}</span>
          </div>
          <button
            class="museo-btn continue"
            type="button"
            :disabled="!bookings.draft.slot || dateClosed"
            @click="router.push(`/museum/${id}/pay`)"
          >
            {{ bookings.draft.slot ? "Continue" : "Pick a time" }}
          </button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonPage } from "@ionic/vue";
import { computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import MuseumImage from "@/components/MuseumImage.vue";
import { useBookingsStore } from "@/stores/bookings";
import { useMuseumsStore } from "@/stores/museums";
import { buildDateChips, CATEGORY_LABELS, price } from "@/utils/format";

const route = useRoute();
const router = useRouter();
const museums = useMuseumsStore();
const bookings = useBookingsStore();

const id = computed(() => Number(route.params.id));
const m = computed(() =>
  museums.detail?.id === id.value ? museums.detail : null,
);
// the museum loads after this view mounts, so the closed days resolve late
const dateChips = computed(() =>
  buildDateChips(6, m.value?.opening_hours ?? null),
);
const dateClosed = computed(
  () => !!dateChips.value.find((d) => d.iso === bookings.draft.date)?.closed,
);

const total = computed(() =>
  m.value ? m.value.admission_fee * bookings.draft.qty : 0,
);

// today is the default pick, so a museum shut today needs the selection moved on.
// watching the flag rather than the chips also covers the draft being reset below.
watch(
  dateClosed,
  (closed) => {
    if (!closed) return;
    const open = dateChips.value.find((d) => !d.closed);
    if (open) bookings.patchDraft({ date: open.iso });
  },
  { immediate: true },
);

onMounted(() => {
  void bookings.loadSlots();
  if (!m.value) void museums.loadDetail(id.value);
  // entering the flow directly (deep link / reload) still needs a draft
  if (bookings.draft.museumId !== id.value) bookings.startDraft(id.value);
});
</script>

<style scoped>
.screen {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--museo-surface);
}

.museo-topbar {
  padding-top: calc(14px + var(--ion-safe-area-top, 0px));
}

.scroll {
  flex: 1 1 auto;
  overflow-y: auto;
  min-height: 0;
  padding: 6px 20px 20px;
}

.summary {
  display: flex;
  gap: 12px;
  align-items: center;
  border: var(--museo-border) solid var(--museo-line);
  border-radius: var(--museo-radius);
  background: var(--museo-card);
  overflow: hidden;
}

.thumb {
  width: 58px;
  height: 58px;
  flex: 0 0 auto;
}

.summary-text {
  padding: 8px 10px 8px 0;
  min-width: 0;
}

.summary-name {
  font: 700 13px var(--museo-display);
  letter-spacing: -0.01em;
  text-transform: uppercase;
  color: var(--museo-ink);
  line-height: 1.1;
}

.summary-meta {
  font: 600 11px var(--museo-text);
  color: var(--museo-muted);
  margin-top: 4px;
}

.museo-field-label.section {
  margin: 20px 0 10px;
}

.dates {
  display: flex;
  gap: 8px;
  overflow-x: auto;
}

.date {
  flex: 0 0 auto;
  width: 54px;
  border-radius: var(--museo-radius);
  border: var(--museo-border) solid var(--museo-line);
  background: var(--museo-card);
  color: var(--museo-ink);
  padding: 10px 0;
  text-align: center;
  cursor: pointer;
}
.date.on {
  border-color: var(--museo-ink);
  background: var(--museo-ink);
  color: var(--museo-cream);
}
.date.closed {
  border-style: dashed;
  background: var(--museo-card-alt);
  color: var(--museo-muted-2);
  cursor: not-allowed;
}
.dow {
  font: 600 10px var(--museo-text);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  opacity: 0.7;
}
.day {
  font: 700 18px var(--museo-display);
  margin-top: 2px;
}
.mon {
  font: 600 9px var(--museo-text);
  text-transform: uppercase;
  opacity: 0.7;
}

.slots {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.slot {
  text-align: center;
  padding: 11px 0;
  border-radius: var(--museo-radius);
  border: var(--museo-border) solid var(--museo-line);
  background: var(--museo-card);
  color: var(--museo-ink);
  font: 700 13px var(--museo-text);
  cursor: pointer;
}
.slot.on {
  border-color: var(--museo-ember);
  background: var(--museo-ember);
  color: #fff;
}

.tickets {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: var(--museo-border) solid var(--museo-line);
  border-radius: var(--museo-radius);
  background: var(--museo-card);
  padding: 12px 14px;
}

.ticket-type {
  font: 700 13px var(--museo-text);
  color: var(--museo-ink);
}
.ticket-price {
  font: 600 11px var(--museo-text);
  color: var(--museo-muted);
  margin-top: 2px;
}

.stepper {
  display: flex;
  align-items: center;
  gap: 14px;
}

.step {
  width: 34px;
  height: 34px;
  border-radius: var(--museo-radius);
  border: var(--museo-border) solid var(--museo-line);
  background: var(--museo-card);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
}
.step .msym {
  font-size: 20px;
  color: var(--museo-ink);
}
.step.on {
  border-color: var(--museo-ember);
  background: var(--museo-ember);
}
.step.on .msym {
  color: #fff;
}
.step:disabled {
  opacity: 0.4;
  cursor: default;
}

.qty {
  font: 700 18px var(--museo-display);
  min-width: 18px;
  text-align: center;
  color: var(--museo-ink);
}

.total {
  display: flex;
  flex-direction: column;
}
.total-label {
  font: 600 9px var(--museo-text);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--museo-muted-2);
}
.total-value {
  font: 700 19px var(--museo-display);
  color: var(--museo-ink);
}

.continue {
  flex: 1;
  width: auto;
  height: 48px;
}
</style>
