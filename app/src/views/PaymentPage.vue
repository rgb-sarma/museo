<template>
  <ion-page>
    <ion-content :fullscreen="true" :scroll-y="false">
      <div class="screen">
        <div class="museo-topbar">
          <button class="museo-iconbtn" type="button" @click="router.back()">
            <span class="msym">arrow_back</span>
          </button>
          <span class="museo-topbar-title">Payment</span>
        </div>

        <div class="scroll mscroll">
          <div class="order">
            <div class="museo-field-label">Order summary</div>
            <div class="order-row strong">{{ m?.name }}</div>
            <div class="order-row">
              {{ longDate(bookings.draft.date) }} ·
              {{ bookings.draft.slot ?? "—" }}
            </div>
            <div class="order-row split">
              <span>{{ bookings.draft.qty }} × Adult</span>
              <span>{{ price(total) }}</span>
            </div>
            <div class="order-rule" />
            <div class="order-total">
              <span>Total</span>
              <span>{{ price(total) }}</span>
            </div>
          </div>

          <div class="notice">
            <span class="msym">lock</span>
            <span>Card details — demo, no real charge</span>
          </div>

          <div class="fields">
            <div>
              <div class="museo-field-label">Card number</div>
              <input
                v-model="card"
                class="museo-input"
                placeholder="4242 4242 4242 4242"
                inputmode="numeric"
              />
            </div>
            <div class="pair">
              <div>
                <div class="museo-field-label">Expiry</div>
                <input
                  v-model="expiry"
                  class="museo-input"
                  placeholder="06/29"
                  inputmode="numeric"
                />
              </div>
              <div>
                <div class="museo-field-label">CVC</div>
                <input
                  v-model="cvc"
                  class="museo-input"
                  placeholder="123"
                  inputmode="numeric"
                />
              </div>
            </div>
            <div>
              <div class="museo-field-label">Name on card</div>
              <input
                v-model="name"
                class="museo-input"
                :placeholder="auth.user?.full_name ?? 'Petar Ilić'"
              />
            </div>
          </div>

          <p v-if="bookings.error" class="error">{{ bookings.error }}</p>
        </div>

        <div class="pay-footer">
          <button
            class="museo-btn"
            type="button"
            :disabled="bookings.submitting"
            @click="pay"
          >
            {{ bookings.submitting ? "Processing…" : `Pay ${price(total)}` }}
          </button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonPage } from "@ionic/vue";
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

import { useAuthStore } from "@/stores/auth";
import { useBookingsStore } from "@/stores/bookings";
import { useMuseumsStore } from "@/stores/museums";
import { longDate, price } from "@/utils/format";

const route = useRoute();
const router = useRouter();
const museums = useMuseumsStore();
const bookings = useBookingsStore();
const auth = useAuthStore();

// purely cosmetic -> nothing here is sent anywhere
const card = ref("");
const expiry = ref("");
const cvc = ref("");
const name = ref("");

const id = computed(() => Number(route.params.id));
const m = computed(() =>
  museums.detail?.id === id.value ? museums.detail : null,
);
const total = computed(() =>
  m.value ? m.value.admission_fee * bookings.draft.qty : 0,
);

async function pay() {
  const booking = await bookings.confirm();
  if (booking) router.replace(`/booking/${booking.id}/success`);
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
  padding: 6px 20px 20px;
}

.order {
  border: var(--museo-border) solid var(--museo-line);
  border-radius: var(--museo-radius);
  background: var(--museo-card);
  padding: 14px;
}

.order-row {
  margin-top: 8px;
  font: 500 12px var(--museo-text);
  color: var(--museo-body);
}
.order-row.strong {
  margin-top: 10px;
  font: 600 13px var(--museo-text);
  color: var(--museo-ink);
}
.order-row.split {
  display: flex;
  justify-content: space-between;
}

.order-rule {
  height: var(--museo-border);
  background: var(--museo-line-soft);
  margin: 12px 0;
}

.order-total {
  display: flex;
  justify-content: space-between;
  font: 700 14px var(--museo-display);
  color: var(--museo-ink);
}

.notice {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 18px 0 10px;
}
.notice .msym {
  font-size: 18px;
  color: var(--museo-muted);
}
.notice span:last-child {
  font: 600 10px var(--museo-text);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--museo-muted-2);
}

.fields {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pair {
  display: flex;
  gap: 10px;
}
.pair > div {
  flex: 1;
}

.error {
  font: 500 12.5px var(--museo-text);
  color: #b3401f;
  margin: 12px 0 0;
}

.pay-footer {
  flex: 0 0 auto;
  padding: 12px 20px;
  padding-bottom: calc(12px + var(--ion-safe-area-bottom, 0px));
  border-top: var(--museo-border) solid var(--museo-line);
  background: var(--museo-surface);
}
</style>
