// Real-time replay: LAUNCH_DATE (real) maps to WAR_START (in-war), then 1 real day = 1 war day.
const LAUNCH_DATE = Date.UTC(2026, 9, 12);
const WAR_START = Date.UTC(1939, 9, 12);
const WAR_END = Date.UTC(1945, 8, 2); // Japan's surrender, 2 Sep 1945
const DAY = 24 * 60 * 60 * 1000;

export function currentWarDate(): string {
    const elapsed = Math.floor((Date.now() - LAUNCH_DATE) / DAY) * DAY;
    const warDate = Math.min(WAR_START + Math.max(elapsed, 0), WAR_END);
    return new Date(warDate).toISOString().slice(0, 10);
}
                       