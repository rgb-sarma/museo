# thesis-dump.md

Generated 2026-09-17 from the working tree at `/Users/laminat/Projects/museo` (branch `main`, commit `a496a57`, with uncommitted modifications present).

---

## Part 1 — Three questions

### 1. `app/src/views/TicketPage.vue` — is the "add to calendar" control wired to `utils/calendar.ts`?

**Yes, it is wired and working.** A footer button calls `addToCalendar`, which calls `downloadICS` imported from `@/utils/calendar`; that helper builds a VEVENT blob and triggers an anchor download.

Lines it is based on — `app/src/views/TicketPage.vue`:

```
64	        <div v-if="b" class="ticket-footer">
65	          <button
66	            class="museo-btn-outline"
67	            type="button"
68	            @click="addToCalendar"
69	          >
70	            <span class="msym">calendar_add_on</span>Add to calendar
71	          </button>
```

```
99	import { downloadICS } from "@/utils/calendar";
```

```
137	function addToCalendar() {
138	  if (b.value) downloadICS(b.value);
139	}
```

`app/src/utils/calendar.ts`:

```
42	export function downloadICS(booking: Booking): void {
43	  const blob = new Blob([bookingToICS(booking)], {
44	    type: "text/calendar;charset=utf-8",
45	  });
```

### 2. `app/src/views/BookingsPage.vue` — is there a cancel button calling `PATCH /bookings/{id}/cancel`?

**Not in `BookingsPage.vue` — but the endpoint is not unused.** Each booking card in that file is a single button that only navigates to the ticket route; the cancel control lives in `TicketPage.vue`, which reaches `PATCH /bookings/{id}/cancel` through the bookings store.

Lines it is based on — `app/src/views/BookingsPage.vue` (the only `@click` on a card, and the whole of its `<script setup>` imports — no `cancel` anywhere):

```
34	            <button
35	              v-for="b in bookings.visible"
36	              :key="b.id"
37	              type="button"
38	              class="booking"
39	              @click="router.push(`/booking/${b.id}`)"
40	            >
```

`app/src/views/TicketPage.vue`:

```
72	          <button
73	            v-if="b.status !== 'cancelled' && isUpcoming"
74	            class="cancel"
75	            type="button"
76	            @click="confirmCancel"
77	          >
78	            Cancel this booking
79	          </button>
```

```
150	        handler: async () => {
151	          if (await bookings.cancel(id.value)) {
```

`app/src/stores/bookings.ts`:

```
120	  async function cancel(id: number): Promise<boolean> {
121	    try {
122	      const updated = await bookingsApi.cancel(id);
```

`app/src/api/index.ts`:

```
84	  async cancel(id: number): Promise<Booking> {
85	    const { data } = await http.patch<Booking>(`/bookings/${id}/cancel`);
86	    return data;
87	  },
```

### 3. `app/src/views/DiscoverPage.vue` — does it call `@capacitor/geolocation`, and what happens when permission is denied?

**It calls geolocation indirectly** — the view calls `museums.detectCity()` on mount, and the store calls `Geolocation.getCurrentPosition`; the city button is a manual picker on top of that. **On denial** the rejected promise is swallowed by a bare `catch`, `origin` falls back to the selected city's centre, and `loadDiscover()` still runs in `finally` using the stored city — no error is shown to the user.

Lines it is based on — `app/src/views/DiscoverPage.vue`:

```
83	onMounted(() => {
84	  void museums.detectCity();
85	});
```

```
9	              <button class="city" type="button" @click="pickCity">
```

```
91	async function pickCity() {
92	  const sheet = await actionSheetController.create({
93	    header: "Choose a city",
94	    buttons: [
95	      ...CITIES.map((c) => ({
96	        text: c.name,
97	        handler: () => museums.setCity(c.name),
98	      })),
```

`app/src/stores/museums.ts`:

```
1	import { Geolocation } from "@capacitor/geolocation";
```

```
73	  /**
74	   * try the device GPS and snap to the nearest seeded city
75	   * failure silently falls back to the stored city so a demo never depends on location working
76	   */
77	  async function detectCity(): Promise<void> {
78	    locating.value = true;
79	    try {
80	      const pos = await Geolocation.getCurrentPosition({ timeout: 8000 });
```

```
95	    } catch {
96	      origin.value = { ...cityCentre.value };
97	    } finally {
98	      locating.value = false;
99	      await loadDiscover();
100	    }
```

Related fact from the same read: `app/android/app/src/main/AndroidManifest.xml` declares no location permission — the only `uses-permission` in the file is

```
40	    <uses-permission android:name="android.permission.INTERNET" />
```

---

## Part 2 — Full file dumps

### `app/src/router/index.ts`

```ts
import { createRouter, createWebHistory } from "@ionic/vue-router";
import type { RouteRecordRaw } from "vue-router";

import { useAuthStore } from "@/stores/auth";
import TabsPage from "@/views/TabsPage.vue";

const routes: Array<RouteRecordRaw> = [
  { path: "/", redirect: "/tabs/discover" },

  {
    path: "/login",
    component: () => import("@/views/LoginPage.vue"),
    meta: { public: true },
  },
  {
    path: "/register",
    component: () => import("@/views/RegisterPage.vue"),
    meta: { public: true },
  },

  {
    path: "/tabs/",
    component: TabsPage,
    children: [
      { path: "", redirect: "/tabs/discover" },
      { path: "discover", component: () => import("@/views/DiscoverPage.vue") },
      { path: "search", component: () => import("@/views/SearchPage.vue") },
      { path: "bookings", component: () => import("@/views/BookingsPage.vue") },
      { path: "profile", component: () => import("@/views/ProfilePage.vue") },
    ],
  },

  // stacked over the tabs so they get a full-screen push transition.
  {
    path: "/museum/:id",
    component: () => import("@/views/MuseumDetailPage.vue"),
  },
  {
    path: "/museum/:id/book",
    component: () => import("@/views/BookingPage.vue"),
  },
  {
    path: "/museum/:id/pay",
    component: () => import("@/views/PaymentPage.vue"),
  },
  {
    path: "/museum/:id/review",
    component: () => import("@/views/ReviewPage.vue"),
  },
  { path: "/booking/:id", component: () => import("@/views/TicketPage.vue") },
  {
    path: "/booking/:id/success",
    component: () => import("@/views/SuccessPage.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach((to) => {
  const auth = useAuthStore();
  if (!to.meta.public && !auth.isAuthenticated) return "/login";
  // skip the auth screens if already signed in
  if (to.meta.public && auth.isAuthenticated) return "/tabs/discover";
  return true;
});

export default router;
```

### `app/src/stores/auth.ts`

```ts
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import { authApi, errorMessage, type User } from '@/api';
import { TOKEN_KEY } from '@/api/client';

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY));
  const user = ref<User | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => token.value !== null);
  const initials = computed(() =>
    (user.value?.full_name ?? '?').trim().charAt(0).toUpperCase(),
  );

  function setSession(accessToken: string, nextUser: User) {
    token.value = accessToken;
    user.value = nextUser;
    localStorage.setItem(TOKEN_KEY, accessToken);
  }

  async function login(email: string, password: string): Promise<boolean> {
    loading.value = true;
    error.value = null;
    try {
      const res = await authApi.login(email, password);
      setSession(res.access_token, res.user);
      return true;
    } catch (err) {
      error.value = errorMessage(err, 'Could not log in');
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function register(
    full_name: string,
    email: string,
    password: string,
  ): Promise<boolean> {
    loading.value = true;
    error.value = null;
    try {
      const res = await authApi.register({ full_name, email, password });
      setSession(res.access_token, res.user);
      return true;
    } catch (err) {
      error.value = errorMessage(err, 'Could not create your account');
      return false;
    } finally {
      loading.value = false;
    }
  }

  /** Called on boot when a token is already in storage — proves it is still valid. */
  async function restore(): Promise<void> {
    if (!token.value) return;
    try {
      user.value = await authApi.me();
    } catch {
      logout();
    }
  }

  function logout(): void {
    token.value = null;
    user.value = null;
    error.value = null;
    localStorage.removeItem(TOKEN_KEY);
  }

  return {
    token,
    user,
    loading,
    error,
    isAuthenticated,
    initials,
    login,
    register,
    restore,
    logout,
  };
});
```

### `app/src/stores/museums.ts`

```ts
import { Geolocation } from "@capacitor/geolocation";
import { defineStore } from "pinia";
import { computed, ref } from "vue";

import {
  errorMessage,
  museumsApi,
  type Category,
  type Museum,
  type MuseumDetail,
  type Review,
} from "@/api";
import { haversineKm } from "@/utils/format";

export interface City {
  name: string;
  latitude: number;
  longitude: number;
}

export const CITIES: City[] = [
  { name: "Belgrade", latitude: 44.8125, longitude: 20.4612 },
  { name: "Novi Sad", latitude: 45.2671, longitude: 19.8335 },
  { name: "Vienna", latitude: 48.2082, longitude: 16.3738 },
];

const CITY_KEY = "museo.city";

export interface Filters {
  q: string;
  category: Category | null;
  minRating: number;
  sort: "top_rated" | "price";
}

export const useMuseumsStore = defineStore("museums", () => {
  const city = ref<string>(localStorage.getItem(CITY_KEY) ?? "Belgrade");
  /** real device coordinates when geolocation succeeds, else the chosen city centre. */
  const origin = ref<{ latitude: number; longitude: number } | null>(null);
  const locating = ref(false);

  const discover = ref<Museum[]>([]);
  const discoverLoading = ref(false);
  const discoverError = ref<string | null>(null);

  const results = ref<Museum[]>([]);
  const searchLoading = ref(false);
  const searchError = ref<string | null>(null);
  const filters = ref<Filters>({
    q: "",
    category: null,
    minRating: 0,
    sort: "top_rated",
  });

  const detail = ref<MuseumDetail | null>(null);
  const reviews = ref<Review[]>([]);
  const detailLoading = ref(false);
  const detailError = ref<string | null>(null);

  const cityCentre = computed(
    () => CITIES.find((c) => c.name === city.value) ?? CITIES[0],
  );

  function setCity(name: string): void {
    city.value = name;
    localStorage.setItem(CITY_KEY, name);
    // fall back to the new city centre until geolocation says otherwise
    origin.value = { ...cityCentre.value };
    void loadDiscover();
  }

  /**
   * try the device GPS and snap to the nearest seeded city
   * failure silently falls back to the stored city so a demo never depends on location working
   */
  async function detectCity(): Promise<void> {
    locating.value = true;
    try {
      const pos = await Geolocation.getCurrentPosition({ timeout: 8000 });
      const here = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      };
      origin.value = here;

      const nearest = CITIES.reduce((best, c) =>
        haversineKm(here, c) < haversineKm(here, best) ? c : best,
      );
      // only switch if the user is plausibly in that city rather than another country
      if (haversineKm(here, nearest) < 60 && nearest.name !== city.value) {
        city.value = nearest.name;
        localStorage.setItem(CITY_KEY, nearest.name);
      }
    } catch {
      origin.value = { ...cityCentre.value };
    } finally {
      locating.value = false;
      await loadDiscover();
    }
  }

  async function loadDiscover(): Promise<void> {
    discoverLoading.value = true;
    discoverError.value = null;
    try {
      discover.value = await museumsApi.list({ city: city.value });
    } catch (err) {
      discoverError.value = errorMessage(err, "Could not load museums");
      discover.value = [];
    } finally {
      discoverLoading.value = false;
    }
  }

  async function search(): Promise<void> {
    searchLoading.value = true;
    searchError.value = null;
    try {
      const f = filters.value;
      results.value = await museumsApi.list({
        q: f.q || undefined,
        category: f.category ?? undefined,
        min_rating: f.minRating || undefined,
        sort: f.sort,
      });
    } catch (err) {
      searchError.value = errorMessage(err, "Could not search");
      results.value = [];
    } finally {
      searchLoading.value = false;
    }
  }

  function setFilters(patch: Partial<Filters>): void {
    filters.value = { ...filters.value, ...patch };
    void search();
  }

  async function loadDetail(id: number): Promise<void> {
    // keep the previous museum visible only if its the same one being refreshed
    if (detail.value?.id !== id) {
      detail.value = null;
      reviews.value = [];
    }
    detailLoading.value = true;
    detailError.value = null;
    try {
      const [d, r] = await Promise.all([
        museumsApi.detail(id),
        museumsApi.reviews(id),
      ]);
      detail.value = d;
      reviews.value = r;
    } catch (err) {
      detailError.value = errorMessage(err, "Could not load this museum");
    } finally {
      detailLoading.value = false;
    }
  }

  async function submitReview(
    id: number,
    rating: number,
    comment: string | null,
  ): Promise<boolean> {
    try {
      await museumsApi.addReview(id, rating, comment);
      // reread so the aggregate rating and count reflect the new review
      await loadDetail(id);
      void loadDiscover();
      return true;
    } catch (err) {
      detailError.value = errorMessage(err, "Could not submit your review");
      return false;
    }
  }

  return {
    city,
    origin,
    locating,
    cityCentre,
    discover,
    discoverLoading,
    discoverError,
    results,
    searchLoading,
    searchError,
    filters,
    detail,
    reviews,
    detailLoading,
    detailError,
    setCity,
    detectCity,
    loadDiscover,
    search,
    setFilters,
    loadDetail,
    submitReview,
  };
});
```

### `app/src/api/client.ts`

```ts
import axios from "axios";

/**
 * the web preview for this is localhost
 * on a device or emulator, set VITE_API_URL to the machine's LAN IP (e.g. http://192.168.1.20:8000)
 * in app/.env.local
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export const TOKEN_KEY = "museo.token";

export const http = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// pull a readable message out of a FastAPI error response.
export function errorMessage(
  err: unknown,
  fallback = "Something went wrong",
): string {
  if (axios.isAxiosError(err)) {
    const detail = err.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail[0]?.msg) return String(detail[0].msg);
    if (!err.response) return "Cannot reach the server. Is the API running?";
  }
  return fallback;
}
```

### `app/src/api/index.ts`

```ts
import { http } from './client';
import type {
  Booking,
  Museum,
  MuseumDetail,
  MuseumQuery,
  Review,
  TokenResponse,
  User,
} from './types';

export const authApi = {
  async register(body: {
    email: string;
    password: string;
    full_name: string;
  }): Promise<TokenResponse> {
    const { data } = await http.post<TokenResponse>('/auth/register', body);
    return data;
  },
  async login(email: string, password: string): Promise<TokenResponse> {
    const { data } = await http.post<TokenResponse>('/auth/login', { email, password });
    return data;
  },
  async me(): Promise<User> {
    const { data } = await http.get<User>('/auth/me');
    return data;
  },
};

export const museumsApi = {
  async list(query: MuseumQuery = {}): Promise<Museum[]> {
    const params: Record<string, string | number> = {};
    if (query.city) params.city = query.city;
    if (query.category) params.category = query.category;
    if (query.min_rating) params.min_rating = query.min_rating;
    if (query.q) params.q = query.q;
    if (query.sort) params.sort = query.sort;
    const { data } = await http.get<Museum[]>('/museums', { params });
    return data;
  },
  async detail(id: number): Promise<MuseumDetail> {
    const { data } = await http.get<MuseumDetail>(`/museums/${id}`);
    return data;
  },
  async reviews(id: number): Promise<Review[]> {
    const { data } = await http.get<Review[]>(`/museums/${id}/reviews`);
    return data;
  },
  async addReview(id: number, rating: number, comment: string | null): Promise<Review> {
    const { data } = await http.post<Review>(`/museums/${id}/reviews`, { rating, comment });
    return data;
  },
  async myReviews(): Promise<Review[]> {
    const { data } = await http.get<Review[]>('/reviews/me');
    return data;
  },
};

export const bookingsApi = {
  async slots(): Promise<string[]> {
    const { data } = await http.get<string[]>('/bookings/slots');
    return data;
  },
  async list(when?: 'upcoming' | 'past'): Promise<Booking[]> {
    const { data } = await http.get<Booking[]>('/bookings', {
      params: when ? { when } : {},
    });
    return data;
  },
  async get(id: number): Promise<Booking> {
    const { data } = await http.get<Booking>(`/bookings/${id}`);
    return data;
  },
  async create(body: {
    museum_id: number;
    visit_date: string;
    time_slot: string;
    num_tickets: number;
  }): Promise<Booking> {
    const { data } = await http.post<Booking>('/bookings', body);
    return data;
  },
  async cancel(id: number): Promise<Booking> {
    const { data } = await http.patch<Booking>(`/bookings/${id}/cancel`);
    return data;
  },
};

export * from './types';
export { API_BASE_URL, errorMessage } from './client';
```

### `app/capacitor.config.ts`

```ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'app',
  webDir: 'dist'
};

export default config;
```

### `app/package.json`

```json
{
  "name": "app",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc && vite build",
    "preview": "vite preview",
    "test:e2e": "cypress run",
    "test:unit": "vitest",
    "lint": "eslint ."
  },
  "dependencies": {
    "@capacitor/android": "^8.5.2",
    "@capacitor/app": "8.1.1",
    "@capacitor/core": "8.4.2",
    "@capacitor/geolocation": "^8.2.0",
    "@capacitor/haptics": "8.0.2",
    "@capacitor/keyboard": "8.0.5",
    "@capacitor/status-bar": "8.0.3",
    "@ionic/vue": "^8.0.0",
    "@ionic/vue-router": "^8.0.0",
    "axios": "^1.19.0",
    "ionicons": "^7.0.0",
    "pinia": "^4.0.2",
    "qrcode": "^1.5.4",
    "vue": "^3.3.0",
    "vue-router": "^4.2.0"
  },
  "devDependencies": {
    "@capacitor/cli": "8.4.2",
    "@types/qrcode": "^1.5.6",
    "@vitejs/plugin-legacy": "^5.0.0",
    "@vitejs/plugin-vue": "^4.0.0",
    "@vue/eslint-config-typescript": "^12.0.0",
    "@vue/test-utils": "^2.3.0",
    "cypress": "^13.5.0",
    "eslint": "^8.35.0",
    "eslint-plugin-vue": "^9.9.0",
    "jsdom": "^22.1.0",
    "terser": "^5.4.0",
    "typescript": "~5.9.0",
    "vite": "^5.0.0",
    "vitest": "^0.34.6",
    "vue-tsc": "^2.1.10"
  },
  "description": "An Ionic project"
}
```

### `app/src/views/DiscoverPage.vue`

```vue
<template>
  <ion-page>
    <ion-content :fullscreen="true" :scroll-y="false">
      <div class="screen">
        <header class="head">
          <div class="head-row">
            <div class="head-left">
              <span class="eyebrow">Discover</span>
              <button class="city" type="button" @click="pickCity">
                <span class="msym pin">location_on</span>
                {{ museums.city }}
                <span class="msym chev">expand_more</span>
              </button>
            </div>
            <div class="avatar">{{ auth.initials }}</div>
          </div>

          <button
            class="searchbar"
            type="button"
            @click="router.push('/tabs/search')"
          >
            <span class="msym">search</span>
            <span>Search museums &amp; exhibitions</span>
          </button>
        </header>

        <div class="list mscroll">
          <div class="list-head">
            <span class="museo-section-title">Popular near you</span>
            <span class="seeall" @click="router.push('/tabs/search')"
              >See all</span
            >
          </div>

          <StateBlock v-if="museums.discoverLoading" loading />

          <StateBlock
            v-else-if="museums.discoverError"
            icon="cloud_off"
            title="Can't reach the API"
            :message="museums.discoverError"
            action-label="Try again"
            @action="museums.loadDiscover()"
          />

          <StateBlock
            v-else-if="!museums.discover.length"
            icon="museum"
            title="Nothing in this city"
            message="Try another city from the picker above."
          />

          <div v-else class="cards">
            <MuseumCard
              v-for="m in museums.discover"
              :key="m.id"
              :museum="m"
              :origin="museums.origin"
              @open="openMuseum"
            />
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonPage, actionSheetController } from "@ionic/vue";
import { onMounted } from "vue";
import { useRouter } from "vue-router";

import MuseumCard from "@/components/MuseumCard.vue";
import StateBlock from "@/components/StateBlock.vue";
import { useAuthStore } from "@/stores/auth";
import { CITIES, useMuseumsStore } from "@/stores/museums";

const router = useRouter();
const auth = useAuthStore();
const museums = useMuseumsStore();

onMounted(() => {
  void museums.detectCity();
});

function openMuseum(id: number) {
  router.push(`/museum/${id}`);
}

async function pickCity() {
  const sheet = await actionSheetController.create({
    header: "Choose a city",
    buttons: [
      ...CITIES.map((c) => ({
        text: c.name,
        handler: () => museums.setCity(c.name),
      })),
      { text: "Cancel", role: "cancel" },
    ],
  });
  await sheet.present();
}
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
  background: var(--museo-dark);
  padding-top: var(--ion-safe-area-top, 0px);
  padding-bottom: 18px;
}

.head-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 0;
}

.head-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.eyebrow {
  font: 600 10px var(--museo-text);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--museo-muted-2);
}

.city {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  font: 700 25px var(--museo-display);
  letter-spacing: -0.01em;
  color: var(--museo-cream);
  text-transform: uppercase;
}
.city .pin {
  font-size: 21px;
  color: var(--museo-ember);
}
.city .chev {
  font-size: 18px;
  color: var(--museo-muted-2);
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--museo-radius);
  background: var(--museo-ember);
  display: flex;
  align-items: center;
  justify-content: center;
  font: 700 15px var(--museo-display);
  color: #fff;
  flex: 0 0 auto;
}

.searchbar {
  margin: 14px 20px 0;
  width: calc(100% - 40px);
  display: flex;
  align-items: center;
  gap: 8px;
  height: 44px;
  padding: 0 14px;
  border: none;
  border-radius: var(--museo-radius);
  background: var(--museo-dark-3);
  cursor: pointer;
  font: 400 13.5px var(--museo-text);
  color: var(--museo-muted-dark);
}
.searchbar .msym {
  font-size: 19px;
  color: var(--museo-muted-2);
}

.list {
  flex: 1 1 auto;
  overflow-y: auto;
  min-height: 0;
  padding: 0 20px 24px;
}

.list-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 16px 0 10px;
}
.list-head .museo-section-title {
  font-size: 16px;
}

.seeall {
  font: 700 11px var(--museo-text);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--museo-ember);
  cursor: pointer;
}

.cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
```

### `app/src/views/TicketPage.vue`

```vue
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
```

### `app/src/views/LoginPage.vue`

```vue
<template>
  <ion-page>
    <ion-content :fullscreen="true" class="dark-content" :scroll-y="false">
      <div class="screen">
        <div class="body">
          <div class="logo"><span class="msym">museum</span></div>
          <h1 class="wordmark">Museo</h1>
          <p class="tagline">
            Find museums, book timed entry, carry your ticket.
          </p>

          <form class="fields" @submit.prevent="submit">
            <div>
              <div class="museo-field-label">Email</div>
              <input
                v-model.trim="email"
                class="museo-input-dark"
                type="email"
                inputmode="email"
                autocomplete="email"
                required
              />
            </div>
            <div>
              <div class="museo-field-label">Password</div>
              <input
                v-model="password"
                class="museo-input-dark"
                type="password"
                autocomplete="current-password"
                required
              />
            </div>

            <p v-if="auth.error" class="error">{{ auth.error }}</p>

            <button
              class="museo-btn submit"
              type="submit"
              :disabled="auth.loading"
            >
              {{ auth.loading ? "Logging in…" : "Log in" }}
            </button>
          </form>

          <p class="switch">
            New here?
            <span @click="router.push('/register')">Create an account</span>
          </p>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonPage } from "@ionic/vue";
import { ref } from "vue";
import { useRouter } from "vue-router";

import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const auth = useAuthStore();

// prefilled with the seeded demo account
const email = ref("maja@example.com");
const password = ref("museodemo");

async function submit() {
  if (await auth.login(email.value, password.value)) {
    router.replace("/tabs/discover");
  }
}
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
}

.body {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 28px;
}

.logo {
  width: 52px;
  height: 52px;
  border-radius: 5px;
  background: var(--museo-ember);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 22px;
}
.logo .msym {
  font-size: 30px;
  color: #fff;
}

.wordmark {
  font: 700 40px var(--museo-display);
  letter-spacing: -0.02em;
  text-transform: uppercase;
  line-height: 0.98;
  margin: 0;
}

.tagline {
  font: 400 15px var(--museo-text);
  color: var(--museo-muted-dark-2);
  margin: 10px 0 0;
  line-height: 1.45;
}

.fields {
  margin-top: 30px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.submit {
  margin-top: 12px;
  height: 50px;
  font-size: 14px;
}

.error {
  font: 500 12.5px var(--museo-text);
  color: #ff8a6a;
  margin: 2px 0 0;
}

.switch {
  text-align: center;
  margin: 18px 0 0;
  font: 500 13px var(--museo-text);
  color: var(--museo-muted-dark-2);
}
.switch span {
  color: var(--museo-cream);
  font-weight: 700;
  cursor: pointer;
  border-bottom: var(--museo-border) solid var(--museo-ember);
  padding-bottom: 1px;
}
</style>
```

### `app/android/app/build.gradle`

```gradle
apply plugin: 'com.android.application'

android {
    namespace = "io.ionic.starter"
    compileSdk = rootProject.ext.compileSdkVersion
    defaultConfig {
        applicationId "io.ionic.starter"
        minSdkVersion rootProject.ext.minSdkVersion
        targetSdkVersion rootProject.ext.targetSdkVersion
        versionCode 1
        versionName "1.0"
        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
        aaptOptions {
             // Files and dirs to omit from the packaged assets dir, modified to accommodate modern web apps.
             // Default: https://android.googlesource.com/platform/frameworks/base/+/282e181b58cf72b6ca770dc7ca5f91f135444502/tools/aapt/AaptAssets.cpp#61
            ignoreAssetsPattern = '!.svn:!.git:!.ds_store:!*.scc:.*:!CVS:!thumbs.db:!picasa.ini:!*~'
        }
    }
    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}

repositories {
    flatDir{
        dirs '../capacitor-cordova-android-plugins/src/main/libs', 'libs'
    }
}

dependencies {
    implementation fileTree(include: ['*.jar'], dir: 'libs')
    implementation "androidx.appcompat:appcompat:$androidxAppCompatVersion"
    implementation "androidx.coordinatorlayout:coordinatorlayout:$androidxCoordinatorLayoutVersion"
    implementation "androidx.core:core-splashscreen:$coreSplashScreenVersion"
    implementation project(':capacitor-android')
    testImplementation "junit:junit:$junitVersion"
    androidTestImplementation "androidx.test.ext:junit:$androidxJunitVersion"
    androidTestImplementation "androidx.test.espresso:espresso-core:$androidxEspressoCoreVersion"
    implementation project(':capacitor-cordova-android-plugins')
}

apply from: 'capacitor.build.gradle'

try {
    def servicesJSON = file('google-services.json')
    if (servicesJSON.text) {
        apply plugin: 'com.google.gms.google-services'
    }
} catch(Exception e) {
    logger.info("google-services.json not found, google-services plugin not applied. Push Notifications won't work")
}
```

### `app/android/app/src/main/AndroidManifest.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme">

        <activity
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode|navigation|density"
            android:name=".MainActivity"
            android:label="@string/title_activity_main"
            android:theme="@style/AppTheme.NoActionBarLaunch"
            android:launchMode="singleTask"
            android:exported="true">

            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

        </activity>

        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="${applicationId}.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/file_paths"></meta-data>
        </provider>
    </application>

    <!-- Permissions -->

    <uses-permission android:name="android.permission.INTERNET" />
</manifest>
```

---

## Part 3 — `app/tests/e2e/`

Every file under `app/tests/e2e/`, with line counts (`wc -l`):

| File | Lines |
| --- | --- |
| `app/tests/e2e/fixtures/example.json` | 5 |
| `app/tests/e2e/specs/test.cy.ts` | 6 |
| `app/tests/e2e/support/commands.ts` | 36 |
| `app/tests/e2e/support/e2e.ts` | 19 |

Total: 4 files, 66 lines.

**Real test cases or scaffold:** scaffold only. The single spec is Ionic's generated starter test, unmodified — it asserts on `Tab 1 page`, which no longer exists anywhere in this app's views:

`app/tests/e2e/specs/test.cy.ts` (the entire file):

```ts
describe('My First Test', () => {
  it('Visits the app root url', () => {
    cy.visit('/')
    cy.contains('ion-content', 'Tab 1 page')
  })
})
```

`app/tests/e2e/support/commands.ts` is the generated template with every command commented out — the file's only non-comment line is line 1:

```ts
/// <reference types="cypress" />
```

`app/tests/e2e/support/e2e.ts` is the generated support file; its only executable line is line 17:

```ts
import './commands'
```

`app/tests/e2e/fixtures/example.json` is Cypress's stock example fixture:

```json
{
  "name": "Using fixtures to represent data",
  "email": "hello@cypress.io",
  "body": "Fixtures are a great way to mock data for responses to routes"
}
```

There are no custom commands, no fixtures used by any spec, and no test covering login, discover, booking, ticket, or cancel flows.

---

## Part 4 — Further full file dumps

Verbatim, except that in `.vue` files the body of each `<style scoped>` block is replaced with a single `/* styles omitted */` line.

### `app/src/stores/bookings.ts`

```ts
import { defineStore } from "pinia";
import { computed, ref } from "vue";

import { bookingsApi, errorMessage, type Booking } from "@/api";
import { toISODate } from "@/utils/format";

export interface BookingDraft {
  museumId: number | null;
  date: string;
  slot: string | null;
  qty: number;
}

function emptyDraft(): BookingDraft {
  return { museumId: null, date: toISODate(new Date()), slot: null, qty: 1 };
}

export const useBookingsStore = defineStore("bookings", () => {
  const draft = ref<BookingDraft>(emptyDraft());
  const slots = ref<string[]>([]);

  const all = ref<Booking[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const active = ref<Booking | null>(null);
  const submitting = ref(false);

  const tab = ref<"upcoming" | "past">("upcoming");

  const today = () => toISODate(new Date());
  const upcoming = computed(() =>
    all.value
      .filter((b) => b.visit_date >= today())
      .sort((a, b) => a.visit_date.localeCompare(b.visit_date)),
  );
  const past = computed(() =>
    all.value
      .filter((b) => b.visit_date < today())
      .sort((a, b) => b.visit_date.localeCompare(a.visit_date)),
  );
  const visible = computed(() =>
    tab.value === "upcoming" ? upcoming.value : past.value,
  );

  function startDraft(museumId: number): void {
    draft.value = { ...emptyDraft(), museumId };
  }

  function patchDraft(patch: Partial<BookingDraft>): void {
    draft.value = { ...draft.value, ...patch };
  }

  async function loadSlots(): Promise<void> {
    if (slots.value.length) return;
    try {
      slots.value = await bookingsApi.slots();
    } catch {
      // failsafe if the backend call fails
      slots.value = [
        "10:00",
        "11:00",
        "12:00",
        "13:00",
        "14:00",
        "15:00",
        "16:00",
        "17:00",
      ];
    }
  }

  async function load(): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      all.value = await bookingsApi.list();
    } catch (err) {
      error.value = errorMessage(err, "Could not load your bookings");
      all.value = [];
    } finally {
      loading.value = false;
    }
  }

  async function confirm(): Promise<Booking | null> {
    const d = draft.value;
    if (!d.museumId || !d.slot) return null;

    submitting.value = true;
    error.value = null;
    try {
      const booking = await bookingsApi.create({
        museum_id: d.museumId,
        visit_date: d.date,
        time_slot: d.slot,
        num_tickets: d.qty,
      });
      active.value = booking;
      all.value = [booking, ...all.value];
      return booking;
    } catch (err) {
      error.value = errorMessage(err, "Could not complete your booking");
      return null;
    } finally {
      submitting.value = false;
    }
  }

  async function open(id: number): Promise<void> {
    const known = all.value.find((b) => b.id === id);
    if (known) active.value = known;
    try {
      active.value = await bookingsApi.get(id);
    } catch (err) {
      if (!known) error.value = errorMessage(err, "Could not load that ticket");
    }
  }

  async function cancel(id: number): Promise<boolean> {
    try {
      const updated = await bookingsApi.cancel(id);
      all.value = all.value.map((b) => (b.id === id ? updated : b));
      if (active.value?.id === id) active.value = updated;
      return true;
    } catch (err) {
      error.value = errorMessage(err, "Could not cancel that booking");
      return false;
    }
  }

  function reset(): void {
    draft.value = emptyDraft();
    all.value = [];
    active.value = null;
    error.value = null;
    tab.value = "upcoming";
  }

  return {
    draft,
    slots,
    all,
    loading,
    error,
    active,
    submitting,
    tab,
    upcoming,
    past,
    visible,
    startDraft,
    patchDraft,
    loadSlots,
    load,
    confirm,
    open,
    cancel,
    reset,
  };
});
```

### `app/src/api/types.ts`

```ts
export type Category =
  | "art"
  | "history"
  | "natural_history"
  | "science"
  | "nature"
  | "archaeology"
  | "ethnographic"
  | "childrens"
  | "culture"
  | "specialty";

export type ExhibitionType = "temporary" | "permanent" | "special";
export type BookingStatus = "pending" | "confirmed" | "cancelled";

export interface User {
  id: number;
  email: string;
  full_name: string;
  phone_number: string | null;
  is_verified: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Exhibition {
  id: number;
  title: string;
  description: string;
  type: ExhibitionType;
  start_date: string;
  end_date: string | null;
  image_url: string;
}

export interface Museum {
  id: number;
  name: string;
  category: Category;
  description: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  image_url: string;
  opening_hours: string;
  admission_fee: number;
  avg_rating: number;
  review_count: number;
}

export interface MuseumDetail extends Museum {
  contact: string;
  exhibitions: Exhibition[];
}

export interface Review {
  id: number;
  museum_id: number;
  museum_name: string;
  user_id: number;
  user_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface Booking {
  id: number;
  museum: Museum;
  visit_date: string;
  time_slot: string;
  num_tickets: number;
  total_price: number;
  status: BookingStatus;
  reference: string;
  created_at: string;
}

export interface MuseumQuery {
  city?: string;
  category?: Category;
  min_rating?: number;
  q?: string;
  sort?: "top_rated" | "price" | "name";
}
```

### `app/src/main.ts`

```ts
import { IonicVue } from "@ionic/vue";
import { createPinia } from "pinia";
import { createApp } from "vue";

import App from "./App.vue";
import router from "./router";

/* Core CSS required for Ionic components to work properly */
import "@ionic/vue/css/core.css";

/* Basic CSS for apps built with Ionic */
import "@ionic/vue/css/normalize.css";
import "@ionic/vue/css/structure.css";
import "@ionic/vue/css/typography.css";

/* Optional CSS utils that can be commented out */
import "@ionic/vue/css/padding.css";
import "@ionic/vue/css/float-elements.css";
import "@ionic/vue/css/text-alignment.css";
import "@ionic/vue/css/text-transformation.css";
import "@ionic/vue/css/flex-utils.css";
import "@ionic/vue/css/display.css";

// Theme variables
import "./theme/variables.css";

import { useAuthStore } from "./stores/auth";

const app = createApp(App).use(IonicVue).use(createPinia()).use(router);

async function bootstrap() {
  // validate any stored token before the first guarded navigation resolves so
  // we never flash a logged-in screen for a token the server has since rejected
  await useAuthStore().restore();
  await router.isReady();
  app.mount("#app");
}

void bootstrap();
```

### `app/src/App.vue`

```vue
<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue';
</script>
```

### `app/src/views/TabsPage.vue`

```vue
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
/* styles omitted */
</style>
```

### `app/src/views/MuseumDetailPage.vue`

```vue
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
/* styles omitted */
</style>
```

### `app/src/views/BookingPage.vue`

```vue
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
              :class="{ on: bookings.draft.date === d.iso }"
              @click="bookings.patchDraft({ date: d.iso })"
            >
              <div class="dow">{{ d.dow }}</div>
              <div class="day">{{ d.day }}</div>
              <div class="mon">{{ d.mon }}</div>
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
            :disabled="!bookings.draft.slot"
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
import { computed, onMounted } from "vue";
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
const dateChips = buildDateChips(6);

const total = computed(() =>
  m.value ? m.value.admission_fee * bookings.draft.qty : 0,
);

onMounted(() => {
  void bookings.loadSlots();
  if (!m.value) void museums.loadDetail(id.value);
  // entering the flow directly (deep link / reload) still needs a draft
  if (bookings.draft.museumId !== id.value) bookings.startDraft(id.value);
});
</script>

<style scoped>
/* styles omitted */
</style>
```

### `app/src/views/PaymentPage.vue`

```vue
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
                :placeholder="auth.user?.full_name ?? 'Maja Jovanović'"
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
/* styles omitted */
</style>
```

### `app/src/views/SuccessPage.vue`

```vue
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
/* styles omitted */
</style>
```

### `app/src/views/SearchPage.vue`

```vue
<template>
  <ion-page>
    <ion-content :fullscreen="true" :scroll-y="false">
      <div class="screen">
        <div class="head">
          <h1 class="title">Search</h1>

          <div class="searchbar">
            <span class="msym">search</span>
            <input
              :value="museums.filters.q"
              placeholder="Museum name…"
              enterkeyhint="search"
              @input="onQuery"
            />
            <span
              v-if="museums.filters.q"
              class="msym clear"
              @click="clearQuery"
              >close</span
            >
          </div>

          <div class="chips mscroll">
            <button
              v-for="c in CATEGORY_CHIPS"
              :key="c.label"
              type="button"
              class="chip"
              :class="{ on: museums.filters.category === c.value }"
              @click="museums.setFilters({ category: c.value })"
            >
              {{ c.label }}
            </button>
          </div>

          <div class="filters">
            <div class="filter">
              <div class="museo-field-label tight">Min rating</div>
              <div class="chips-row">
                <button
                  v-for="r in RATINGS"
                  :key="r.label"
                  type="button"
                  class="chip small"
                  :class="{ on: museums.filters.minRating === r.value }"
                  @click="museums.setFilters({ minRating: r.value })"
                >
                  {{ r.label }}
                </button>
              </div>
            </div>
            <div class="filter">
              <div class="museo-field-label tight">Sort</div>
              <div class="chips-row">
                <button
                  v-for="s in SORTS"
                  :key="s.label"
                  type="button"
                  class="chip small"
                  :class="{ on: museums.filters.sort === s.value }"
                  @click="museums.setFilters({ sort: s.value })"
                >
                  {{ s.label }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="results mscroll">
          <StateBlock
            v-if="museums.searchLoading && !museums.results.length"
            loading
          />

          <StateBlock
            v-else-if="museums.searchError"
            icon="cloud_off"
            title="Can't reach the API"
            :message="museums.searchError"
            action-label="Try again"
            @action="museums.search()"
          />

          <template v-else>
            <div class="count">{{ museums.results.length }} results</div>
            <div v-if="museums.results.length" class="rows">
              <MuseumRow
                v-for="m in museums.results"
                :key="m.id"
                :museum="m"
                @open="(id) => router.push(`/museum/${id}`)"
              />
            </div>
            <StateBlock
              v-else
              icon="search_off"
              title="No matches"
              message="Try a different name, or loosen the filters."
            />
          </template>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonPage } from "@ionic/vue";
import { onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";

import MuseumRow from "@/components/MuseumRow.vue";
import StateBlock from "@/components/StateBlock.vue";
import { useMuseumsStore } from "@/stores/museums";
import { CATEGORY_CHIPS } from "@/utils/format";

const router = useRouter();
const museums = useMuseumsStore();

const RATINGS = [
  { label: "Any", value: 0 },
  { label: "4.0+", value: 4 },
  { label: "4.5+", value: 4.5 },
];

const SORTS = [
  { label: "Top rated", value: "top_rated" as const },
  { label: "Price", value: "price" as const },
];

let debounce: ReturnType<typeof setTimeout> | undefined;

function onQuery(event: Event) {
  const value = (event.target as HTMLInputElement).value;
  clearTimeout(debounce);
  debounce = setTimeout(() => museums.setFilters({ q: value }), 250);
}

function clearQuery() {
  clearTimeout(debounce);
  museums.setFilters({ q: "" });
}

onMounted(() => {
  if (!museums.results.length) void museums.search();
});

onUnmounted(() => clearTimeout(debounce));
</script>

<style scoped>
/* styles omitted */
</style>
```

### `app/src/views/BookingsPage.vue`

```vue
<template>
  <ion-page>
    <ion-content :fullscreen="true" :scroll-y="false">
      <div class="screen">
        <div class="head">
          <h1 class="title">Bookings</h1>
          <div class="tabs">
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
          <StateBlock v-if="bookings.loading && !bookings.all.length" loading />

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
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

import type { Booking } from '@/api';
import MuseumImage from '@/components/MuseumImage.vue';
import StateBlock from '@/components/StateBlock.vue';
import { useBookingsStore } from '@/stores/bookings';
import { longDate } from '@/utils/format';

const router = useRouter();
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

onMounted(() => void bookings.load());
</script>

<style scoped>
/* styles omitted */
</style>
```

### `app/src/views/ProfilePage.vue`

```vue
<template>
  <ion-page>
    <ion-content :fullscreen="true" :scroll-y="false">
      <div class="screen">
        <div class="scroll mscroll">
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
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonPage, alertController } from '@ionic/vue';
import { onMounted, ref } from 'vue';
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

onMounted(async () => {
  if (!bookings.all.length) void bookings.load();
  try {
    myReviews.value = await museumsApi.myReviews();
  } catch {
    myReviews.value = [];
  } finally {
    loading.value = false;
  }
});

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
          router.replace('/login');
        },
      },
    ],
  });
  await alert.present();
}
</script>

<style scoped>
/* styles omitted */
</style>
```

### `app/src/views/ReviewPage.vue`

```vue
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
/* styles omitted */
</style>
```

### `app/src/components/MuseumCard.vue`

```vue
<template>
  <button class="card" type="button" @click="$emit('open', museum.id)">
    <MuseumImage class="thumb" :src="museum.image_url" :alt="museum.name" :seed="museum.id">
      <span class="price">{{ price(museum.admission_fee) }}</span>
    </MuseumImage>
    <div class="body">
      <span class="name">{{ museum.name }}</span>
      <div class="meta">
        <span class="rating">★ {{ ratingStr(museum.avg_rating) }}</span>
        <span>·</span>
        <span>{{ CATEGORY_LABELS[museum.category] }}</span>
        <template v-if="distance">
          <span>·</span>
          <span>{{ distance }}</span>
        </template>
      </div>
    </div>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import type { Museum } from '@/api';
import MuseumImage from '@/components/MuseumImage.vue';
import { CATEGORY_LABELS, distanceLabel, price, ratingStr } from '@/utils/format';

const props = defineProps<{
  museum: Museum;
  origin?: { latitude: number; longitude: number } | null;
}>();

defineEmits<{ open: [id: number] }>();

const distance = computed(() => distanceLabel(props.museum, props.origin ?? null));
</script>

<style scoped>
/* styles omitted */
</style>
```

### `app/src/components/StateBlock.vue`

```vue
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
/* styles omitted */
</style>
```

### `app/src/utils/calendar.ts`

```ts
import type { Booking } from "@/api";

function icsStamp(date: Date): string {
  return `${date.toISOString().replace(/[-:]/g, "").split(".")[0]}Z`;
}

function escape(text: string): string {
  return text.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
}

/**
 * handrolled VEVENT -> the `ics` package would pull in a dependency for
 * what is fundamentally twelve lines of text.
 */
export function bookingToICS(booking: Booking): string {
  const [hh, mm] = booking.time_slot.split(":").map(Number);
  const [y, m, d] = booking.visit_date.split("-").map(Number);
  const start = new Date(y, m - 1, d, hh, mm);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // assume a two-hour visit

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Museo//Ticket//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:museo-${booking.reference}@museo.app`,
    `DTSTAMP:${icsStamp(new Date())}`,
    `DTSTART:${icsStamp(start)}`,
    `DTEND:${icsStamp(end)}`,
    `SUMMARY:${escape(booking.museum.name)}`,
    `LOCATION:${escape(`${booking.museum.address}, ${booking.museum.city}`)}`,
    `DESCRIPTION:${escape(
      `${booking.num_tickets} ticket(s) · booking reference ${booking.reference}`,
    )}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

// hands the .ics to the OS on Android this opens the calendar app's import sheet.
export function downloadICS(booking: Booking): void {
  const blob = new Blob([bookingToICS(booking)], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `museo-${booking.reference}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
```

### `app/src/utils/format.ts`

```ts
import type { Category, Museum } from "@/api";

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MON = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export const CATEGORY_LABELS: Record<Category, string> = {
  art: "Art",
  history: "History",
  natural_history: "Natural history",
  science: "Science",
  nature: "Nature",
  archaeology: "Archaeology",
  ethnographic: "Ethnographic",
  childrens: "Children's",
  culture: "Culture",
  specialty: "Specialty",
};

export const CATEGORY_CHIPS: { label: string; value: Category | null }[] = [
  { label: "All", value: null },
  { label: "Art", value: "art" },
  { label: "History", value: "history" },
  { label: "Science", value: "science" },
  { label: "Nature", value: "nature" },
  { label: "Ethnographic", value: "ethnographic" },
];

export function price(fee: number): string {
  return `€${Number.isInteger(fee) ? fee : fee.toFixed(2)}`;
}

export function ratingStr(avg: number): string {
  return avg.toFixed(1);
}

// ISO yyyy-mm-dd in local time rather than UTC.
export function toISODate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// "Fri 12 Jun 2026"
export function longDate(iso: string): string {
  const d = parseISODate(iso);
  return `${DOW[d.getDay()]} ${d.getDate()} ${MON[d.getMonth()]} ${d.getFullYear()}`;
}

// "12 Jun 2026"
export function shortDate(iso: string): string {
  const d = parseISODate(iso);
  return `${d.getDate()} ${MON[d.getMonth()]} ${d.getFullYear()}`;
}

export interface DateChip {
  iso: string;
  dow: string;
  day: number;
  mon: string;
}

// the horizontal date strip on the booking screen: today plus the next `count - 1` days.
export function buildDateChips(count = 6, from = new Date()): DateChip[] {
  const base = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    return {
      iso: toISODate(d),
      dow: DOW[d.getDay()],
      day: d.getDate(),
      mon: MON[d.getMonth()],
    };
  });
}

// "2w ago" / "3mo ago" / "just now"
export function relativeDate(iso: string): string {
  const then = new Date(iso).getTime();
  const days = Math.floor((Date.now() - then) / 86_400_000);
  if (days < 1) return "just now";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

// "Until 30 Jun" for temporary shows, "Permanent" otherwise.
export function exhibitionDates(type: string, endDate: string | null): string {
  if (type === "permanent" || !endDate) return "Permanent";
  const d = parseISODate(endDate);
  return `Until ${d.getDate()} ${MON[d.getMonth()]}`;
}

// straight-line distance in km.
export function haversineKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function distanceLabel(
  museum: Museum,
  origin: { latitude: number; longitude: number } | null,
): string {
  if (!origin) return "";
  const km = haversineKm(origin, museum);
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

// whether the museum is open right now, parsed from strings like "Tue–Sun · 10:00–18:00".
export function openState(hours: string): { open: boolean; label: string } {
  const match = hours.match(/(\d{2}):(\d{2})[–-](\d{2}):(\d{2})/);
  if (!match) return { open: false, label: hours };

  const [, oh, om, ch, cm] = match.map(Number) as unknown as number[];
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const open = minutes >= oh * 60 + om && minutes < ch * 60 + cm;
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    open,
    label: open
      ? `Open · closes ${pad(ch)}:${pad(cm)}`
      : `Closed · opens ${pad(oh)}:${pad(om)}`,
  };
}

/**
 * use the real image_url
 * and fall back to a deterministic gradient in the same palette
 * when the image fails to load.
 */
const GRADIENT_PAIRS: [string, string][] = [
  ["#d9c8aa", "#cfbc99"],
  ["#cdc2b1", "#c4b8a4"],
  ["#d8c7a8", "#cfbc97"],
  ["#d3c4a4", "#c9b994"],
  ["#cdc6b4", "#c3bba6"],
  ["#d6c6a6", "#ccba96"],
];

export function fallbackGradient(seed: number, size = 11): string {
  const [a, b] = GRADIENT_PAIRS[seed % GRADIENT_PAIRS.length];
  return `repeating-linear-gradient(135deg,${a} 0 ${size}px,${b} ${size}px ${size * 2}px)`;
}

export function stars(rating: number): { full: string; empty: string } {
  const n = Math.max(0, Math.min(5, Math.round(rating)));
  return { full: "★★★★★".slice(0, n), empty: "★★★★★".slice(0, 5 - n) };
}
```
