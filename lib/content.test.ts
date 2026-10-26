import { describe, expect, it } from "vitest";
import { assembleContent, ContentError, type RawContent } from "./content.ts";
import { loadContent } from "./content-files.ts";

function fixture(): RawContent {
  return {
    theaters: [{ id: "poland", label: "Poland" }],
    startPoints: [{ id: "t", label: "1 Sep 1939", title: "Test", from: "1939-09-01", to: "1939-09-03" }],
    people: [{ id: "tomasz", name: "Tomasz W.", role: "Tram conductor", initials: "TW" }],
    sources: [{ id: "iwm", name: "Imperial War Museums" }],
    posts: {
      t: [
        { kind: "record", id: "r1", date: "1939-09-01", time: "04:45", theater: "poland", dateline: "DANZIG", headline: "H", body: "B", sources: ["iwm"] },
        { kind: "reconstructed", id: "c1", date: "1939-09-02", theater: "poland", person: "tomasz", body: "B", groundedIn: ["r1"] },
      ],
    },
  };
}

type Mutate = (raw: RawContent) => void;
const post = (raw: RawContent, i: number) => (raw.posts.t as Record<string, unknown>[])[i]!;

function errorsFor(mutate: Mutate): string[] {
  const raw = fixture();
  mutate(raw);
  try {
    assembleContent(raw);
  } catch (e) {
    if (e instanceof ContentError) return e.issues.map((i) => `${i.file}${i.id ? ` [${i.id}]` : ""}: ${i.message}`);
    throw e;
  }
  return [];
}

describe("assembleContent", () => {
  it("accepts the fixture and reports warnings only", () => {
    const content = assembleContent(fixture());
    expect(content.posts).toHaveLength(2);
    expect(content.warnings.map((w) => w.message)).toEqual(["no citation"]);
  });

  it("accepts a citation and stops warning", () => {
    const raw = fixture();
    post(raw, 0).citation = { label: "IWM Doc 1234", url: "https://www.iwm.org.uk/" };
    expect(assembleContent(raw).warnings).toEqual([]);
  });

  it("rejects malformed fields with the file and id", () => {
    expect(errorsFor((raw) => { post(raw, 0).date = "1939-9-1"; })).toEqual([expect.stringMatching(/^posts\/t.json \[r1\]: date: dates are YYYY-MM-DD/)]);
    expect(errorsFor((raw) => { post(raw, 0).date = "1939-02-30"; })).toEqual([expect.stringContaining("not a real calendar date")]);
    expect(errorsFor((raw) => { post(raw, 0).time = "25:00"; })).toEqual([expect.stringContaining("times are HH:MM")]);
    expect(errorsFor((raw) => { post(raw, 0).sources = []; })).toEqual([expect.stringContaining("at least one source")]);
    expect(errorsFor((raw) => { post(raw, 1).groundedIn = []; })).toEqual([expect.stringContaining("at least one grounding record")]);
    expect(errorsFor((raw) => { delete post(raw, 0).headline; })).toEqual([expect.stringContaining("headline")]);
    expect(errorsFor((raw) => { post(raw, 0).extra = 1; })).toHaveLength(1);
    expect(errorsFor((raw) => { post(raw, 0).kind = "fact"; })).toHaveLength(1);
  });

  it("rejects real-looking names in people.json", () => {
    expect(errorsFor((raw) => { (raw.people as { name: string }[])[0]!.name = "Winston Churchill"; })).toEqual([
      expect.stringMatching(/^people.json \[tomasz\]: name: people are composites/),
    ]);
  });

  it("rejects dangling references", () => {
    expect(errorsFor((raw) => { post(raw, 0).theater = "mars"; })).toEqual(['posts/t.json [r1]: unknown theater "mars"']);
    expect(errorsFor((raw) => { post(raw, 0).sources = ["nope"]; })).toEqual(['posts/t.json [r1]: unknown source "nope"']);
    expect(errorsFor((raw) => { post(raw, 1).person = "ghost"; })).toEqual(['posts/t.json [c1]: unknown person "ghost"']);
    expect(errorsFor((raw) => { post(raw, 1).groundedIn = ["r9"]; })).toEqual(['posts/t.json [c1]: groundedIn "r9" does not exist']);
    expect(errorsFor((raw) => { post(raw, 1).groundedIn = ["c1"]; })).toEqual(['posts/t.json [c1]: groundedIn "c1" is not a record']);
  });

  it("rejects a post grounded in a record from its future", () => {
    expect(errorsFor((raw) => { post(raw, 1).date = "1939-08-31"; })).toEqual([
      'posts/t.json [c1]: dated 1939-08-31, outside this start point (1939-09-01 to 1939-09-03)',
      'posts/t.json [c1]: groundedIn "r1" is dated 1939-09-01, after this post (1939-08-31)',
    ]);
    expect(errorsFor((raw) => { post(raw, 0).date = "1939-09-03"; })).toEqual([
      'posts/t.json [c1]: groundedIn "r1" is dated 1939-09-03, after this post (1939-09-02)',
    ]);
    expect(errorsFor((raw) => { post(raw, 0).date = "1939-09-02"; })).toEqual([]);
  });

  it("rejects duplicate ids across files", () => {
    expect(errorsFor((raw) => { post(raw, 1).id = "r1"; })).toContain("posts/*.json [r1]: duplicate id");
    expect(errorsFor((raw) => { (raw.sources as unknown[]).push({ id: "iwm", name: "Again" }); })).toContain("sources.json [iwm]: duplicate id");
  });

  it("ties posts files to start points", () => {
    expect(errorsFor((raw) => { delete raw.posts.t; })).toEqual([expect.stringContaining("missing posts file")]);
    expect(errorsFor((raw) => { raw.posts.zzz = []; })).toEqual(["posts/zzz.json: no start point with this id"]);
    expect(errorsFor((raw) => { (raw.startPoints as { to: string }[])[0]!.to = "1939-08-01"; })).toEqual([
      expect.stringContaining("'from' must be on or before 'to'"),
    ]);
  });

  it("warns about unused people and sources", () => {
    const raw = fixture();
    (raw.people as unknown[]).push({ id: "nobody", name: "No B.", role: "Unused", initials: "NB" });
    (raw.sources as unknown[]).push({ id: "unused", name: "Unused" });
    expect(assembleContent(raw).warnings.map((w) => w.message)).toEqual(["no citation", "person has no posts", "source is never cited"]);
  });
});

describe("repository content", () => {
  it("validates with no errors", () => {
    const content = loadContent();
    expect(content.startPoints.map((s) => s.id)).toEqual(["sep1939", "may1940", "dec1941", "jun1944"]);
    expect(content.posts).toHaveLength(69);
    expect(content.warnings.filter((w) => w.message !== "no citation")).toEqual([]);
  });
});
