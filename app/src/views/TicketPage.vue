<template>
  <ion-page>
    <ion-content :fullscreen="true" :scroll-y="false">
      <div class="screen">
        <div class="museo-topbar">
          <button class="museo-iconbtn" type="button" @click="back">
            <span class="msym">arrow_back</span>
          </button>
          <span class="museo-topbar-title">Your ticket</span>
        </div>

        <div class="scroll mscroll">
          <StateBlock v-if="!b" loading />

          <div v-else class="ticket">
            <div class="ticket-head">
              <span
                class="status"
                :class="{ cancelled: b.status === 'cancelled' }"
              >
                {{ b.status === "cancelled" ? "Cancelled" : "Confirmed" }}
              </span>
              <span class="museum">{{ b.museum.name }}</span>
              <span class="when"
                >{{ longDate(b.visit_date) }} · {{ b.time_slot }}</span
              >
            </div>

            <div class="qr-wrap">
              <div class="qr">
                <img v-if="qrDataUrl" :src="qrDataUrl" alt="Ticket QR code" />
              </div>
            </div>

            <div class="perforation">
              <div class="notch left" />
              <div class="notch right" />
              <div class="dash" />
            </div>

            <div class="details">
              <div>
                <div class="label">Date</div>
                <div class="value">{{ shortDate(b.visit_date) }}</div>
              </div>
              <div>
                <div class="label">Time</div>
                <div class="value">{{ b.time_slot }}</div>
              </div>
              <div>
                <div class="label">Tickets</div>
                <div class="value">{{ b.num_tickets }} × Adult</div>
              </div>
              <div>
                <div class="label">Booking ref</div>
                <div class="value mono">{{ b.reference }}</div>
              </div>
            </div>
          </div>

          <div class="tail" />
        </div>

        <div v-if="b" class="ticket-footer">
          <button
            class="museo-btn-outline"
            type="button"
            @click="addToCalendar"
          >
            <span class="msym">calendar_add_on</span>Add to calendar
          </button>
          <button
            v-if="b.status !== 'cancelled' && isUpcoming"
            class="cancel"
            type="button"
            @click="confirmCancel"
          >
            Cancel this booking
          </button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonContent,
  IonPage,
  alertController,
  toastController,
} from "@ionic/vue";
import QRCode from "qrcode";
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import StateBlock from "@/components/StateBlock.vue";
import { useBookingsStore } from "@/stores/bookings";
import { downloadICS } from "@/utils/calendar";
import { longDate, shortDate, toISODate } from "@/utils/format";

const route = useRoute();
const router = useRouter();
const bookings = useBookingsStore();

const qrDataUrl = ref("");

const id = computed(() => Number(route.params.id));
const b = computed(() =>
  bookings.active?.id === id.value ? bookings.active : null,
);
const isUpcoming = computed(
  () => !!b.value && b.value.visit_date >= toISODate(new Date()),
);

if (bookings.active?.id !== id.value) void bookings.open(id.value);

// the QR encodes the booking reference -> the value the door scanner reads
watch(
  () => b.value?.reference,
  async (reference) => {
    if (!reference) return;
    qrDataUrl.value = await QRCode.toDataURL(reference, {
      margin: 0,
      width: 300,
      color: { dark: "#221c16ff", light: "#f2ebdd00" },
      errorCorrectionLevel: "M",
    });
  },
  { immediate: true },
);

function back() {
  router.back();
}

function addToCalendar() {
  if (b.value) downloadICS(b.value);
}

async function confirmCancel() {
  const alert = await alertController.create({
    header: "Cancel this booking?",
    message: "Your ticket will no longer be valid.",
    buttons: [
      { text: "Keep it", role: "cancel" },
      {
        text: "Cancel booking",
        role: "destructive",
        handler: async () => {
          if (await bookings.cancel(id.value)) {
            const toast = await toastController.create({
              message: "Booking cancelled",
              duration: 1800,
            });
            await toast.present();
          }
        },
      },
    ],
  });
  await alert.present();
}
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
  padding: 8px 20px 0;
}

.ticket {
  background: var(--museo-dark);
  border-radius: 6px;
  overflow: hidden;
}

.ticket-head {
  padding: 18px 18px 14px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  align-items: center;
  text-align: center;
}

.status {
  font: 700 10px var(--museo-text);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #fff;
  background: var(--museo-ember);
  padding: 4px 11px;
}
.status.cancelled {
  background: var(--museo-muted);
}

.museum {
  font: 700 17px var(--museo-display);
  letter-spacing: -0.01em;
  text-transform: uppercase;
  color: var(--museo-cream);
  line-height: 1.12;
  margin-top: 4px;
}

.when {
  font: 600 12px var(--museo-text);
  color: #a89d89;
}

.qr-wrap {
  display: flex;
  justify-content: center;
  padding: 2px 0 18px;
}

.qr {
  padding: 14px;
  background: var(--museo-cream);
  border-radius: var(--museo-radius);
  width: 178px;
  height: 178px;
}
.qr img {
  width: 150px;
  height: 150px;
  display: block;
  image-rendering: pixelated;
}

.perforation {
  position: relative;
}
.notch {
  position: absolute;
  top: -9px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--museo-surface);
}
.notch.left {
  left: -10px;
}
.notch.right {
  right: -10px;
}
.dash {
  border-top: 2px dashed var(--museo-dark-line-2);
  margin: 0 16px;
}

.details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 12px;
  padding: 18px 20px;
}

.label {
  font: 700 9px var(--museo-text);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--museo-muted-dark);
}

.value {
  font: 600 13px var(--museo-text);
  color: var(--museo-cream);
  margin-top: 3px;
}
.value.mono {
  font-family: ui-monospace, monospace;
}

.tail {
  height: 16px;
}

.ticket-footer {
  flex: 0 0 auto;
  padding: 8px 20px 12px;
  padding-bottom: calc(12px + var(--ion-safe-area-bottom, 0px));
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cancel {
  background: none;
  border: none;
  font: 700 11px var(--museo-text);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--museo-muted);
  cursor: pointer;
  padding: 6px 0;
}
</style>
