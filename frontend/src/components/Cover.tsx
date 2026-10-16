const WAR_START = Date.UTC(1939, 8, 1); // 1 Sep 1939
const DAY = 24 * 60 * 60 * 1000;

export default function Cover({ date }: { date: string }) {
    const time = Date.parse(`${date}T00:00:00Z`);
    const day = Math.floor((time - WAR_START) / DAY) + 1;
    const formatted = new Date(time).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
    });

    return (
        <header className="cover">
            <p className="cover-title">A Day in WWII</p>
            <h2 className="cover-date">{formatted}</h2>
            <p className="cover-day">Day {day} of the war</p>
        </header>
    );
}
