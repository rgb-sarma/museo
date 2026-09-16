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
  archeology: "Archaeology",
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
