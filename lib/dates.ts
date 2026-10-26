/** All date math is done in UTC on YYYY-MM-DD strings so DST never shifts a day. */

export function toUtcDate(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

export function addDays(iso: string, n: number): string {
  const d = toUtcDate(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Every day from `from` to `to` inclusive. Empty when `to` is before `from`. */
export function daysBetween(from: string, to: string): string[] {
  const out: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
}

export type DateStyle = "short" | "long" | "longDate" | "weekday" | "ledger" | "dayMonth";

const STYLES: Record<DateStyle, Intl.DateTimeFormatOptions> = {
  short: { day: "numeric", month: "short", year: "numeric" }, // 1 Sept 1939
  long: { weekday: "long", day: "numeric", month: "long", year: "numeric" }, // Friday 1 September 1939
  longDate: { day: "numeric", month: "long", year: "numeric" }, // 1 September 1939
  weekday: { weekday: "long" }, // Friday
  ledger: { weekday: "short", day: "numeric", month: "short" }, // Fri 1 Sept
  dayMonth: { day: "numeric", month: "short" }, // 1 Sept
};

const formatters = new Map<DateStyle, Intl.DateTimeFormat>();

export function formatDate(iso: string, style: DateStyle): string {
  let f = formatters.get(style);
  if (!f) {
    f = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", ...STYLES[style] });
    formatters.set(style, f);
  }
  return f.format(toUtcDate(iso));
}
