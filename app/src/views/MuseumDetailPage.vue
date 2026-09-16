<template>
  <ion-page>
    <ion-content :fullscreen="true" :scroll-y="false">
      <div class="screen">
        <StateBlock v-if="museums.detailLoading && !m" loading />

        <StateBlock
          v-else-if="museums.detailError && !m"
          icon="cloud_off"
          title="Can't load this museum"
          :message="museums.detailError"
          action-label="Try again"
          @action="museums.loadDetail(id)"
        />

        <template v-else-if="m">
          <div class="scroll mscroll">
            <MuseumImage
              class="hero"
              :src="m.image_url"
              :alt="m.name"
              :seed="m.id"
              :stripe="14"
            >
              <div class="hero-shade" />
              <div class="hero-top">
                <button class="round" type="button" @click="back">
                  <span class="msym">arrow_back</span>
                </button>
                <div class="hero-actions">
                  <button class="round" type="button" @click="share">
                    <span class="msym">ios_share</span>
                  </button>
                  <button
                    class="round"
                    type="button"
                    :aria-pressed="favourite"
                    @click="favourite = !favourite"
                  >
                    <span class="msym heart" :class="{ on: favourite }"
                      >favorite</span
                    >
                  </button>
                </div>
              </div>
              <div class="hero-text">
                <span class="tag">{{ CATEGORY_LABELS[m.category] }}</span>
                <h1 class="name">{{ m.name }}</h1>
              </div>
            </MuseumImage>

            <div class="body">
              <div class="topline">
                <span class="rating">★ {{ ratingStr(m.avg_rating) }}</span>
                <span class="reviews">({{ m.review_count }} reviews)</span>
                <span class="open" :class="{ shut: !openNow.open }">
                  <i />
                  {{ openNow.label }}
                </span>
              </div>

              <div class="fact">
                <span class="msym">schedule</span>{{ m.opening_hours }}
              </div>
              <div class="fact">
                <span class="msym">payments</span>
                {{ price(m.admission_fee) }} admission<template v-if="distance">
                  · {{ distance }} away</template
                >
              </div>
              <div class="fact">
                <span class="msym">location_on</span>{{ m.address }},
                {{ m.city }}
              </div>

              <p class="desc">{{ m.description }}</p>

              <div class="museo-rule" />

              <div class="museo-section-title">On view now</div>
              <div class="exhibitions">
                <div
                  v-for="ex in m.exhibitions"
                  :key="ex.id"
                  class="exhibition"
                >
                  <MuseumImage
                    class="ex-thumb"
                    :src="ex.image_url"
                    :alt="ex.title"
                    :seed="ex.id"
                  />
                  <div class="ex-text">
                    <div class="ex-title">{{ ex.title }}</div>
                    <div
                      class="ex-dates"
                      :class="{ permanent: ex.type === 'permanent' }"
                    >
                      {{ exhibitionDates(ex.type, ex.end_date) }}
                    </div>
                  </div>
                </div>
              </div>

              <div class="museo-rule" />

              <div class="reviews-head">
                <span class="museo-section-title">Reviews</span>
                <span
                  class="write"
                  @click="router.push(`/museum/${id}/review`)"
                >
                  {{ myReview ? "Edit your review" : "Write a review" }}
                </span>
              </div>

              <div v-if="museums.reviews.length" class="review-list">
                <div v-for="r in museums.reviews" :key="r.id" class="review">
                  <div class="review-head">
                    <span class="review-name">
                      {{ r.user_id === auth.user?.id ? "You" : r.user_name }}
                    </span>
                    <span class="review-date">{{
                      relativeDate(r.created_at)
                    }}</span>
                  </div>
                  <div class="review-stars">
                    <span class="full">{{ stars(r.rating).full }}</span>
                    <span class="empty">{{ stars(r.rating).empty }}</span>
                  </div>
                  <p v-if="r.comment" class="review-text">{{ r.comment }}</p>
                </div>
              </div>
              <div v-else class="no-reviews">
                No reviews yet. Be the first to leave one.
              </div>

              <div class="tail" />
            </div>
          </div>

          <div class="museo-footer">
            <div class="from">
              <span class="from-label">From</span>
              <span class="from-price">{{ price(m.admission_fee) }}</span>
            </div>
            <button class="museo-btn book" type="button" @click="book">
              Book a visit
            </button>
          </div>
        </template>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonPage, toastController } from "@ionic/vue";
import { computed, ref, watch } from "vue";
import { onBeforeRouteUpdate, useRoute, useRouter } from "vue-router";

import MuseumImage from "@/components/MuseumImage.vue";
import StateBlock from "@/components/StateBlock.vue";
import { useAuthStore } from "@/stores/auth";
import { useBookingsStore } from "@/stores/bookings";
import { useMuseumsStore } from "@/stores/museums";
import {
  CATEGORY_LABELS,
  distanceLabel,
  exhibitionDates,
  openState,
  price,
  ratingStr,
  relativeDate,
  stars,
} from "@/utils/format";

const route = useRoute();
const router = useRouter();
const museums = useMuseumsStore();
const bookings = useBookingsStore();
const auth = useAuthStore();

const favourite = ref(false);

const id = computed(() => Number(route.params.id));
const m = computed(() =>
  museums.detail?.id === id.value ? museums.detail : null,
);

const distance = computed(() =>
  m.value ? distanceLabel(m.value, museums.origin) : "",
);
const openNow = computed(() =>
  m.value ? openState(m.value.opening_hours) : { open: false, label: "" },
);
const myReview = computed(() =>
  museums.reviews.find((r) => r.user_id === auth.user?.id),
);

function load() {
  if (Number.isFinite(id.value)) void museums.loadDetail(id.value);
}

load();
// refetch when navigating museum → museum without unmounting the view
onBeforeRouteUpdate((to) => {
  const next = Number(to.params.id);
  if (Number.isFinite(next)) void museums.loadDetail(next);
});
watch(id, load);

function back() {
  router.back();
}

function book() {
  bookings.startDraft(id.value);
  router.push(`/museum/${id.value}/book`);
}

async function share() {
  const text = m.value
    ? `${m.value.name} — ${m.value.address}, ${m.value.city}`
    : "";
  try {
    if (navigator.share) {
      await navigator.share({ title: m.value?.name, text });
      return;
    }
    await navigator.clipboard.writeText(text);
    const toast = await toastController.create({
      message: "Copied to clipboard",
      duration: 1500,
    });
    await toast.present();
  } catch {
    // user dismissed the share sheet -> nothing to do.
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

.scroll {
  flex: 1 1 auto;
  overflow-y: auto;
  min-height: 0;
}

.hero {
  height: 300px;
  flex: 0 0 auto;
}

.hero-shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(34, 28, 22, 0.5) 0%,
    rgba(34, 28, 22, 0) 28%,
    rgba(34, 28, 22, 0) 52%,
    rgba(34, 28, 22, 0.85) 100%
  );
}

.hero-top {
  position: absolute;
  top: calc(14px + var(--ion-safe-area-top, 0px));
  left: 16px;
  right: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.hero-actions {
  display: flex;
  gap: 8px;
}

.round {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: var(--museo-radius);
  background: rgba(34, 28, 22, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
}
.round .msym {
  font-size: 19px;
  color: var(--museo-cream);
}

/*
 * Material Symbols has one `favorite` glyph; outlined vs filled is the FILL
 * variable axis, not a separate `favorite_border` name. The font is requested
 * with FILL as a 0..1 range so this can actually vary.
 */
.heart {
  font-variation-settings: "FILL" 0;
  transition: color 0.15s ease;
}
.heart.on {
  font-variation-settings: "FILL" 1;
  color: var(--museo-ember);
}

.hero-text {
  position: absolute;
  left: 18px;
  right: 18px;
  bottom: 16px;
}

.tag {
  font: 700 10px var(--museo-text);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #fff;
  background: var(--museo-ember);
  padding: 4px 9px;
}

.name {
  font: 700 27px var(--museo-display);
  letter-spacing: -0.01em;
  text-transform: uppercase;
  color: var(--museo-cream);
  line-height: 1.02;
  margin: 10px 0 0;
}

.body {
  padding: 16px 20px 0;
}

.topline {
  display: flex;
  align-items: center;
  gap: 10px;
  font: 700 12px var(--museo-text);
  color: var(--museo-ink);
}
.rating {
  color: var(--museo-ember);
}
.reviews {
  color: var(--museo-muted-2);
  font-weight: 500;
}
.open {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  color: var(--museo-open);
  white-space: nowrap;
}
.open i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}
.open.shut {
  color: var(--museo-muted);
}

.fact {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  font: 600 12px var(--museo-text);
  color: var(--museo-body-2);
}
.fact .msym {
  font-size: 18px;
  color: var(--museo-muted);
  flex: 0 0 auto;
}

.desc {
  font: 400 13.5px var(--museo-text);
  color: var(--museo-body);
  line-height: 1.55;
  margin: 14px 0 0;
}

.exhibitions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 12px;
}

.exhibition {
  display: flex;
  gap: 12px;
  align-items: center;
  border: var(--museo-border) solid var(--museo-line);
  border-radius: var(--museo-radius);
  background: var(--museo-card);
  overflow: hidden;
}

.ex-thumb {
  width: 66px;
  height: 66px;
  flex: 0 0 auto;
}

.ex-text {
  flex: 1;
  min-width: 0;
  padding-right: 10px;
}

.ex-title {
  font: 700 12px var(--museo-display);
  letter-spacing: -0.01em;
  text-transform: uppercase;
  color: var(--museo-ink);
  line-height: 1.15;
}

.ex-dates {
  font: 700 9.5px var(--museo-text);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-top: 5px;
  color: var(--museo-ember);
}
.ex-dates.permanent {
  color: var(--museo-muted-2);
}

.reviews-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.write {
  font: 700 11px var(--museo-text);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--museo-ember);
  cursor: pointer;
}

.review-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 14px;
}

.review {
  border: var(--museo-border) solid var(--museo-line);
  border-radius: var(--museo-radius);
  background: var(--museo-card);
  padding: 12px;
}

.review-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.review-name {
  font: 700 12px var(--museo-text);
  color: var(--museo-ink);
}

.review-date {
  font: 500 11px var(--museo-text);
  color: var(--museo-muted-2);
}

.review-stars {
  margin-top: 4px;
  font-size: 12px;
  letter-spacing: 1px;
}
.review-stars .full {
  color: var(--museo-ember);
}
.review-stars .empty {
  color: var(--museo-star-empty);
}

.review-text {
  font: 400 12.5px var(--museo-text);
  color: var(--museo-body);
  line-height: 1.5;
  margin: 8px 0 0;
}

.no-reviews {
  border: var(--museo-border) dashed #d3c9b7;
  border-radius: var(--museo-radius);
  padding: 22px;
  text-align: center;
  font: 500 12.5px var(--museo-text);
  color: var(--museo-muted-2);
  margin-top: 14px;
}

.tail {
  height: 8px;
}

.from {
  display: flex;
  flex-direction: column;
}
.from-label {
  font: 600 9px var(--museo-text);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--museo-muted-2);
}
.from-price {
  font: 700 18px var(--museo-display);
  color: var(--museo-ink);
}

.book {
  flex: 1;
  width: auto;
  height: 48px;
}
</style>
