"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Content } from "@/lib/content";
import { addDays, formatDate } from "@/lib/dates";
import {
  countByKind,
  hasFilters,
  indexById,
  isQuiet,
  newlyRevealedCount,
  postsOnDay,
  revealedPosts,
  theatersIn,
  visiblePosts,
  type KindFilter,
  type Scope,
} from "@/lib/feed";
import {
  clearFilters,
  daysOf,
  initialState,
  parseQuery,
  parseStored,
  serializeQuery,
  STORAGE_KEY,
  withDay,
  withStartPoint,
  type ViewState,
} from "@/lib/state";
import { DayLedger } from "./DayLedger";
import { Feed } from "./Feed";
import { FilterPanel } from "./FilterPanel";
import { PostDialog } from "./PostDialog";
import { StartPoints } from "./StartPoints";
import { Toast } from "./Toast";
import { TopBar } from "./TopBar";

const TOAST_MS = 2200;

export default function WartimeWire({ content }: { content: Content }) {
  const firstSp = content.startPoints[0];
  if (!firstSp) throw new Error("content has no start points");

  const [state, setState] = useState<ViewState>(() => initialState(firstSp));
  const [freshDay, setFreshDay] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sp = content.startPoints.find((s) => s.id === state.start) ?? firstSp;
  const theaterIds = useMemo(() => content.theaters.map((t) => t.id), [content.theaters]);
  const theaterLabels = useMemo(() => new Map(content.theaters.map((t) => [t.id, t.label])), [content.theaters]);
  const people = useMemo(() => indexById(content.people), [content.people]);
  const sources = useMemo(() => indexById(content.sources), [content.sources]);
  const byId = useMemo(() => indexById(content.posts), [content.posts]);

  // Restore from the URL, then localStorage, before first paint. The server renders the
  // default view (static HTML); the saved view can only be read once the client has a window.
  /* eslint-disable react-hooks/set-state-in-effect -- hydration-time restore, runs once */
  useLayoutEffect(() => {
    let restored = parseQuery(window.location.search, content.startPoints, theaterIds);
    if (!restored) {
      try {
        restored = parseStored(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null"), content.startPoints, theaterIds);
      } catch {
        restored = null;
      }
    }
    if (restored) setState(restored);
    setReady(true);
  }, [content.startPoints, theaterIds]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Mirror state to the URL (shareable) and localStorage (fallback).
  useEffect(() => {
    if (!ready) return;
    const url = `${window.location.pathname}?${serializeQuery(state)}`;
    window.history.replaceState(window.history.state, "", url);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // storage unavailable: the URL still carries the state
    }
  }, [state, ready]);

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), TOAST_MS);
  }, []);

  const goTo = useCallback(
    (day: string, announce: boolean) => {
      const forward = day > state.day;
      const n = newlyRevealedCount(content.posts, sp, state.day, day);
      setState((s) => withDay(s, day, sp));
      setFreshDay(forward ? day : null);
      if (forward && announce) showToast(n ? `${n} new post${n === 1 ? "" : "s"} unsealed` : "No new posts on this day");
    },
    [content.posts, sp, state.day, showToast],
  );

  const selectStart = useCallback(
    (id: string) => {
      const next = content.startPoints.find((s) => s.id === id);
      if (!next) return;
      setState((s) => withStartPoint(s, next));
      setFreshDay(next.from);
      window.scrollTo({ top: 0 });
    },
    [content.startPoints],
  );

  const days = useMemo(() => daysOf(sp), [sp]);
  const dayIndex = days.indexOf(state.day);
  const canPrev = dayIndex > 0;
  const canNext = dayIndex >= 0 && dayIndex < days.length - 1;

  // Arrow keys step through days unless a dialog or text field has focus.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (openId) return;
      const t = e.target;
      if (t instanceof HTMLElement && t.matches("input, textarea, select, [contenteditable]")) return;
      if (e.key === "ArrowRight" && canNext) goTo(addDays(state.day, 1), true);
      if (e.key === "ArrowLeft" && canPrev) goTo(addDays(state.day, -1), false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [openId, canNext, canPrev, goTo, state.day]);

  const revealed = useMemo(() => revealedPosts(content.posts, sp, state.day), [content.posts, sp, state.day]);
  const filters = useMemo(() => ({ kind: state.kind, theaters: state.theaters, q: state.q }), [state.kind, state.theaters, state.q]);
  const visible = useMemo(
    () => visiblePosts(content.posts, sp, state.day, state.scope, filters, people),
    [content.posts, sp, state.day, state.scope, filters, people],
  );
  const counts = countByKind(revealed);
  const theaters = useMemo(
    () => theatersIn(content.posts, sp).map((id) => ({ id, label: theaterLabels.get(id) ?? id })),
    [content.posts, sp, theaterLabels],
  );

  const openPost = openId ? (byId.get(openId) ?? null) : null;
  const openIndex = openId ? visible.findIndex((p) => p.id === openId) : -1;
  const newerId = openIndex > 0 ? (visible[openIndex - 1]?.id ?? null) : null;
  const olderId = openIndex >= 0 && openIndex < visible.length - 1 ? (visible[openIndex + 1]?.id ?? null) : null;

  const setScope = (scope: Scope) => setState((s) => ({ ...s, scope }));
  const setKind = (kind: KindFilter) => setState((s) => ({ ...s, kind }));
  const toggleTheater = (id: string) =>
    setState((s) => ({
      ...s,
      theaters: s.theaters.includes(id) ? s.theaters.filter((t) => t !== id) : [...s.theaters, id],
    }));

  const subtitle =
    state.scope === "day"
      ? `${visible.length} post${visible.length === 1 ? "" : "s"} shown for this day`
      : `${visible.length} of ${revealed.length} revealed posts shown · from ${formatDate(sp.from, "short")} to ${formatDate(state.day, "dayMonth")}`;

  return (
    <>
      <TopBar
        day={state.day}
        dayIndex={dayIndex}
        dayCount={days.length}
        onPrev={() => goTo(addDays(state.day, -1), false)}
        onNext={() => goTo(addDays(state.day, 1), true)}
        onAdvance={() => goTo(addDays(state.day, 1), true)}
      />
      <StartPoints startPoints={content.startPoints} currentId={sp.id} onSelect={selectStart} />
      <main className="desk wrap">
        <DayLedger
          title={sp.title}
          days={days}
          currentDay={state.day}
          countFor={(d) => postsOnDay(content.posts, sp, d).length}
          onJump={(d) => goTo(d, true)}
        />
        <section aria-label="Feed" style={{ minWidth: 0 }}>
          <div className="feed-head">
            <div>
              <h1>{state.scope === "day" ? formatDate(state.day, "long") : sp.title}</h1>
              <p data-testid="feed-subtitle">{subtitle}</p>
            </div>
            <div className="scope" role="group" aria-label="Feed scope">
              <button type="button" aria-pressed={state.scope === "all"} onClick={() => setScope("all")}>
                Everything so far
              </button>
              <button type="button" aria-pressed={state.scope === "day"} onClick={() => setScope("day")}>
                This day only
              </button>
            </div>
          </div>
          <Feed
            posts={visible}
            freshDay={freshDay}
            quiet={isQuiet(revealed, state.scope, state.day)}
            theaterLabels={theaterLabels}
            people={people}
            byId={byId}
            onOpen={setOpenId}
          />
        </section>
        <FilterPanel
          counts={counts}
          kind={state.kind}
          theaters={theaters}
          selectedTheaters={state.theaters}
          q={state.q}
          showClear={hasFilters(filters)}
          onKind={setKind}
          onToggleTheater={toggleTheater}
          onSearch={(q) => setState((s) => ({ ...s, q }))}
          onClear={() => setState(clearFilters)}
        />
      </main>
      <PostDialog
        post={openPost}
        revealed={revealed}
        byId={byId}
        people={people}
        sources={sources}
        theaterLabels={theaterLabels}
        newerId={newerId}
        olderId={olderId}
        onOpen={setOpenId}
        onClose={() => setOpenId(null)}
      />
      <Toast message={toast} />
    </>
  );
}
