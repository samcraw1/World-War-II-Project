import { currentWarDate } from '../warDate';
import { db } from '../db';

const OLLAMA_URL = process.env.OLLAMA_URL ?? 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'llama3.2';

function nextDay(date: string) {
    const d = new Date(`${date}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString().slice(0, 10);
}

async function main() {
    const date = nextDay(currentWarDate()); // generate tomorrow's entry ahead of time

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

main()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(() => db.end());
