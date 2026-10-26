import WartimeWire from "@/components/WartimeWire";
import { loadContent } from "@/lib/content-files";

// Content is read and validated once, at build time. Bad data fails the build here.
export const dynamic = "force-static";

export default function Page() {
  const { theaters, startPoints, people, sources, posts } = loadContent();
  return <WartimeWire content={{ theaters, startPoints, people, sources, posts }} />;
}
