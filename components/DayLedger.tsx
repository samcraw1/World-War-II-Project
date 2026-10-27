import { formatDate } from "@/lib/dates";
import { isSealed } from "@/lib/feed";

interface Props {
  title: string;
  days: readonly string[];
  currentDay: string;
  countFor: (day: string) => number;
  onJump: (day: string) => void;
}

export function DayLedger({ title, days, currentDay, countFor, onJump }: Props) {
  return (
    <aside className="side ledger-side" aria-label="Days">
      <div className="ledger">
        <h2>{title}</h2>
        {days.map((d) => {
          const sealed = isSealed(d, currentDay);
          const n = countFor(d);
          const current = d === currentDay;
          return (
            <button
              key={d}
              type="button"
              className={`dayb${sealed ? " sealed" : ""}${current ? " cur" : ""}`}
              aria-current={current ? "date" : undefined}
              aria-label={`${formatDate(d, "longDate")}${sealed ? ", sealed" : `, ${n} posts`}`}
              onClick={() => onJump(d)}
            >
              <span className="d">{formatDate(d, "ledger")}</span>
              <span className="n">{sealed ? "" : `${n} post${n === 1 ? "" : "s"}`}</span>
            </button>
          );
        })}
        <p className="ledger-note">Jumping to a sealed day reveals everything up to it.</p>
      </div>
    </aside>
  );
}
