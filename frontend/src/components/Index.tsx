import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchIndex } from '../api';
import type { TimelineDay } from '../types';

const monthOf = (date: string) =>
    new Date(`${date}T00:00:00Z`).toLocaleDateString('en-GB', {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
    });

export default function Index() {
    const [days, setDays] = useState<TimelineDay[] | undefined>(undefined);
    const [error, setError] = useState(false);

    useEffect(() => {
        fetchIndex().then(setDays).catch(() => setError(true));
    }, []);

    if (error) return <p className="status">Couldn't load the list of days.</p>;
    if (days === undefined) return <p className="status">Loading…</p>;
    if (days.length === 0) return <p className="status">Nothing recorded yet.</p>;

    // The API returns days in date order, so each month's days are already contiguous.
    const months: { label: string; days: TimelineDay[] }[] = [];
    for (const day of days) {
        const label = monthOf(day.date);
        const last = months[months.length - 1];
        if (last?.label === label) last.days.push(day);
        else months.push({ label, days: [day] });
    }

    return (
        <main className="today">
            <header className="cover">
                <p className="cover-title">A Day in WWII</p>
                <h2 className="cover-date">All days</h2>
            </header>
            {months.map((month) => (
                <section key={month.label} className="index-month">
                    <h3>{month.label}</h3>
                    <ul>
                        {month.days.map((day) => (
                            <li key={day.date}>
                                <Link to={`/day/${day.date}`}>
                                    <span className="index-date">{day.date.slice(8)}</span> {day.title}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>
            ))}
            <nav className="day-nav">
                <Link to="/" className="day-nav-index">← Back to today</Link>
            </nav>
        </main>
    );
}
