import type { Person, RecordPost, ReconstructedPost } from "@/lib/schema";

interface Props {
  post: ReconstructedPost;
  person: Person;
  grounding: readonly RecordPost[];
  fresh: boolean;
  onOpen: (id: string) => void;
}

export function ReconstructedCard({ post, person, grounding, fresh, onOpen }: Props) {
  const n = grounding.length;
  return (
    <button
      type="button"
      className={`${fresh ? "fresh " : ""}post rc`}
      data-post-id={post.id}
      onClick={() => onOpen(post.id)}
    >
      <span className="who">
        <span className="av" aria-hidden="true">
          {person.initials}
        </span>
        <span className="who-t">
          <b>{person.name}</b>
          <span>
            {person.role} · {post.time ?? "during the day"}
          </span>
        </span>
        <span className="kind">Reconstructed</span>
      </span>
      <span className="bd">{post.body}</span>
      <span className="grounded">
        Composite voice. Grounded in{" "}
        <b>
          {n} record{n > 1 ? "s" : ""}
        </b>
        : {grounding.map((g) => g.headline).join("; ")}
      </span>
    </button>
  );
}
