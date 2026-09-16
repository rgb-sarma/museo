<template>
  <ion-page>
    <ion-content :fullscreen="true" :scroll-y="false">
      <div class="screen">
        <div class="museo-topbar">
          <button class="museo-iconbtn" type="button" @click="router.back()">
            <span class="msym">close</span>
          </button>
          <span class="museo-topbar-title">Write a review</span>
        </div>

        <div class="scroll mscroll">
          <h1 class="museum">{{ m?.name }}</h1>
          <p class="prompt">How was your visit?</p>

          <div class="stars">
            <button
              v-for="n in 5"
              :key="n"
              type="button"
              class="star"
              :class="{ on: n <= rating }"
              :aria-label="`${n} star${n > 1 ? 's' : ''}`"
              @click="rating = n"
            >
              ★
            </button>
          </div>

          <div class="museo-field-label section">Your thoughts (optional)</div>
          <textarea v-model="text" class="area" placeholder="What stood out?" />

          <p v-if="museums.detailError" class="error">
            {{ museums.detailError }}
          </p>
        </div>

        <div class="review-footer">
          <button
            class="museo-btn"
            type="button"
            :disabled="!rating || submitting"
            @click="submit"
          >
            {{ submitting ? "Submitting…" : "Submit review" }}
          </button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonPage, toastController } from "@ionic/vue";
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

import { useAuthStore } from "@/stores/auth";
import { useMuseumsStore } from "@/stores/museums";

const route = useRoute();
const router = useRouter();
const museums = useMuseumsStore();
const auth = useAuthStore();

const rating = ref(0);
const text = ref("");
const submitting = ref(false);

const id = computed(() => Number(route.params.id));
const m = computed(() =>
  museums.detail?.id === id.value ? museums.detail : null,
);

onMounted(() => {
  if (!m.value) void museums.loadDetail(id.value);
  // editing rather than adding: prefill from the existing review
  const mine = museums.reviews.find((r) => r.user_id === auth.user?.id);
  if (mine) {
    rating.value = mine.rating;
    text.value = mine.comment ?? "";
  }
});

async function submit() {
  if (!rating.value) return;
  submitting.value = true;
  const ok = await museums.submitReview(
    id.value,
    rating.value,
    text.value.trim() || null,
  );
  submitting.value = false;
  if (ok) {
    const toast = await toastController.create({
      message: "Thanks for your review",
      duration: 1800,
    });
    await toast.present();
    router.back();
  }
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
  padding: 10px 24px 20px;
}

.museum {
  font: 700 18px var(--museo-display);
  letter-spacing: -0.01em;
  text-transform: uppercase;
  color: var(--museo-ink);
  line-height: 1.1;
  margin: 0;
}

.prompt {
  font: 500 13px var(--museo-text);
  color: var(--museo-muted);
  margin: 6px 0 0;
}

.stars {
  display: flex;
  gap: 10px;
  margin-top: 18px;
  justify-content: center;
}

.star {
  font-size: 40px;
  line-height: 1;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: var(--museo-star-empty);
}
.star.on {
  color: var(--museo-ember);
}

.museo-field-label.section {
  margin: 24px 0 8px;
}

.area {
  width: 100%;
  height: 120px;
  border-radius: var(--museo-radius);
  border: var(--museo-border) solid var(--museo-line);
  background: var(--museo-card);
  padding: 12px 14px;
  font: 500 13.5px var(--museo-text);
  color: var(--museo-ink);
  outline: none;
  resize: none;
}

.error {
  font: 500 12.5px var(--museo-text);
  color: #b3401f;
  margin: 12px 0 0;
}

.review-footer {
  flex: 0 0 auto;
  padding: 12px 20px;
  padding-bottom: calc(12px + var(--ion-safe-area-bottom, 0px));
  border-top: var(--museo-border) solid var(--museo-line);
  background: var(--museo-surface);
}
</style>
