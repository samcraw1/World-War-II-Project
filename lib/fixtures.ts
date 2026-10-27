import type { Person, Post, StartPoint } from "./schema.ts";

export const sp: StartPoint = { id: "t", label: "1 Sep 1939", title: "Test", from: "1939-09-01", to: "1939-09-04" };

export const people: Person[] = [
  { id: "edith", name: "Edith P.", role: "Warden · London", initials: "EP" },
  { id: "tomasz", name: "Tomasz W.", role: "Tram conductor · Warsaw", initials: "TW" },
];

export const posts: Post[] = [
  {
    kind: "record", id: "r1", date: "1939-09-01", time: "04:45", theater: "poland",
    dateline: "DANZIG", headline: "Shots at Westerplatte", body: "The garrison holds.", sources: ["iwm"],
  },
  {
    kind: "record", id: "r2", date: "1939-09-01", theater: "britain",
    dateline: "LONDON", headline: "Evacuation begins", body: "Trains leave the cities.", context: "Pied Piper.", sources: ["iwm", "tna"],
  },
  { kind: "reconstructed", id: "c1", date: "1939-09-01", time: "07:10", theater: "poland", person: "tomasz", body: "Sirens at dawn.", groundedIn: ["r1"] },
  {
    kind: "record", id: "r3", date: "1939-09-03", time: "11:15", theater: "britain",
    dateline: "LONDON", headline: "Britain at war", body: "Chamberlain broadcasts.", sources: ["tna"],
  },
  { kind: "reconstructed", id: "c2", date: "1939-09-03", time: "11:40", theater: "britain", person: "edith", body: "Heard it on the wireless.", groundedIn: ["r3", "r2"] },
  { kind: "reconstructed", id: "c3", date: "1939-09-03", theater: "britain", person: "edith", body: "Untimed post.", groundedIn: ["r3"] },
  {
    kind: "record", id: "r4", date: "1939-09-04", theater: "britain",
    dateline: "NORTH SEA", headline: "RAF raids Wilhelmshaven", body: "First offensive operation.", sources: ["iwm"],
  },
  // Outside the start point: must never show.
  {
    kind: "record", id: "x1", date: "1940-05-10", theater: "west",
    dateline: "THE HAGUE", headline: "Attack in the West", body: "Paratroopers land.", sources: ["iwm"],
  },
];
