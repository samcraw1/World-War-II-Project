import { describe, expect, it } from "vitest";
import { sp } from "./fixtures.ts";
import { clearFilters, initialState, parseQuery, parseStored, serializeQuery, withDay, withStartPoint } from "./state.ts";

const starts = [sp, { id: "u", label: "x", title: "Other", from: "1940-05-10", to: "1940-05-12" }];
const theaters = ["poland", "britain"];

describe("query string", () => {
  it("round-trips a full state", () => {
    const state = { start: "t", day: "1939-09-03", scope: "day" as const, kind: "record" as const, theaters: ["britain", "poland"], q: "sirens" };
    const qs = serializeQuery(state);
    expect(qs).toBe("start=t&day=1939-09-03&scope=day&kind=record&theater=britain%2Cpoland&q=sirens");
    expect(parseQuery(qs, starts, theaters)).toEqual(state);
  });
  it("omits defaults", () => {
    expect(serializeQuery(initialState(sp))).toBe("start=t&day=1939-09-01");
  });
  it("returns null without a known start point", () => {
    expect(parseQuery("", starts, theaters)).toBeNull();
    expect(parseQuery("start=nope&day=1939-09-02", starts, theaters)).toBeNull();
  });
  it("clamps the day into the start point and drops junk", () => {
    expect(parseQuery("start=t&day=1950-01-01&scope=sideways&kind=fact&theater=poland,mars,poland", starts, theaters)).toEqual({
      ...initialState(sp),
      day: "1939-09-04",
      theaters: ["poland"],
    });
    expect(parseQuery("start=t&day=1900-01-01", starts, theaters)?.day).toBe("1939-09-01");
    expect(parseQuery("start=t&day=yesterday", starts, theaters)?.day).toBe("1939-09-01");
  });
});

describe("stored state", () => {
  it("accepts the saved shape and rejects anything else", () => {
    expect(parseStored({ start: "u", day: "1940-05-11", theaters: ["britain"], kind: "reconstructed" }, starts, theaters)).toEqual({
      start: "u", day: "1940-05-11", scope: "all", kind: "reconstructed", theaters: ["britain"], q: "",
    });
    expect(parseStored(null, starts, theaters)).toBeNull();
    expect(parseStored("start=t", starts, theaters)).toBeNull();
    expect(parseStored({ start: "gone" }, starts, theaters)).toBeNull();
  });
});

describe("transitions", () => {
  const state = { ...initialState(sp), day: "1939-09-03", kind: "record" as const, theaters: ["poland"], q: "x" };
  it("switching start point rewinds and clears theaters but keeps kind and search", () => {
    expect(withStartPoint(state, starts[1]!)).toEqual({ start: "u", day: "1940-05-10", scope: "all", kind: "record", theaters: [], q: "x" });
  });
  it("clamps day moves to the start point", () => {
    expect(withDay(state, "1939-09-09", sp).day).toBe("1939-09-04");
    expect(withDay(state, "1939-09-02", sp).day).toBe("1939-09-02");
  });
  it("clears every filter at once", () => {
    expect(clearFilters(state)).toEqual({ ...state, kind: "all", theaters: [], q: "" });
  });
});
