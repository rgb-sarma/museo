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
