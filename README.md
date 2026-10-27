# World-War-II-Project

A real-time replay of World War II: one short story per day, starting 12 Oct 1939. One real day equals one war day.

- `backend/` — Express + Postgres API (`npm start` equivalent: `npx tsx server.ts`)
- `frontend/` — React + Vite (`npm run dev`)

## Setup

1. Set the environment variables listed in `backend/.env.example` (the backend doesn't load `.env` itself; use your shell, or e.g. `node --env-file=.env` / `tsx --env-file=.env`).
2. Apply the SQL in `backend/sql/` in order, then any `seed_*.sql` files.
3. Start the backend and frontend.

## Generating stories

Stories are written by a local Ollama model (`OLLAMA_MODEL`, default `llama3.2`).

```
cd backend
npm run generate                 # tomorrow's entry
npm run generate:backfill        # every missing day from 1939-10-12 to today
npx tsx scripts/generateStory.tsx --date 1939-10-20
```

Generated stories are LLM-written; review them before relying on them.

### Daily schedule

Run `npm run generate` once a day (from `backend/`) so tomorrow's entry is ready in advance.

- Linux/macOS cron: `0 6 * * * cd /path/to/backend && npm run generate`
- Windows: create a daily Task Scheduler task that runs `npm run generate` with `backend/` as the start-in directory.
