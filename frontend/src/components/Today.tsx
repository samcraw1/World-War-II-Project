import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { fetchByDate, fetchToday } from '../api';
import type { TimelineEvent } from '../types';
import Cover from './Cover';
import Story from './Story';

const WAR_START_DATE = '1939-09-01';

// pg serialises DATE columns as ISO timestamps; keep only YYYY-MM-DD.
const dayOf = (entry: TimelineEvent) => entry.date.slice(0, 10);

function addDays(date: string, offset: number) {
    const d = new Date(`${date}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + offset);
    return d.toISOString().slice(0, 10);
}

export default function Today() {
    // The route decides the day: /day/:date, or / for today.
    const { date } = useParams();
    const navigate = useNavigate();

    // undefined = loading, null = no entry for that day
    const [entry, setEntry] = useState<TimelineEvent | null | undefined>(undefined);
    const [error, setError] = useState(false);
    const [todayDate, setTodayDate] = useState<string | null>(null);
    const latestRequest = useRef(0);

    // Only the most recent request may update the page, so quick clicks can't show a stale day.
    const load = (request: Promise<TimelineEvent | null>) => {
        const id = ++latestRequest.current;
        setEntry(undefined);
        setError(false);
        return request
            .then((result) => {
                if (id === latestRequest.current) setEntry(result);
            })
            .catch(() => {
                if (id === latestRequest.current) setError(true);
            });
    };

    // Today's war date caps the "Next Day" button.
    useEffect(() => {
        fetchToday()
            .then((result) => result && setTodayDate(dayOf(result)))
            .catch(() => {});
    }, []);

    useEffect(() => {
        load(date ? fetchByDate(date) : fetchToday());
    }, [date]);

    const selectedDate = date ?? todayDate;

    const goToDay = (offset: number) => {
        if (!selectedDate) return;
        const next = addDays(selectedDate, offset);
        navigate(next === todayDate ? '/' : `/day/${next}`);
    };

    const canGoPrevious = selectedDate !== null && selectedDate > WAR_START_DATE;
    const canGoNext = selectedDate !== null && todayDate !== null && selectedDate < todayDate;

    let content;
    if (error) content = <p className="status">Couldn't load this day's story.</p>;
    else if (entry === undefined) content = <p className="status">Loading…</p>;
    else if (entry === null) content = <p className="status">Nothing recorded for {selectedDate ?? 'today'} yet.</p>;
    else content = (
        <>
            <Cover date={dayOf(entry)} />
            <Story headline={entry.title} story={entry.story} pic={entry.pic} />
        </>
    );

    return (
        <main className="today">
            {selectedDate && (
                <nav className="day-nav">
                    <button onClick={() => goToDay(-1)} disabled={!canGoPrevious}>← Previous Day</button>
                    <Link to="/days" className="day-nav-index">All days</Link>
                    <button onClick={() => goToDay(1)} disabled={!canGoNext}>Next Day →</button>
                </nav>
            )}
            {content}
        </main>
    );
}
