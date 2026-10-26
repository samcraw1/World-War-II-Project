import { ContentError, formatIssue } from "../lib/content.ts";
import { loadContent } from "../lib/content-files.ts";

const dir = process.argv[2];

try {
  const content = loadContent(dir);
  const records = content.posts.filter((p) => p.kind === "record").length;
  console.log(
    `Content OK: ${content.startPoints.length} start points, ${content.posts.length} posts ` +
      `(${records} records, ${content.posts.length - records} reconstructed), ` +
      `${content.people.length} people, ${content.sources.length} sources.`,
  );
  const missingCitations = content.warnings.filter((w) => w.message === "no citation");
  const other = content.warnings.filter((w) => w.message !== "no citation");
  if (missingCitations.length) {
    console.warn(`\n${missingCitations.length} record${missingCitations.length === 1 ? "" : "s"} without a citation:`);
    for (const w of missingCitations) console.warn(`  ${w.file} [${w.id}]`);
  }
  for (const w of other) console.warn(formatIssue(w));
} catch (e) {
  if (e instanceof ContentError) {
    console.error(e.message);
    for (const issue of e.issues) console.error(`  ${formatIssue(issue)}`);
    process.exit(1);
  }
  throw e;
}
