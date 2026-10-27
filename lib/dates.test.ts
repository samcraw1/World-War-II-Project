import { describe, expect, it } from "vitest";
import { addDays, daysBetween, formatDate } from "./dates.ts";

describe("addDays", () => {
  it("crosses month and year boundaries", () => {
    expect(addDays("1939-08-31", 1)).toBe("1939-09-01");
    expect(addDays("1939-12-31", 1)).toBe("1940-01-01");
    expect(addDays("1940-01-01", -1)).toBe("1939-12-31");
  });
  it("handles leap years", () => {
    expect(addDays("1940-02-28", 1)).toBe("1940-02-29");
    expect(addDays("1941-02-28", 1)).toBe("1941-03-01");
  });
});

describe("daysBetween", () => {
  it("is inclusive at both ends", () => {
    expect(daysBetween("1939-08-31", "1939-09-02")).toEqual(["1939-08-31", "1939-09-01", "1939-09-02"]);
  });
  it("is a single day when from equals to", () => {
    expect(daysBetween("1944-06-06", "1944-06-06")).toEqual(["1944-06-06"]);
  });
  it("is empty when to is before from", () => {
    expect(daysBetween("1944-06-07", "1944-06-06")).toEqual([]);
  });
});

describe("formatDate", () => {
  it("formats in UTC so the day never shifts", () => {
    expect(formatDate("1941-12-07", "weekday")).toBe("Sunday");
    expect(formatDate("1939-09-03", "long")).toMatch(/^Sunday,? 3 September 1939$/);
    expect(formatDate("1939-09-03", "longDate")).toBe("3 September 1939");
    expect(formatDate("1944-06-06", "short")).toMatch(/^6 Jun 1944$/);
    expect(formatDate("1944-06-06", "dayMonth")).toMatch(/^6 Jun$/);
    expect(formatDate("1944-06-06", "ledger")).toMatch(/^Tue,? 6 Jun$/);
  });
});
