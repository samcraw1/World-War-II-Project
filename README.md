# Wartime Wire

A Second World War "social network" that reveals historically grounded posts one day at a time. Pick a start point, advance day by day, and read two kinds of post: **records** (documented events, written as wire copy) and **reconstructed** posts (fiction in the voice of invented composite people, each tied to the records it is built on). Days you have not reached yet stay sealed.

The reference prototype is `prototype/wartime-wire.html`. The app reproduces its behaviour and look; the content now lives in JSON files and is validated on every build.

Stack: Next.js (App Router), TypeScript (strict), one global stylesheet, Zod, Vitest, Playwright. No UI library, no database, no auth.

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Validates content, then builds. Fails on bad content. |
| `npm start` | Serves the production build |
| `npm run validate` | Content validator on its own (errors exit 1, warnings listed) |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Unit tests for `lib/` and the validator |
| `npm run test:e2e` | Playwright end to end (first run: `npx playwright install chromium`) |

The e2e config builds and starts the app itself on port 3117.

## Layout

| Path | Contents |
| --- | --- |
| `content/` | All editorial content, as JSON (see below) |
| `lib/` | Pure logic with no React: schema, content assembly, date math, reveal/seal, filtering, URL state |
| `components/` | React components, wiring state to `lib/` |
| `app/` | Next.js layout, page and the global stylesheet |
| `scripts/validate-content.ts` | The validator CLI (runs on plain Node, no build step) |
| `e2e/` | Playwright spec |

## Content model

| File | Holds |
| --- | --- |
| `content/start-points.json` | The entry points: id, label, title, `from`, `to` (inclusive date range) |
| `content/posts/<start-point-id>.json` | The posts for one start point, dated inside its range |
| `content/people.json` | Composite characters for reconstructed posts |
| `content/sources.json` | Reference institutions records point to |
| `content/theaters.json` | Theater ids and labels used by the theater filter |

Ids are lowercase letters, digits and hyphens. Dates are `YYYY-MM-DD`. Times are `HH:MM`, local to the event. Every object is strict: an unknown field is an error, which catches typos.

### Record

```json
{
  "kind": "record",
  "id": "f39k",
  "date": "1939-09-03",
  "time": "11:15",
  "theater": "britain",
  "dateline": "LONDON · BBC",
  "headline": "Britain is at war with Germany",
  "body": "Neville Chamberlain announces in a radio broadcast ...",
  "context": "Australia and New Zealand declared war the same day.",
  "sources": ["tna", "iwm"],
  "citation": { "label": "TNA CAB 23/100, Cabinet minutes 3 Sept 1939", "url": "https://..." }
}
```

Required: `date`, `theater`, `dateline`, `headline`, `body`, at least one source id. Optional: `time`, `context`, `citation`. The validator warns about every record without a citation; add one when you can point at a specific document or page.

### Reconstructed

```json
{
  "kind": "reconstructed",
  "id": "r39d",
  "date": "1939-09-03",
  "time": "11:40",
  "theater": "britain",
  "person": "edith",
  "body": "Heard it on the wireless at the post ...",
  "groundedIn": ["f39k"]
}
```

Required: `date`, `theater`, `person`, `body`, at least one `groundedIn` record id. Every grounding record must exist and be dated on or before the post, so a voice never reacts to something that has not happened yet.

### People

People are invented composites, never real individuals. The schema enforces the house convention that the surname is reduced to an initial (`"Edith P."`, `"Willem de V."`). That is a guard rail, not a real-name detector: keep names, roles and details generic.

## Add a start point

1. Add an entry to `content/start-points.json` with a new id, a short `label` (shown on the button), a `title`, and the `from`/`to` range.
2. Create `content/posts/<id>.json`. It can start as `[]`.
3. Run `npm run validate`. It fails if the file is missing, if a post falls outside the range, or if two start points share an id.

The ledger lists every day in the range, so keep ranges to what you can fill.

## Add posts

1. Open the posts file for the start point and append the object. Keep ids unique across all files (the prototype used `f` + year + letter for records and `r` + year + letter for reconstructed posts, but any id works).
2. For a record, reference source ids from `content/sources.json`. Add a source there if it is new. Add a `citation` when you have one.
3. For a reconstructed post, reference a person from `content/people.json` and list the record ids it is grounded in. Add a person there if the voice is new.
4. If the post needs a new theater, add it to `content/theaters.json` first.
5. Run `npm run validate`. Errors name the file and the post id.

Order inside a file does not matter: the feed sorts by date, then by local time, newest first. Posts without a time sort as if posted at midday.

## Sharing a view

Progress lives in the query string, so a URL can be shared:

```
/?start=sep1939&day=1939-09-03&scope=day&kind=record&theater=poland,britain&q=sirens
```

Defaults are omitted. With no `start` in the URL, the last view is restored from localStorage.
