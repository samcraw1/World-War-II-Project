import type { RecordPost } from "@/lib/schema";

interface Props {
  post: RecordPost;
  theaterLabel: string;
  fresh: boolean;
  onOpen: (id: string) => void;
}

export function RecordCard({ post, theaterLabel, fresh, onOpen }: Props) {
  const time = post.time ? `${post.time} local` : "time not recorded";
  const n = post.sources.length;
  return (
    <button
      type="button"
      className={`${fresh ? "fresh " : ""}post rec`}
      data-post-id={post.id}
      onClick={() => onOpen(post.id)}
    >
      <span className="kind">Historical record</span>
      <span className="dl">
        {post.dateline} · {time}
      </span>
      <span className="hl">{post.headline}</span>
      <span className="bd">{post.body}</span>
      <span className="foot">
        <span className="chip">{theaterLabel}</span>
        <span>
          {n} reference{n > 1 ? "s" : ""}
        </span>
      </span>
    </button>
  );
}
