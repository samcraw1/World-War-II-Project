import { formatDate } from "@/lib/dates";

interface Props {
  day: string;
  dayIndex: number;
  dayCount: number;
  onPrev: () => void;
  onNext: () => void;
  onAdvance: () => void;
}

export function TopBar({ day, dayIndex, dayCount, onPrev, onNext, onAdvance }: Props) {
  const atStart = dayIndex <= 0;
  const atEnd = dayIndex >= dayCount - 1;
  return (
    <header className="bar wrap">
      <div className="bar-in">
        <div className="logo">
          Wartime Wire<small>Private prototype · day by day</small>
        </div>
        <div className="datebox">
          <button className="ib" type="button" aria-label="Previous day" disabled={atStart} onClick={onPrev}>
            ‹
          </button>
          <div className="cur" aria-live="polite" data-testid="current-day">
            {formatDate(day, "short")}
            <span>
              {formatDate(day, "weekday")} · day {dayIndex + 1} of {dayCount}
            </span>
          </div>
          <button className="ib" type="button" aria-label="Next day" disabled={atEnd} onClick={onNext}>
            ›
          </button>
          <button className="advance" type="button" disabled={atEnd} onClick={onAdvance}>
            Advance a day
          </button>
        </div>
      </div>
    </header>
  );
}
