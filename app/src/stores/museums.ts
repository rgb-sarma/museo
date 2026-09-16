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
