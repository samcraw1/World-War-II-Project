"use client";

import { useEffect, useRef } from "react";
import { formatDate } from "@/lib/dates";
import { groundingRecords, reconstructionsOf } from "@/lib/feed";
import type { Person, Post, Source } from "@/lib/schema";

interface Props {
  post: Post | null;
  revealed: readonly Post[];
  byId: ReadonlyMap<string, Post>;
  people: ReadonlyMap<string, Person>;
  sources: ReadonlyMap<string, Source>;
  theaterLabels: ReadonlyMap<string, string>;
  newerId: string | null;
  olderId: string | null;
  onOpen: (id: string) => void;
  onClose: () => void;
}

export function PostDialog(p: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (p.post && !d.open) d.showModal();
    if (!p.post && d.open) d.close();
  }, [p.post]);

  const when = p.post
    ? `${formatDate(p.post.date, "long")}${p.post.time ? ` · ${p.post.time} local` : ""}`
    : "";

  return (
    <dialog
      ref={ref}
      aria-labelledby="dlgTitle"
      onClose={p.onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) p.onClose();
      }}
    >
      {p.post && (
        <div className="dlg" data-testid="post-dialog">
          {p.post.kind === "record" ? (
            <RecordDetail post={p.post} when={when} />
          ) : (
            <ReconstructedDetail post={p.post} when={when} />
          )}
          <div className="dlg-nav">
            <button type="button" disabled={!p.newerId} onClick={() => p.newerId && p.onOpen(p.newerId)}>
              ‹ Newer
            </button>
            <button type="button" disabled={!p.olderId} onClick={() => p.olderId && p.onOpen(p.olderId)}>
              Older ›
            </button>
          </div>
        </div>
      )}
    </dialog>
  );

  function CloseButton() {
    return (
      <button className="x" type="button" aria-label="Close" onClick={p.onClose}>
        ✕
      </button>
    );
  }

  function RecordDetail({ post, when }: { post: Extract<Post, { kind: "record" }>; when: string }) {
    const related = reconstructionsOf(post.id, p.revealed);
    return (
      <>
        <div className="dlg-top">
          <div>
            <span className="kind" style={{ color: "var(--record)" }}>
              ■ Historical record
            </span>
            <h2 id="dlgTitle">{post.headline}</h2>
          </div>
          <CloseButton />
        </div>
        <div className="label">
          {post.dateline} · {when} · {p.theaterLabels.get(post.theater) ?? post.theater}
        </div>
        <p className="body">{post.body}</p>
        {post.context && (
          <div className="box rec-box">
            <h4>Context</h4>
            <p>{post.context}</p>
          </div>
        )}
        <div className="box">
          <h4>Corroborate with</h4>
          <ul>
            {post.sources.map((id) => {
              const s = p.sources.get(id);
              return (
                <li key={id}>
                  {s?.url ? (
                    <a href={s.url} target="_blank" rel="noreferrer">
                      {s.name}
                    </a>
                  ) : (
                    (s?.name ?? id)
                  )}
                </li>
              );
            })}
          </ul>
          {post.citation ? (
            <p style={{ marginTop: 6, fontSize: 12.5 }}>
              Citation:{" "}
              {post.citation.url ? (
                <a href={post.citation.url} target="_blank" rel="noreferrer">
                  {post.citation.label}
                </a>
              ) : (
                post.citation.label
              )}
            </p>
          ) : (
            <p style={{ marginTop: 6, color: "var(--muted)", fontSize: 12.5 }}>
              Wording is paraphrased. No specific document is cited for this record yet.
            </p>
          )}
        </div>
        {related.length > 0 && (
          <div>
            <div className="label" style={{ marginBottom: 6 }}>
              Reconstructed posts built on this record
            </div>
            <div className="rel">
              {related.map((r) => (
                <button key={r.id} type="button" data-open={r.id} onClick={() => p.onOpen(r.id)}>
                  <small>
                    {p.people.get(r.person)?.name ?? r.person} · {formatDate(r.date, "dayMonth")}
                  </small>
                  {r.body.slice(0, 90)}…
                </button>
              ))}
            </div>
          </div>
        )}
      </>
    );
  }

  function ReconstructedDetail({ post, when }: { post: Extract<Post, { kind: "reconstructed" }>; when: string }) {
    const person = p.people.get(post.person);
    const grounding = groundingRecords(post, p.byId);
    return (
      <>
        <div className="dlg-top">
          <div className="who">
            <span className="av" aria-hidden="true">
              {person?.initials ?? "?"}
            </span>
            <span className="who-t">
              <b id="dlgTitle">{person?.name ?? post.person}</b>
              <span>{person?.role}</span>
            </span>
          </div>
          <CloseButton />
        </div>
        <div className="label">
          {when} · {p.theaterLabels.get(post.theater) ?? post.theater}
        </div>
        <p className="body">{post.body}</p>
        <div className="box rc-box">
          <h4>What is invented</h4>
          <p>
            {person?.name ?? "This voice"} is a composite character, not a real person. The words, feelings and small
            details are fiction written to show how ordinary people might have experienced the day.
          </p>
        </div>
        <div>
          <div className="label" style={{ marginBottom: 6 }}>
            What is documented
          </div>
          <div className="rel" data-testid="grounding-links">
            {grounding.map((g) => (
              <button key={g.id} type="button" data-open={g.id} onClick={() => p.onOpen(g.id)}>
                <small>Historical record · {formatDate(g.date, "short")}</small>
                {g.headline}
              </button>
            ))}
          </div>
        </div>
      </>
    );
  }
}
