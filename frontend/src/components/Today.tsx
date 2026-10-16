import { useEffect, useState } from 'react';
import { fetchToday } from '../api';
import type { TimelineEvent } from '../types';
import Cover from './Cover';
import Story from './Story';

export default function Today() {
    const [entry, setEntry] = useState<TimelineEvent | null | undefined>(undefined);
    const [error, setError] = useState(false);

    useEffect(() => {
        fetchToday().then(setEntry).catch(() => setError(true));
    }, []);

    if (error) return <p className="status">Couldn't load today's story.</p>;
    if (entry === undefined) return <p className="status">Loading…</p>;
    if (entry === null) return <p className="status">Nothing recorded for today yet.</p>;

    // pg serialises DATE columns as ISO timestamps; keep only YYYY-MM-DD.
    return (
        <main className="today">
            <Cover date={entry.date.slice(0, 10)} />
            <Story headline={entry.title} story={entry.story} />
        </main>
    );
}
