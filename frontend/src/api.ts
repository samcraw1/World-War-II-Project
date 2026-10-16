import type { TimelineEvent } from './types';

export async function fetchToday(): Promise<TimelineEvent | null> {
    const res = await fetch('/api/timeline/today');
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    return res.json();
}
