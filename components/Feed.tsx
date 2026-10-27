import { Fragment } from "react";
import { formatDate } from "@/lib/dates";
import { groundingRecords } from "@/lib/feed";
import type { Person, Post } from "@/lib/schema";
import { RecordCard } from "./RecordCard";
import { ReconstructedCard } from "./ReconstructedCard";

interface Props {
  posts: readonly Post[];
  freshDay: string | null;
  quiet: boolean;
  theaterLabels: ReadonlyMap<string, string>;
  people: ReadonlyMap<string, Person>;
  byId: ReadonlyMap<string, Post>;
  onOpen: (id: string) => void;
}

export function Feed({ posts, freshDay, quiet, theaterLabels, people, byId, onOpen }: Props) {
  if (!posts.length) {
    return (
      <div className="feed">
        {quiet ? (
          <div className="empty" data-testid="empty-quiet">
            <b>Quiet on the wire</b>No posts are seeded for this day yet. Advance to keep going.
          </div>
        ) : (
          <div className="empty" data-testid="empty-filtered">
            <b>No posts match these filters</b>Try another theater or clear the search.
          </div>
        )}
      </div>
    );
  }

  // A day heading goes above the first post of each day.
  const items = posts.map((post, i) => ({ post, heading: i === 0 || posts[i - 1]?.date !== post.date }));
  return (
    <div className="feed">
      {items.map(({ post, heading }) => {
        const fresh = post.date === freshDay;
        return (
          <Fragment key={post.id}>
            {heading && (
              <div className="dayhead">
                {formatDate(post.date, "long")}
                {fresh && <span className="new">New today</span>}
              </div>
            )}
            {post.kind === "record" ? (
              <RecordCard
                post={post}
                theaterLabel={theaterLabels.get(post.theater) ?? post.theater}
                fresh={fresh}
                onOpen={onOpen}
              />
            ) : (
              <ReconstructedCard
                post={post}
                person={people.get(post.person) ?? { id: post.person, name: post.person, role: "", initials: "?" }}
                grounding={groundingRecords(post, byId)}
                fresh={fresh}
                onOpen={onOpen}
              />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
