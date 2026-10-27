import type { Kind, Person, Post, RecordPost, ReconstructedPost, StartPoint } from "./schema.ts";

export type KindFilter = "all" | Kind;
export type Scope = "all" | "day";

export interface Filters {
  kind: KindFilter;
  theaters: readonly string[];
  q: string;
}

export const KIND_FILTERS: readonly KindFilter[] = ["all", "record", "reconstructed"];
export const SCOPES: readonly Scope[] = ["all", "day"];

/** Posts with no time sort as if posted at midday. */
export const NO_TIME = "12:00";

export function isKindFilter(v: unknown): v is KindFilter {
  return typeof v === "string" && (KIND_FILTERS as readonly string[]).includes(v);
}
export function isScope(v: unknown): v is Scope {
  return typeof v === "string" && (SCOPES as readonly string[]).includes(v);
}

export function inStartPoint(post: Post, sp: StartPoint): boolean {
  return post.date >= sp.from && post.date <= sp.to;
}

/** A day is sealed while it lies after the current day. */
export function isSealed(day: string, currentDay: string): boolean {
  return day > currentDay;
}

/** Everything in the start point dated on or before the current day. */
export function revealedPosts(posts: readonly Post[], sp: StartPoint, day: string): Post[] {
  return posts.filter((p) => inStartPoint(p, sp) && p.date <= day);
}

/** How many posts become visible when moving from `fromDay` forward to `toDay`. */
export function newlyRevealedCount(posts: readonly Post[], sp: StartPoint, fromDay: string, toDay: string): number {
  if (toDay <= fromDay) return 0;
  return posts.filter((p) => inStartPoint(p, sp) && p.date > fromDay && p.date <= toDay).length;
}

export function postsOnDay(posts: readonly Post[], sp: StartPoint, day: string): Post[] {
  return posts.filter((p) => inStartPoint(p, sp) && p.date === day);
}

export function indexById<T extends { id: string }>(items: readonly T[]): Map<string, T> {
  return new Map(items.map((i) => [i.id, i]));
}

/** The text a search matches against: headline, body, dateline, author and context. */
export function searchText(post: Post, people: ReadonlyMap<string, Person>): string {
  if (post.kind === "record") {
    return [post.headline, post.body, post.dateline, post.context ?? ""].join(" ");
  }
  const who = people.get(post.person);
  return [post.body, who ? `${who.name} ${who.role}` : ""].join(" ");
}

export function matchesFilters(post: Post, filters: Filters, people: ReadonlyMap<string, Person>): boolean {
  if (filters.kind !== "all" && post.kind !== filters.kind) return false;
  if (filters.theaters.length && !filters.theaters.includes(post.theater)) return false;
  const q = filters.q.trim().toLowerCase();
  if (q && !searchText(post, people).toLowerCase().includes(q)) return false;
  return true;
}

/** Newest first: by date, then by local time. */
export function compareNewestFirst(a: Post, b: Post): number {
  if (a.date !== b.date) return b.date.localeCompare(a.date);
  return (b.time ?? NO_TIME).localeCompare(a.time ?? NO_TIME);
}

export function visiblePosts(
  posts: readonly Post[],
  sp: StartPoint,
  day: string,
  scope: Scope,
  filters: Filters,
  people: ReadonlyMap<string, Person>,
): Post[] {
  let list = revealedPosts(posts, sp, day);
  if (scope === "day") list = list.filter((p) => p.date === day);
  return list.filter((p) => matchesFilters(p, filters, people)).sort(compareNewestFirst);
}

export function countByKind(posts: readonly Post[]): Record<KindFilter, number> {
  const record = posts.filter((p) => p.kind === "record").length;
  return { all: posts.length, record, reconstructed: posts.length - record };
}

/** Theater ids that occur in the start point, in order of first appearance. */
export function theatersIn(posts: readonly Post[], sp: StartPoint): string[] {
  const out: string[] = [];
  for (const p of posts) {
    if (inStartPoint(p, sp) && !out.includes(p.theater)) out.push(p.theater);
  }
  return out;
}

export function hasFilters(filters: Filters): boolean {
  return filters.kind !== "all" || filters.theaters.length > 0 || filters.q.trim() !== "";
}

/** True when nothing is revealed at all in this scope, as opposed to filters hiding everything. */
export function isQuiet(revealed: readonly Post[], scope: Scope, day: string): boolean {
  return !revealed.some((p) => scope !== "day" || p.date === day);
}

/** Reconstructed posts built on a record, limited to what is already revealed. */
export function reconstructionsOf(recordId: string, revealed: readonly Post[]): ReconstructedPost[] {
  return revealed.filter(
    (p): p is ReconstructedPost => p.kind === "reconstructed" && p.groundedIn.includes(recordId),
  );
}

export function groundingRecords(post: ReconstructedPost, byId: ReadonlyMap<string, Post>): RecordPost[] {
  return post.groundedIn
    .map((id) => byId.get(id))
    .filter((p): p is RecordPost => p?.kind === "record");
}
