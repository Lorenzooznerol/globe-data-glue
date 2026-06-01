import type { DataStore } from "@/data/store";
import type { AtlasNode } from "@/data/types";
import { friendlyMonth, plainPrediction } from "@/atlas/trajectory";
import { ExpanderRow } from "./ExpanderRow";
import { MigrationStrip } from "./MigrationStrip";

interface Props {
  store: DataStore;
  node: AtlasNode;
}

function StatusPill({ status = "OPEN" }: { status?: string }) {
  const s = (status || "OPEN").toUpperCase();
  return (
    <span
      aria-label={`Status: ${s.toLowerCase()}`}
      className="mono inline-flex shrink-0 select-none items-center rounded-full px-2 py-[2px] text-[9px] uppercase tracking-[0.18em] text-foreground/80"
      style={{ backgroundColor: "hsl(var(--foreground) / 0.08)" }}
    >
      {s}
    </span>
  );
}

export function TrajectorySection({ store, node }: Props) {
  const preds = store.predictionsByNode.get(node.node_id) ?? [];
  const timeline = node.morphology_timeline ?? [];
  const hasTimeline = timeline.length >= 2;
  if (preds.length === 0 && !hasTimeline) return null;

  return (
    <section className="flex flex-col gap-4 border-t border-border/40 pt-5">
      <span className="mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        Forecast
      </span>

      {preds.map((p) => {
        const dateLabel = friendlyMonth(p.falsification_date);
        return (
          <article key={p.pred_id} className="flex flex-col gap-2">
            <p className="font-serif text-[15.5px] leading-relaxed text-foreground">
              {plainPrediction(p)}
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <StatusPill status={p.status} />
              {dateLabel && (
                <span className="mono text-[11px] tracking-[0.04em] text-muted-foreground">
                  check by {dateLabel}
                </span>
              )}
            </div>
            {p.falsification_threshold && (
              <ExpanderRow label="What would prove this wrong" defaultOpen>
                <p className="font-serif text-[12.5px] italic leading-relaxed text-foreground/75">
                  {p.falsification_threshold}
                </p>
              </ExpanderRow>
            )}
          </article>
        );
      })}

      {hasTimeline && <MigrationStrip timeline={timeline} />}
    </section>
  );
}
