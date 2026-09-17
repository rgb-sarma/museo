import dayjs from "dayjs";

import type { Category, Museum } from "@/api";

// 0 = Sunday, matching dayjs().day().
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_INDEX = new Map(DAY_NAMES.map((d, i) => [d.toLowerCase(), i]));

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
  return dayjs(d).format("YYYY-MM-DD");
}

// dayjs parses a bare yyyy-mm-dd at local midnight, so this stays off-by-one safe.
export function parseISODate(iso: string): Date {
  return dayjs(iso).toDate();
}

// "Fri 12 Jun 2026"
export function longDate(iso: string): string {
  return dayjs(iso).format("ddd D MMM YYYY");
}

// "12 Jun 2026"
export function shortDate(iso: string): string {
  return dayjs(iso).format("D MMM YYYY");
}

export interface DateChip {
  iso: string;
  dow: string;
  day: number;
  mon: string;
  /** the museum is shut that weekday -> the chip is not selectable. */
  closed: boolean;
}

// the horizontal date strip on the booking screen: today plus the next `count - 1` days.
export function buildDateChips(
  count = 6,
  hours: string | null = null,
  from = new Date(),
): DateChip[] {
  const openDays = hours ? parseOpeningHours(hours)?.days : undefined;
  const base = dayjs(from).startOf("day");
  return Array.from({ length: count }, (_, i) => {
    const d = base.add(i, "day");
    return {
      iso: d.format("YYYY-MM-DD"),
      dow: d.format("ddd"),
      day: d.date(),
      mon: d.format("MMM"),
      closed: openDays ? !openDays.includes(d.day()) : false,
    };
  });
}

// "2w ago" / "3mo ago" / "just now"
export function relativeDate(iso: string): string {
  const days = dayjs().diff(dayjs(iso), "day");
  if (days < 1) return "just now";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

// "Until 30 Jun" for temporary shows, "Permanent" otherwise.
export function exhibitionDates(type: string, endDate: string | null): string {
  if (type === "permanent" || !endDate) return "Permanent";
  return `Until ${dayjs(endDate).format("D MMM")}`;
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

export interface OpeningHours {
  /** weekday indices the museum is open, 0 = Sunday. */
  days: number[];
  /** minutes from midnight. */
  opens: number;
  closes: number;
}

/**
 * opening hours are stored as a display string ("Tue–Sun · 10:00–18:00") and
 * interpreted here at the presentation layer; a normalised per-weekday table
 * would be the production shape.
 */
export function parseOpeningHours(hours: string): OpeningHours | null {
  const time = hours.match(/(\d{2}):(\d{2})\s*[–—-]\s*(\d{2}):(\d{2})/);
  if (!time) return null;
  const [, oh, om, ch, cm] = time.map(Number) as unknown as number[];
  return { days: parseDays(hours), opens: oh * 60 + om, closes: ch * 60 + cm };
}

// "Daily" -> every day; "Tue–Sun" -> Tue..Sun; "Wed–Mon" wraps past Sunday.
function parseDays(hours: string): number[] {
  const every = [0, 1, 2, 3, 4, 5, 6];
  const dayPart = hours.split("·")[0].trim();
  if (/daily|every day/i.test(dayPart)) return every;

  const range = dayPart.match(/([A-Za-z]{3})[a-z]*\s*[–—-]\s*([A-Za-z]{3})[a-z]*/);
  if (range) {
    const from = DAY_INDEX.get(range[1].toLowerCase());
    const to = DAY_INDEX.get(range[2].toLowerCase());
    if (from !== undefined && to !== undefined) {
      const days: number[] = [];
      // walk forwards modulo 7 so ranges that cross Sunday still resolve
      for (let i = from; ; i = (i + 1) % 7) {
        days.push(i);
        if (i === to) break;
      }
      return days;
    }
  }

  const single = DAY_INDEX.get(dayPart.slice(0, 3).toLowerCase());
  if (single !== undefined) return [single];
  // unrecognised day part -> assume it is open every day rather than hide it
  return every;
}

function hhmm(minutes: number): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}

// whether the museum is open right now, from strings like "Tue–Sun · 10:00–18:00".
export function openState(
  hours: string,
  now: Date = new Date(),
): { open: boolean; label: string } {
  const parsed = parseOpeningHours(hours);
  if (!parsed) return { open: false, label: hours };

  const d = dayjs(now);
  const today = d.day();
  const minutes = d.hour() * 60 + d.minute();

  if (parsed.days.includes(today)) {
    if (minutes < parsed.opens) {
      return { open: false, label: `Closed · opens ${hhmm(parsed.opens)}` };
    }
    if (minutes < parsed.closes) {
      return { open: true, label: `Open · closes ${hhmm(parsed.closes)}` };
    }
  }

  // shut for the rest of today -> name the next day it opens
  for (let step = 1; step <= 7; step++) {
    const day = (today + step) % 7;
    if (parsed.days.includes(day)) {
      return {
        open: false,
        label: `Closed · opens ${DAY_NAMES[day]} ${hhmm(parsed.opens)}`,
      };
    }
  }
  return { open: false, label: hours };
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
