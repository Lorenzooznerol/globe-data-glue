import type { DataStore } from "@/data/store";
import { formatCountdown } from "@/atlas/trajectory";

interface Props {
  store: DataStore;
}

export function TrajectoryHeader({ store }: Props) {
  const preds = store.allPredictions;
  const n = preds.length;
  // soonest by falsification_date (already sorted asc in store)
  const soonest = preds.find((p) => !!p.falsification_date);
  const cd = soonest ? formatCountdown(soonest.falsification_date) : null;

  let statLine: string;
  if (!cd) {
    statLine = `${n} open forecast${n === 1 ? "" : "s"}`;
  } else if (cd.overdue) {
    const absM = Math.abs(cd.months);
    statLine = `${n} open forecasts · next deadline overdue by ~${absM} month${absM === 1 ? "" : "s"}`;
  } else if (cd.months === 0) {
    statLine = `${n} open forecasts · next deadline this month`;
  } else {
    statLine = `${n} open forecasts · next deadline in ~${cd.months} month${cd.months === 1 ? "" : "s"}`;
  }

  return (
    <header className="flex flex-col gap-3 px-1 py-6 sm:px-2">
      <h2 className="font-serif text-[26px] font-medium leading-[1.15] tracking-tight text-foreground sm:text-[30px]">
        Where AI governance is heading
      </h2>
      <p className="font-serif text-[14px] italic leading-relaxed text-muted-foreground sm:text-[15px]">
        Dated forecasts, each with a deadline by which it can be proven wrong.
      </p>
      <p
        className="mono pt-1 text-[11.5px] uppercase tracking-[0.18em]"
        style={{ color: "hsl(var(--primary, 30 95% 55%))" }}
      >
        {statLine}
      </p>
    </header>
  );
}
