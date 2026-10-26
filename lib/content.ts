import type { ZodError } from "zod";
import {
  peopleFileSchema,
  postsFileSchema,
  sourcesFileSchema,
  startPointsFileSchema,
  theatersFileSchema,
  type Person,
  type Post,
  type Source,
  type StartPoint,
  type Theater,
} from "./schema.ts";

export interface ContentIssue {
  level: "error" | "warning";
  file: string;
  id?: string;
  message: string;
}

export class ContentError extends Error {
  readonly issues: ContentIssue[];
  constructor(issues: ContentIssue[]) {
    super(`Content validation failed with ${issues.length} error${issues.length === 1 ? "" : "s"}`);
    this.name = "ContentError";
    this.issues = issues;
  }
}

/** Parsed JSON, before validation. `posts` is keyed by file stem (= start point id). */
export interface RawContent {
  theaters: unknown;
  startPoints: unknown;
  people: unknown;
  sources: unknown;
  posts: Record<string, unknown>;
}

/** Validated content, safe to ship to the client. */
export interface Content {
  theaters: Theater[];
  startPoints: StartPoint[];
  people: Person[];
  sources: Source[];
  posts: Post[];
}

export interface ValidatedContent extends Content {
  warnings: ContentIssue[];
}

export const CONTENT_FILES = {
  theaters: "theaters.json",
  startPoints: "start-points.json",
  people: "people.json",
  sources: "sources.json",
} as const;

function zodIssues(file: string, raw: unknown, error: ZodError): ContentIssue[] {
  return error.issues.map((issue) => {
    const [index, ...rest] = issue.path;
    let id: string | undefined;
    if (typeof index === "number" && Array.isArray(raw)) {
      const item: unknown = raw[index];
      if (item && typeof item === "object" && "id" in item && typeof item.id === "string") id = item.id;
    }
    const where = rest.length ? rest.map(String).join(".") : typeof index === "number" ? `item ${index}` : "";
    return { level: "error", file, id, message: where ? `${where}: ${issue.message}` : issue.message };
  });
}

function parseFile<T>(
  file: string,
  raw: unknown,
  schema: { safeParse(v: unknown): { success: true; data: T } | { success: false; error: ZodError } },
  errors: ContentIssue[],
): T | undefined {
  const result = schema.safeParse(raw);
  if (result.success) return result.data;
  errors.push(...zodIssues(file, raw, result.error));
  return undefined;
}

function findDuplicates<T extends { id: string }>(file: string, items: T[], errors: ContentIssue[]): void {
  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item.id)) errors.push({ level: "error", file, id: item.id, message: "duplicate id" });
    seen.add(item.id);
  }
}

/**
 * Validate every content file and the references between them.
 * Throws ContentError on any error; returns warnings otherwise.
 */
export function assembleContent(raw: RawContent): ValidatedContent {
  const errors: ContentIssue[] = [];
  const warnings: ContentIssue[] = [];

  const theaters = parseFile(CONTENT_FILES.theaters, raw.theaters, theatersFileSchema, errors);
  const startPoints = parseFile(CONTENT_FILES.startPoints, raw.startPoints, startPointsFileSchema, errors);
  const people = parseFile(CONTENT_FILES.people, raw.people, peopleFileSchema, errors);
  const sources = parseFile(CONTENT_FILES.sources, raw.sources, sourcesFileSchema, errors);

  const postsByFile = new Map<string, Post[]>();
  for (const [stem, rawPosts] of Object.entries(raw.posts)) {
    const parsed = parseFile(`posts/${stem}.json`, rawPosts, postsFileSchema, errors);
    if (parsed) postsByFile.set(stem, parsed);
  }

  if (!theaters || !startPoints || !people || !sources || errors.length) throw new ContentError(errors);

  findDuplicates(CONTENT_FILES.theaters, theaters, errors);
  findDuplicates(CONTENT_FILES.startPoints, startPoints, errors);
  findDuplicates(CONTENT_FILES.people, people, errors);
  findDuplicates(CONTENT_FILES.sources, sources, errors);

  const theaterIds = new Set(theaters.map((t) => t.id));
  const personIds = new Set(people.map((p) => p.id));
  const sourceIds = new Set(sources.map((s) => s.id));
  const startById = new Map(startPoints.map((s) => [s.id, s]));

  for (const sp of startPoints) {
    if (!postsByFile.has(sp.id)) {
      errors.push({
        level: "error",
        file: `posts/${sp.id}.json`,
        id: sp.id,
        message: "missing posts file for this start point (an empty array is fine)",
      });
    }
  }
  for (const stem of postsByFile.keys()) {
    if (!startById.has(stem)) {
      errors.push({ level: "error", file: `posts/${stem}.json`, message: "no start point with this id" });
    }
  }

  // One flat list, in start-point order, so ids can be checked across files.
  const posts: Post[] = [];
  const fileOf = new Map<string, string>();
  for (const sp of startPoints) {
    for (const post of postsByFile.get(sp.id) ?? []) {
      posts.push(post);
      fileOf.set(post.id, `posts/${sp.id}.json`);
    }
  }
  findDuplicates("posts/*.json", posts, errors);
  const postById = new Map(posts.map((p) => [p.id, p]));

  const usedPeople = new Set<string>();
  const usedSources = new Set<string>();

  for (const sp of startPoints) {
    const file = `posts/${sp.id}.json`;
    for (const post of postsByFile.get(sp.id) ?? []) {
      const err = (message: string) => errors.push({ level: "error", file, id: post.id, message });
      if (post.date < sp.from || post.date > sp.to) {
        err(`dated ${post.date}, outside this start point (${sp.from} to ${sp.to})`);
      }
      if (!theaterIds.has(post.theater)) err(`unknown theater "${post.theater}"`);
      if (post.kind === "record") {
        for (const s of post.sources) {
          if (sourceIds.has(s)) usedSources.add(s);
          else err(`unknown source "${s}"`);
        }
        if (!post.citation) warnings.push({ level: "warning", file, id: post.id, message: "no citation" });
      } else {
        if (personIds.has(post.person)) usedPeople.add(post.person);
        else err(`unknown person "${post.person}"`);
        for (const g of post.groundedIn) {
          const target = postById.get(g);
          if (!target) err(`groundedIn "${g}" does not exist`);
          else if (target.kind !== "record") err(`groundedIn "${g}" is not a record`);
          else if (target.date > post.date) {
            err(`groundedIn "${g}" is dated ${target.date}, after this post (${post.date})`);
          }
        }
      }
    }
  }

  for (const p of people) {
    if (!usedPeople.has(p.id)) {
      warnings.push({ level: "warning", file: CONTENT_FILES.people, id: p.id, message: "person has no posts" });
    }
  }
  for (const s of sources) {
    if (!usedSources.has(s.id)) {
      warnings.push({ level: "warning", file: CONTENT_FILES.sources, id: s.id, message: "source is never cited" });
    }
  }

  if (errors.length) throw new ContentError(errors);
  return { theaters, startPoints, people, sources, posts, warnings };
}

export function formatIssue(issue: ContentIssue): string {
  const where = issue.id ? `${issue.file} [${issue.id}]` : issue.file;
  return `${issue.level === "error" ? "ERROR" : "WARN "} ${where}: ${issue.message}`;
}
