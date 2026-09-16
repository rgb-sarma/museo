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
