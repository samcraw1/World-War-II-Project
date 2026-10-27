import { describe, expect, it } from "vitest";
import {
  compareNewestFirst,
  countByKind,
  groundingRecords,
  hasFilters,
  indexById,
  isQuiet,
  isSealed,
  matchesFilters,
  newlyRevealedCount,
  postsOnDay,
  reconstructionsOf,
  revealedPosts,
  theatersIn,
  visiblePosts,
} from "./feed.ts";
import { people, posts, sp } from "./fixtures.ts";

const peopleById = indexById(people);
const byId = indexById(posts);
const ids = (list: { id: string }[]) => list.map((p) => p.id);
const none = { kind: "all" as const, theaters: [], q: "" };

describe("reveal and seal", () => {
  it("seals days after the current one", () => {
    expect(isSealed("1939-09-02", "1939-09-01")).toBe(true);
    expect(isSealed("1939-09-01", "1939-09-01")).toBe(false);
    expect(isSealed("1939-08-31", "1939-09-01")).toBe(false);
  });
  it("reveals everything in the start point up to the day, nothing outside it", () => {
    expect(ids(revealedPosts(posts, sp, "1939-09-01"))).toEqual(["r1", "r2", "c1"]);
    expect(ids(revealedPosts(posts, sp, "1939-09-03"))).toEqual(["r1", "r2", "c1", "r3", "c2", "c3"]);
    expect(ids(revealedPosts(posts, sp, "1941-01-01"))).not.toContain("x1");
  });
  it("counts newly revealed posts only when moving forward", () => {
    expect(newlyRevealedCount(posts, sp, "1939-09-01", "1939-09-03")).toBe(3);
    expect(newlyRevealedCount(posts, sp, "1939-09-01", "1939-09-02")).toBe(0);
    expect(newlyRevealedCount(posts, sp, "1939-09-03", "1939-09-01")).toBe(0);
  });
  it("counts posts on a day within the start point", () => {
    expect(postsOnDay(posts, sp, "1939-09-01")).toHaveLength(3);
    expect(postsOnDay(posts, sp, "1939-09-02")).toHaveLength(0);
  });
});

describe("filters", () => {
  const r1 = byId.get("r1")!;
  const c2 = byId.get("c2")!;
  it("filters by kind", () => {
    expect(matchesFilters(r1, { ...none, kind: "record" }, peopleById)).toBe(true);
    expect(matchesFilters(r1, { ...none, kind: "reconstructed" }, peopleById)).toBe(false);
  });
  it("filters by any of several theaters", () => {
    expect(matchesFilters(r1, { ...none, theaters: ["britain"] }, peopleById)).toBe(false);
    expect(matchesFilters(r1, { ...none, theaters: ["britain", "poland"] }, peopleById)).toBe(true);
  });
  it("searches headline, body, dateline, context and author, case-insensitively", () => {
    expect(matchesFilters(r1, { ...none, q: "westerplatte" }, peopleById)).toBe(true);
    expect(matchesFilters(r1, { ...none, q: "danzig" }, peopleById)).toBe(true);
    expect(matchesFilters(byId.get("r2")!, { ...none, q: "pied piper" }, peopleById)).toBe(true);
    expect(matchesFilters(c2, { ...none, q: "Edith" }, peopleById)).toBe(true);
    expect(matchesFilters(c2, { ...none, q: "warden" }, peopleById)).toBe(true);
    expect(matchesFilters(c2, { ...none, q: "tomasz" }, peopleById)).toBe(false);
  });
  it("knows when any filter is active", () => {
    expect(hasFilters(none)).toBe(false);
    expect(hasFilters({ ...none, q: "  " })).toBe(false);
    expect(hasFilters({ ...none, theaters: ["poland"] })).toBe(true);
  });
});

describe("sorting and visibility", () => {
  it("sorts newest first, untimed posts as midday", () => {
    const sorted = [...posts.filter((p) => p.id !== "x1")].sort(compareNewestFirst);
    expect(ids(sorted)).toEqual(["r4", "c3", "c2", "r3", "r2", "c1", "r1"]);
  });
  it("limits to the day in day scope and applies filters", () => {
    expect(ids(visiblePosts(posts, sp, "1939-09-03", "day", none, peopleById))).toEqual(["c3", "c2", "r3"]);
    expect(ids(visiblePosts(posts, sp, "1939-09-03", "all", { ...none, kind: "record" }, peopleById))).toEqual(["r3", "r2", "r1"]);
  });
  it("never shows sealed posts, even if they match the search", () => {
    expect(ids(visiblePosts(posts, sp, "1939-09-01", "all", { ...none, q: "RAF" }, peopleById))).toEqual([]);
  });
  it("tells a quiet day from a filtered-out one", () => {
    const revealed = revealedPosts(posts, sp, "1939-09-02");
    expect(isQuiet(revealed, "day", "1939-09-02")).toBe(true);
    expect(isQuiet(revealed, "all", "1939-09-02")).toBe(false);
    expect(isQuiet([], "all", "1939-09-01")).toBe(true);
  });
  it("counts revealed posts by kind and lists theaters in first-seen order", () => {
    expect(countByKind(revealedPosts(posts, sp, "1939-09-03"))).toEqual({ all: 6, record: 3, reconstructed: 3 });
    expect(theatersIn(posts, sp)).toEqual(["poland", "britain"]);
  });
});

describe("grounding links", () => {
  it("lists the records a reconstructed post is built on, in order", () => {
    expect(ids(groundingRecords(byId.get("c2")! as never, byId))).toEqual(["r3", "r2"]);
  });
  it("lists revealed reconstructions of a record only", () => {
    expect(ids(reconstructionsOf("r3", revealedPosts(posts, sp, "1939-09-03")))).toEqual(["c2", "c3"]);
    expect(ids(reconstructionsOf("r3", revealedPosts(posts, sp, "1939-09-02")))).toEqual([]);
    expect(ids(reconstructionsOf("r2", revealedPosts(posts, sp, "1939-09-04")))).toEqual(["c2"]);
  });
});
