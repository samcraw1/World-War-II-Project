import { currentWarDate } from '../warDate';
import { db } from '../db';

const OLLAMA_URL = process.env.OLLAMA_URL ?? 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'llama3.2';
const WAR_START_DATE = '1939-10-12'; // first day of the real-time replay

function addDays(date: string, offset: number) {
    const d = new Date(`${date}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + offset);
    return d.toISOString().slice(0, 10);
}

async function generateFor(date: string) {
    const res = await fetch(`${OLLAMA_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: OLLAMA_MODEL,
            stream: false,
            format: 'json',
            messages: [{
                role: 'user',
                content: `Write a short deep-dive on what happened on ${date} in World War II.
Use only well-established facts. Do not invent names, numbers or events; if little is known about that day, write about the wider situation instead.
Reply with JSON only: {"title": "headline", "story": "4-6 paragraphs separated by blank lines"}`,
            }],
        }),
    });
    if (!res.ok) throw new Error(`Ollama request failed: ${res.status}`);

    const data = await res.json();
    const { title, story } = JSON.parse(data.message.content);
    if (!title || !story) throw new Error('Model reply was missing title or story');

    await db.query(
        `INSERT INTO timeline (title, story, date) VALUES ($1, $2, $3)
         ON CONFLICT (date) DO UPDATE SET title = EXCLUDED.title, story = EXCLUDED.story`,
        [title, story, date]
    );
    console.log(`Saved ${date}: ${title}`);
}

// Every day from the start of the replay up to today that has no entry yet.
async function missingDates() {
    const { rows } = await db.query<{ date: string }>(
        `SELECT to_char(date, 'YYYY-MM-DD') AS date FROM timeline`
    );
    const existing = new Set(rows.map((row) => row.date));

    const missing: string[] = [];
    for (let date = WAR_START_DATE; date <= currentWarDate(); date = addDays(date, 1)) {
        if (!existing.has(date)) missing.push(date);
    }
    return missing;
}

async function main() {
    const args = process.argv.slice(2);
    const dateFlag = args.indexOf('--date');

    if (args.includes('--backfill')) {
        const dates = await missingDates();
        console.log(`Backfilling ${dates.length} day(s)`);
        for (const date of dates) {
            // One bad reply shouldn't stop the rest of the batch.
            await generateFor(date).catch((error) => {
                console.error(`Failed ${date}:`, error.message);
                process.exitCode = 1;
            });
        }
        return;
    }

    if (dateFlag !== -1) {
        const date = args[dateFlag + 1];
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? '') || Number.isNaN(Date.parse(date))) {
            throw new Error('--date must be followed by YYYY-MM-DD');
        }
        return generateFor(date);
    }

    // Default: generate tomorrow's entry ahead of time.
    return generateFor(addDays(currentWarDate(), 1));
}

main()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(() => db.end());
