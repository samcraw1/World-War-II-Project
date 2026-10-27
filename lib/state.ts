import { daysBetween } from "./dates.ts";
import { isKindFilter, isScope, type KindFilter, type Scope } from "./feed.ts";
import type { StartPoint } from "./schema.ts";

export interface ViewState {
  start: string;
  day: string;
  scope: Scope;
  kind: KindFilter;
  theaters: string[];
  q: string;
}

export const STORAGE_KEY = "ww-state";

export function initialState(sp: StartPoint): ViewState {
  return { start: sp.id, day: sp.from, scope: "all", kind: "all", theaters: [], q: "" };
}

export function clampDay(day: string, sp: StartPoint): string {
  if (day < sp.from) return sp.from;
  if (day > sp.to) return sp.to;
  return day;
}

/** Switching start point rewinds to its first day and clears theater filters, keeping the rest. */
export function withStartPoint(state: ViewState, sp: StartPoint): ViewState {
  return { ...state, start: sp.id, day: sp.from, theaters: [] };
}

export function withDay(state: ViewState, day: string, sp: StartPoint): ViewState {
  return { ...state, day: clampDay(day, sp) };
}

export function clearFilters(state: ViewState): ViewState {
  return { ...state, kind: "all", theaters: [], q: "" };
}

export function daysOf(sp: StartPoint): string[] {
  return daysBetween(sp.from, sp.to);
}

/**
 * Build a valid state from loosely-typed input (query string or localStorage).
 * Returns null when no known start point is named; everything else falls back to defaults.
 */
export function normalizeState(
  input: Record<string, unknown>,
  startPoints: readonly StartPoint[],
  knownTheaters: readonly string[],
): ViewState | null {
  const sp = startPoints.find((s) => s.id === input.start);
  if (!sp) return null;
  const state = initialState(sp);
  if (typeof input.day === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input.day)) state.day = clampDay(input.day, sp);
  if (isScope(input.scope)) state.scope = input.scope;
  if (isKindFilter(input.kind)) state.kind = input.kind;
  const theaters = Array.isArray(input.theaters)
    ? input.theaters
    : typeof input.theaters === "string"
      ? input.theaters.split(",")
      : [];
  state.theaters = theaters.filter(
    (t, i, arr): t is string => typeof t === "string" && knownTheaters.includes(t) && arr.indexOf(t) === i,
  );
  if (typeof input.q === "string") state.q = input.q;
  return state;
}

export function parseQuery(
  query: string | URLSearchParams,
  startPoints: readonly StartPoint[],
  knownTheaters: readonly string[],
): ViewState | null {
  const params = typeof query === "string" ? new URLSearchParams(query) : query;
  return normalizeState(
    {
      start: params.get("start"),
      day: params.get("day"),
      scope: params.get("scope"),
      kind: params.get("kind"),
      theaters: params.get("theater"),
      q: params.get("q"),
    },
    startPoints,
    knownTheaters,
  );
}

/** Query string with the start point and day always present, and defaults omitted. */
export function serializeQuery(state: ViewState): string {
  const params = new URLSearchParams();
  params.set("start", state.start);
  params.set("day", state.day);
  if (state.scope !== "all") params.set("scope", state.scope);
  if (state.kind !== "all") params.set("kind", state.kind);
  if (state.theaters.length) params.set("theater", state.theaters.join(","));
  if (state.q.trim()) params.set("q", state.q.trim());
  return params.toString();
}

export function parseStored(
  value: unknown,
  startPoints: readonly StartPoint[],
  knownTheaters: readonly string[],
): ViewState | null {
  if (!value || typeof value !== "object") return null;
  return normalizeState(value as Record<string, unknown>, startPoints, knownTheaters);
}
