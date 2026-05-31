import { useEffect, useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import type { DataStore } from "@/data/store";
import type { AtlasNode } from "@/data/types";
import { useAtlasStore } from "@/atlas/store";
import { colorForNode } from "@/atlas/families";
import {
  directionGlyph,
  formatCountdown,
  markerTitle,
  resolveMarkerId,
} from "@/atlas/trajectory";
import { DirectionGlyph } from "./DirectionGlyph";
import { MigrationStrip } from "./MigrationStrip";

interface Props {
  store: DataStore;
  node: AtlasNode;
}

export function TrajectorySection({ store, node }: Props) {
  const preds = store.predictionsByNode.get(node.node_id) ?? [];
  const timeline = node.morphology_timeline ?? [];
  const hasTimeline = timeline.length >= 2;
  if (preds.length === 0 && !hasTimeline) return null;

  const reducedMotion = useAtlasStore((s) => s.reducedMotion);
  const setMode = useAtlasStore((s) => s.setMode);
  const hue = colorForNode(node);
  const markerIds = store.atlas.markers.map((m) => m.marker_id);

  // re-tick once per hour
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 60 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="flex flex-col gap-5 border-t border-border/40 pt-5">
      <div className="flex items-center justify-between">
        <span className="mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Trajectory
        </span>
        <button
          onClick={() => setMode("trajectory")}
          className="mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
        >
          register →
        </button>
      </div>

      {preds.map((p) => {
        const mid = resolveMarkerId(p.marker, markerIds);
        const cd = formatCountdown(p.falsification_date);
        const kind = directionGlyph(p.direction);
        return (
          <article key={p.pred_id} className="flex flex-col gap-2.5">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 shrink-0">
                <DirectionGlyph kind={kind} color={hue} size={18} reducedMotion={reducedMotion} />
              </span>
              <p className="font-serif text-[14.5px] leading-relaxed text-foreground/95">
                {p.predicted_trajectory || "Predicted trajectory not specified."}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pl-7">
              {cd && (
                <span
                  className={
                    "mono text-[11px] tracking-[0.04em] " +
                    (cd.overdue ? "text-foreground" : "text-foreground/80")
                  }
                >
                  {cd.line}
                </span>
              )}
              {p.confidence && (
                <span className="mono border border-border/60 px-1.5 py-[1px] text-[9px] uppercase tracking-[0.15em] text-muted-foreground">
                  {p.confidence}
                </span>
              )}
              {mid && (
                <button
                  onClick={() => setMode("trajectory")}
                  className="font-serif text-[12px] italic text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground"
                >
                  Thesis: {markerTitle(mid)}
                </button>
              )}
            </div>
            {p.falsification_threshold && (
              <Collapsible>
                <CollapsibleTrigger className="mono flex w-full items-center justify-between pl-7 text-[10px] uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground">
                  <span>what would prove this wrong</span>
                  <ChevronDown className="h-3 w-3 transition-transform data-[state=open]:rotate-180" aria-hidden />
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 pl-7">
                  <p className="font-serif text-[12.5px] italic leading-relaxed text-foreground/75">
                    {p.falsification_threshold}
                  </p>
                </CollapsibleContent>
              </Collapsible>
            )}
          </article>
        );
      })}

      {hasTimeline && <MigrationStrip timeline={timeline} />}
    </section>
  );
}
