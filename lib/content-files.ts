import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { assembleContent, CONTENT_FILES, ContentError, type RawContent, type ValidatedContent } from "./content.ts";

export const DEFAULT_CONTENT_DIR = path.join(process.cwd(), "content");

function readJson(dir: string, file: string, errors: { file: string; message: string }[]): unknown {
  let text: string;
  try {
    text = readFileSync(path.join(dir, file), "utf8");
  } catch {
    errors.push({ file, message: "file is missing or unreadable" });
    return undefined;
  }
  try {
    return JSON.parse(text);
  } catch (e) {
    errors.push({ file, message: `invalid JSON: ${e instanceof Error ? e.message : String(e)}` });
    return undefined;
  }
}

/** Read every content file from disk as parsed JSON. Throws ContentError on unreadable or malformed files. */
export function readRawContent(dir: string = DEFAULT_CONTENT_DIR): RawContent {
  const errors: { file: string; message: string }[] = [];
  const raw: RawContent = {
    theaters: readJson(dir, CONTENT_FILES.theaters, errors),
    startPoints: readJson(dir, CONTENT_FILES.startPoints, errors),
    people: readJson(dir, CONTENT_FILES.people, errors),
    sources: readJson(dir, CONTENT_FILES.sources, errors),
    posts: {},
  };
  let postFiles: string[] = [];
  try {
    postFiles = readdirSync(path.join(dir, "posts")).filter((f) => f.endsWith(".json")).sort();
  } catch {
    errors.push({ file: "posts/", message: "directory is missing" });
  }
  for (const file of postFiles) {
    raw.posts[file.slice(0, -".json".length)] = readJson(dir, path.join("posts", file), errors);
  }
  if (errors.length) throw new ContentError(errors.map((e) => ({ level: "error", ...e })));
  return raw;
}

/** Read and validate the content directory. Throws ContentError on bad data. */
export function loadContent(dir: string = DEFAULT_CONTENT_DIR): ValidatedContent {
  return assembleContent(readRawContent(dir));
}
