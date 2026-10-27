import { z } from "zod";

/** Ids are lowercase letters, digits and hyphens, e.g. "sep1939", "f39a". */
export const ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/;
/** Surnames are reduced to an initial, e.g. "Edith P." or "Willem de V.". */
export const COMPOSITE_NAME_PATTERN = /\s[A-Z]\.$/;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isRealDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

const id = z.string().regex(ID_PATTERN, "ids are lowercase letters, digits and hyphens");
const text = z.string().min(1, "must not be empty");
export const isoDate = z
  .string()
  .regex(ISO_DATE, "dates are YYYY-MM-DD")
  // Only judge the calendar once the shape is right, so a typo reports one error, not two.
  .refine((v) => !ISO_DATE.test(v) || isRealDate(v), "not a real calendar date");
const localTime = z.string().regex(TIME, "times are HH:MM in 24-hour local time");

export const theaterSchema = z.strictObject({ id, label: text });

export const startPointSchema = z
  .strictObject({ id, label: text, title: text, from: isoDate, to: isoDate })
  .refine((s) => s.from <= s.to, { message: "'from' must be on or before 'to'", path: ["to"] });

export const personSchema = z.strictObject({
  id,
  name: text.regex(
    COMPOSITE_NAME_PATTERN,
    "people are composites: reduce the surname to an initial, e.g. \"Edith P.\"",
  ),
  role: text,
  initials: z.string().regex(/^[A-Z]{1,3}$/, "initials are 1 to 3 capital letters"),
});

export const sourceSchema = z.strictObject({ id, name: text, url: z.url().optional() });

export const citationSchema = z.strictObject({ label: text, url: z.url().optional() });

export const recordSchema = z.strictObject({
  kind: z.literal("record"),
  id,
  date: isoDate,
  time: localTime.optional(),
  theater: id,
  dateline: text,
  headline: text,
  body: text,
  context: text.optional(),
  sources: z.array(id).min(1, "a record needs at least one source"),
  citation: citationSchema.optional(),
});

export const reconstructedSchema = z.strictObject({
  kind: z.literal("reconstructed"),
  id,
  date: isoDate,
  time: localTime.optional(),
  theater: id,
  person: id,
  body: text,
  groundedIn: z.array(id).min(1, "a reconstructed post needs at least one grounding record"),
});

export const postSchema = z.discriminatedUnion("kind", [recordSchema, reconstructedSchema]);

export const theatersFileSchema = z.array(theaterSchema);
export const startPointsFileSchema = z.array(startPointSchema).min(1);
export const peopleFileSchema = z.array(personSchema);
export const sourcesFileSchema = z.array(sourceSchema);
export const postsFileSchema = z.array(postSchema);

export type Theater = z.infer<typeof theaterSchema>;
export type StartPoint = z.infer<typeof startPointSchema>;
export type Person = z.infer<typeof personSchema>;
export type Source = z.infer<typeof sourceSchema>;
export type Citation = z.infer<typeof citationSchema>;
export type RecordPost = z.infer<typeof recordSchema>;
export type ReconstructedPost = z.infer<typeof reconstructedSchema>;
export type Post = z.infer<typeof postSchema>;
export type Kind = Post["kind"];
