import { useEffect, useState } from "react";
import type { DataStore } from "@/data/store";
import { formatCountdown } from "@/atlas/trajectory";
import { useAtlasStore } from "@/atlas/store";
import { List } from "lucide-react";
import { THEMES } from "@/atlas/theme";

interface Props {
  store: DataStore;
  onOpenRegister: () => void;
}

export function ForecastHeader({ store, onOpenRegister }: Props) {
  const themeName = useAtlasStore((s) => s.theme);
  const selectNode = useAtlasStore((s) => s.selectNode);
  const theme = THEMES[themeName];

  // re-tick once per hour for live deadline stat
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 60 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const preds = store.allPredictions;
  const n = preds.length;
  const soonest = preds.find((p) => !!p.falsification_date);
  const cd = soonest ? formatCountdown(soonest.falsification_date) : null;

  let stat: string;
  if (!cd) stat = `${n} open forecast${n === 1 ? "" : "s"}`;
  else if (cd.overdue) {
    const a = Math.abs(cd.months);
    stat = `${n} open forecasts · next deadline overdue by ~${a} month${a === 1 ? "" : "s"}`;
  } else if (cd.months === 0) stat = `${n} open forecasts · next deadline this month`;
  else stat = `${n} open forecasts · next deadline in ~${cd.months} month${cd.months === 1 ? "" : "s"}`;

  const hasXai = !!store.predictionsByNode.get("AC-xAI");

  return (
    <div className="pointer-events-auto flex max-w-[680px] flex-col items-center gap-2 px-4 text-center">
      <h2 className="font-serif text-[20px] font-medium leading-tight tracking-tight text-foreground sm:text-[22px]">
        Where AI governance is heading
      </h2>
      <p
        className="mono text-[10.5px] uppercase tracking-[0.18em]"
        style={{ color: theme.accent }}
      >
        {stat}
      </p>
      <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={onOpenRegister}
          className="inline-flex items-center gap-1.5 rounded-sm border border-border/60 bg-background/70 px-2.5 py-1 text-[11px] text-foreground/85 backdrop-blur-sm transition-colors hover:bg-background hover:text-foreground"
        >
          <List className="h-3 w-3" aria-hidden />
          <span className="font-serif">View all forecasts</span>
        </button>
        {hasXai && (
          <button
            type="button"
            onClick={() => selectNode("AC-xAI", { fly: false })}
            className="inline-flex items-center gap-1.5 rounded-sm border border-border/60 bg-background/70 px-2.5 py-1 text-[11px] text-foreground/85 backdrop-blur-sm transition-colors hover:bg-background hover:text-foreground"
            title="xAI forecast (actor, not on globe)"
          >
            <span
              className="block h-1.5 w-1.5 rounded-full"
              style={{ background: theme.accent }}
              aria-hidden
            />
            <span className="font-serif">xAI</span>
          </button>
        )}
      </div>
    </div>
  );
}
