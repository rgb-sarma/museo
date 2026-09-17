<template>
  <ion-page>
    <ion-content :fullscreen="true" :scroll-y="false">
      <div class="screen">
        <div class="scroll mscroll">
          <StateBlock
            v-if="!auth.isAuthenticated"
            icon="person"
            title="You're browsing as a guest"
            message="Log in to book visits, keep your tickets and leave reviews."
            action-label="Log in or register"
            @action="signIn"
          />

          <template v-else>
            <div class="identity">
              <div class="avatar">{{ auth.initials }}</div>
              <div>
                <div class="name">{{ auth.user?.full_name }}</div>
                <div class="email">{{ auth.user?.email }}</div>
              </div>
            </div>

            <div class="stats">
              <div class="stat">
                <div class="stat-value">{{ bookings.all.length }}</div>
                <div class="stat-label">Bookings</div>
              </div>
              <div class="stat">
                <div class="stat-value">{{ myReviews.length }}</div>
                <div class="stat-label">Reviews</div>
              </div>
            </div>

            <div class="museo-section-title section">Your reviews</div>

            <StateBlock v-if="loading" loading />

            <div v-else-if="myReviews.length" class="reviews">
              <button
                v-for="r in myReviews"
                :key="r.id"
                type="button"
                class="review"
                @click="router.push(`/museum/${r.museum_id}`)"
              >
                <div class="review-head">
                  <span class="review-museum">{{ r.museum_name }}</span>
                  <span class="review-stars">
                    <span class="full">{{ stars(r.rating).full }}</span>
                    <span class="empty">{{ stars(r.rating).empty }}</span>
                  </span>
                </div>
                <p v-if="r.comment" class="review-text">{{ r.comment }}</p>
              </button>
            </div>

            <div v-else class="no-reviews">
              You haven't left a review yet. Open a museum to add one.
            </div>

            <button class="museo-btn-outline logout" type="button" @click="confirmLogout">
              <span class="msym">logout</span>Log out
            </button>
          </template>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonPage, alertController } from '@ionic/vue';
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { museumsApi, type Review } from '@/api';
import StateBlock from '@/components/StateBlock.vue';
import { useAuthStore } from '@/stores/auth';
import { useBookingsStore } from '@/stores/bookings';
import { stars } from '@/utils/format';

const router = useRouter();
const auth = useAuthStore();
const bookings = useBookingsStore();

const myReviews = ref<Review[]>([]);
const loading = ref(true);

function signIn() {
  router.push({ path: '/login', query: { redirect: '/tabs/profile' } });
}

// both calls need a token; the tab survives the login round trip, so load on the
// flag rather than on mount
watch(
  () => auth.isAuthenticated,
  async (signedIn) => {
    if (!signedIn) {
      myReviews.value = [];
      loading.value = false;
      return;
    }
    loading.value = true;
    if (!bookings.all.length) void bookings.load();
    try {
      myReviews.value = await museumsApi.myReviews();
    } catch {
      myReviews.value = [];
    } finally {
      loading.value = false;
    }
  },
  { immediate: true },
);

async function confirmLogout() {
  const alert = await alertController.create({
    header: 'Log out?',
    buttons: [
      { text: 'Stay', role: 'cancel' },
      {
        text: 'Log out',
        role: 'destructive',
        handler: () => {
          bookings.reset();
          auth.logout();
          // browsing stays open, so drop back into Discover rather than the login wall
          router.replace('/tabs/discover');
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

.scroll {
  flex: 1 1 auto;
  overflow-y: auto;
  min-height: 0;
  padding: 6px 20px 24px;
  padding-top: calc(12px + var(--ion-safe-area-top, 0px));
}

.identity {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 6px;
}

.avatar {
  width: 60px;
  height: 60px;
  border-radius: 5px;
  background: var(--museo-ember);
  display: flex;
  align-items: center;
  justify-content: center;
  font: 700 24px var(--museo-display);
  color: #fff;
  flex: 0 0 auto;
}

.name {
  font: 700 19px var(--museo-display);
  letter-spacing: -0.01em;
  color: var(--museo-ink);
}

.email {
  font: 500 13px var(--museo-text);
  color: var(--museo-muted);
  margin-top: 2px;
}

.stats {
  display: flex;
  gap: 10px;
  margin-top: 18px;
}

.stat {
  flex: 1;
  border: var(--museo-border) solid var(--museo-line);
  border-radius: var(--museo-radius);
  background: var(--museo-card);
  padding: 14px;
}

.stat-value {
  font: 700 24px var(--museo-display);
  color: var(--museo-ink);
}

.stat-label {
  font: 600 10px var(--museo-text);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--museo-muted-2);
  margin-top: 2px;
}

.museo-section-title.section {
  margin: 22px 0 10px;
}

.reviews {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.review {
  display: block;
  width: 100%;
  text-align: left;
  border: var(--museo-border) solid var(--museo-line);
  border-radius: var(--museo-radius);
  background: var(--museo-card);
  padding: 12px;
  cursor: pointer;
}

.review-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.review-museum {
  font: 700 12px var(--museo-display);
  text-transform: uppercase;
  letter-spacing: -0.01em;
  color: var(--museo-ink);
  min-width: 0;
}

.review-stars {
  font-size: 12px;
  letter-spacing: 1px;
  flex: 0 0 auto;
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

/* Named distinctly from `.review-stars .empty` above, which is the unfilled stars. */
.no-reviews {
  border: var(--museo-border) dashed #d3c9b7;
  border-radius: var(--museo-radius);
  padding: 22px;
  text-align: center;
  font: 500 12.5px var(--museo-text);
  color: var(--museo-muted-2);
}

.logout {
  margin-top: 22px;
}
</style>
