import type { StartPoint } from "@/lib/schema";

interface Props {
  startPoints: readonly StartPoint[];
  currentId: string;
  onSelect: (id: string) => void;
}

export function StartPoints({ startPoints, currentId, onSelect }: Props) {
  return (
    <section className="starts wrap" aria-label="Start points">
      <div className="starts-in">
        <div className="label">Begin on</div>
        <div className="start-list">
          {startPoints.map((sp) => (
            <button
              key={sp.id}
              type="button"
              className="start"
              aria-pressed={sp.id === currentId}
              onClick={() => onSelect(sp.id)}
            >
              <b>{sp.label}</b>
              <span>{sp.title}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
