import type { TimelineDay, TimelineEvent } from './types';

async function fetchEntry(path: string): Promise<TimelineEvent | null> {
    const res = await fetch(path);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    return res.json();
}

export const fetchToday = () => fetchEntry('/api/timeline/today');

export const fetchByDate = (date: string) => fetchEntry(`/api/timeline/${date}`);

export async function fetchIndex(): Promise<TimelineDay[]> {
    const res = await fetch('/api/timeline');
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    return res.json();
}
