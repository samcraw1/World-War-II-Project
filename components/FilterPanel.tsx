import type { KindFilter } from "@/lib/feed";

interface Props {
  counts: Record<KindFilter, number>;
  kind: KindFilter;
  theaters: readonly { id: string; label: string }[];
  selectedTheaters: readonly string[];
  q: string;
  showClear: boolean;
  onKind: (kind: KindFilter) => void;
  onToggleTheater: (id: string) => void;
  onSearch: (q: string) => void;
  onClear: () => void;
}

const KIND_LABELS: readonly [KindFilter, string][] = [
  ["all", "All posts"],
  ["record", "Historical records"],
  ["reconstructed", "Reconstructed"],
];

export function FilterPanel(p: Props) {
  return (
    <aside className="side filters-side" aria-label="Filters">
      <div className="panel">
        <div>
          <h2>Show</h2>
          <div className="seg" role="group" aria-label="Kind of post">
            {KIND_LABELS.map(([k, label]) => (
              <button key={k} type="button" aria-pressed={p.kind === k} onClick={() => p.onKind(k)}>
                <span>{label}</span>
                <span className="ct">{p.counts[k]}</span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <h2>Theater</h2>
          <div className="chips" role="group" aria-label="Theater">
            {p.theaters.map((t) => (
              <button
                key={t.id}
                type="button"
                className="tchip"
                aria-pressed={p.selectedTheaters.includes(t.id)}
                onClick={() => p.onToggleTheater(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <h2>
            <label htmlFor="q">Search revealed posts</label>
          </h2>
          <input
            className="search"
            id="q"
            type="search"
            placeholder="Westerplatte, sirens, radio…"
            autoComplete="off"
            value={p.q}
            onChange={(e) => p.onSearch(e.target.value)}
          />
        </div>
        <button className="clear" type="button" hidden={!p.showClear} onClick={p.onClear}>
          Clear filters
        </button>
      </div>
      <div className="panel key">
        <h2 style={{ margin: 0 }}>How to read the feed</h2>
        <div>
          <span className="sw r" />
          <p>
            <b>Historical record.</b> Documented events, written as plain wire copy. Dates and times are local to
            the event.
          </p>
        </div>
        <div>
          <span className="sw c" />
          <p>
            <b>Reconstructed.</b> Social-style posts from invented composite people. Their words are fiction; each
            one links to the records it is built on.
          </p>
        </div>
        <p>No real person is quoted or impersonated. Posts unlock only as you advance, so later events stay sealed.</p>
      </div>
    </aside>
  );
}
