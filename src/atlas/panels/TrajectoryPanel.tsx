import { useEffect, useMemo, useState } from "react";
import type { DataStore, DecoratedPrediction } from "@/data/store";
import type { AtlasNode, Marker } from "@/data/types";
import { useAtlasStore } from "@/atlas/store";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { FAMILY_COLOR, FAMILY_LABEL, familyOf, OPAQUE_GREY } from "@/atlas/families";
import {
  friendlyMonth,
  markerGloss,
  markerTitle,
  plainPrediction,
  resolveMarkerId,
} from "@/atlas/trajectory";
import { TrajectoryHeader } from "./TrajectoryHeader";
import { SectionAccordion } from "./SectionAccordion";
import { ExpanderRow } from "./ExpanderRow";

interface Props {
  store: DataStore;
}

type SectionKey = "register" | "theses" | "migrations";

export function TrajectoryPanel({ store }: Props) {
  const mode = useAtlasStore((s) => s.mode);
  const [panelOpen, setPanelOpen] = useState(true);
  const [openSections, setOpenSections] = useState<Set<SectionKey>>(
    () => new Set<SectionKey>(["register"]),
  );
  const isOpen = (k: SectionKey) => openSections.has(k);
  const setOpen = (k: SectionKey, v: boolean) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (v) next.add(k);
      else next.delete(k);
      return next;
    });
  };

  // re-tick once per hour for live header stat
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 60 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const migrationNodes = useMemo(
    () =>
      store.atlas.nodes.filter(
        (n) => (n.morphology_timeline ?? []).length >= 2,
      ),
    [store],
  );

  if (mode !== "trajectory") return null;

  const ensureSectionOpen = (k: SectionKey) => {
    setOpen(k, true);
    setPanelOpen(true);
  };

  const scrollToForecast = (predId: string) => {
    ensureSectionOpen("register");
    setTimeout(() => {
      const el = document.getElementById(`forecast-${predId}`);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("trajectory-flash");
      setTimeout(() => el.classList.remove("trajectory-flash"), 1800);
    }, 80);
  };

  return (
    <aside
      className="pointer-events-auto fixed bottom-0 left-0 right-0 z-30 mx-auto flex max-w-[760px] flex-col border border-border/50 bg-background/95 backdrop-blur-md"
      style={{ maxHeight: "72vh" }}
      role="dialog"
      aria-label="Trajectory"
    >
      <div className="flex shrink-0 items-center justify-end gap-2 border-b border-border/30 px-3 py-2">
        <button
          type="button"
          onClick={() => setPanelOpen((v) => !v)}
          aria-expanded={panelOpen}
          aria-label={panelOpen ? "Collapse panel" : "Expand panel"}
          className="flex h-8 w-8 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-foreground/40"
        >
          {panelOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>
      </div>

      {panelOpen && (
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-8 sm:px-7">
          <TrajectoryHeader store={store} />

          <div id="section-register">
            <SectionAccordion
              title="What we predict"
              subtitle="Ten dated forecasts, each with a deadline."
              count={store.allPredictions.length}
              open={isOpen("register")}
              onOpenChange={(o) => setOpen("register", o)}
            >
              <RegisterList store={store} preds={store.allPredictions} />
            </SectionAccordion>
          </div>

          <div id="section-theses">
            <SectionAccordion
              title="Why we think so"
              subtitle="Four claims the atlas is willing to be wrong about."
              count={store.atlas.markers.length}
              open={isOpen("theses")}
              onOpenChange={(o) => setOpen("theses", o)}
            >
              <ThesesList
                store={store}
                markers={store.atlas.markers}
                onJumpToForecast={scrollToForecast}
              />
            </SectionAccordion>
          </div>

          <div id="section-migrations">
            <SectionAccordion
              title="What's already moved"
              subtitle="Countries whose form of governance has shifted."
              count={migrationNodes.length}
              open={isOpen("migrations")}
              onOpenChange={(o) => setOpen("migrations", o)}
            >
              <MigrationsList nodes={migrationNodes} />
            </SectionAccordion>
          </div>
        </div>
      )}

      <style>{`
        .trajectory-flash {
          animation: trajectoryFlash 1.8s ease-out;
        }
        @keyframes trajectoryFlash {
          0% { background: hsl(var(--foreground) / 0.10); }
          100% { background: transparent; }
        }
      `}</style>
    </aside>
  );
}

/* ---------- Status pill (non-interactive) ---------- */

function StatusPill({ status = "OPEN" }: { status?: string }) {
  const s = (status || "OPEN").toUpperCase();
  return (
    <span
      aria-label={`Status: ${s.toLowerCase()}`}
      className="mono inline-flex shrink-0 select-none items-center rounded-full bg-foreground/8 px-2 py-[2px] text-[9px] uppercase tracking-[0.18em] text-foreground/80"
      style={{ backgroundColor: "hsl(var(--foreground) / 0.08)" }}
    >
      {s}
    </span>
  );
}

/* ---------- Section A: Register ---------- */

function RegisterList({
  store,
  preds,
}: {
  store: DataStore;
  preds: DecoratedPrediction[];
}) {
  return (
    <ul className="flex flex-col">
      {preds.map((p) => (
        <ForecastCard key={p.pred_id} pred={p} />
      ))}
    </ul>
  );
}

function ForecastCard({ pred }: { pred: DecoratedPrediction }) {
  const dateLabel = friendlyMonth(pred.falsification_date);
  return (
    <li
      id={`forecast-${pred.pred_id}`}
      className="border-t border-border/25 py-5 first:border-t-0 first:pt-2"
    >
      <p className="font-serif text-[16.5px] leading-[1.45] text-foreground sm:text-[17.5px]">
        {plainPrediction(pred)}
      </p>
      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="font-serif text-[12.5px] text-muted-foreground">{pred.node_name}</span>
        <span aria-hidden className="text-muted-foreground/50">·</span>
        <StatusPill status={pred.status} />
        {dateLabel && (
          <>
            <span aria-hidden className="text-muted-foreground/50">·</span>
            <span className="mono text-[11px] tracking-[0.04em] text-muted-foreground">
              check by {dateLabel}
            </span>
          </>
        )}
      </div>
      {pred.falsification_threshold && (
        <ExpanderRow label="What would prove this wrong" className="mt-2">
          <p className="font-serif text-[13px] italic leading-relaxed text-foreground/75">
            {pred.falsification_threshold}
          </p>
        </ExpanderRow>
      )}
    </li>
  );
}

/* ---------- Section B: Theses ---------- */

function ThesesList({
  store,
  markers,
  onJumpToForecast,
}: {
  store: DataStore;
  markers: Marker[];
  onJumpToForecast: (predId: string) => void;
}) {
  return (
    <ul className="flex flex-col">
      {markers.map((m) => (
        <ThesisCard
          key={m.marker_id}
          marker={m}
          relatedPreds={store.predictionsByMarker.get(m.marker_id) ?? []}
          onJumpToForecast={onJumpToForecast}
        />
      ))}
    </ul>
  );
}

function ThesisCard({
  marker,
  relatedPreds,
  onJumpToForecast,
}: {
  marker: Marker;
  relatedPreds: DecoratedPrediction[];
  onJumpToForecast: (predId: string) => void;
}) {
  const gloss = markerGloss(marker.marker_id);
  return (
    <li className="border-t border-border/25 py-5 first:border-t-0 first:pt-2">
      <h4 className="font-serif text-[16px] leading-tight text-foreground sm:text-[17px]">
        {markerTitle(marker.marker_id)}
      </h4>
      {gloss && (
        <p className="mt-2 font-serif text-[13.5px] leading-relaxed text-foreground/85">{gloss}</p>
      )}
      {marker.discriminating_counterfactual && (
        <ExpanderRow label="How we tested this" className="mt-2">
          <p className="font-serif text-[13px] italic leading-relaxed text-foreground/75">
            {marker.discriminating_counterfactual}
          </p>
        </ExpanderRow>
      )}
      {relatedPreds.length > 0 && (
        <div className="mt-3 flex flex-col gap-1.5">
          <span className="mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Forecasts resting on this
          </span>
          <ul className="flex flex-col gap-1">
            {relatedPreds.map((p) => (
              <li key={p.pred_id}>
                <button
                  type="button"
                  onClick={() => onJumpToForecast(p.pred_id)}
                  className="font-serif text-[13px] text-foreground/85 underline decoration-border underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/40"
                >
                  {p.node_name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <ExpanderRow label="Technical note" className="mt-2">
        <dl className="mono grid grid-cols-[110px_1fr] gap-y-1.5 text-[11px]">
          <dt className="uppercase tracking-[0.15em] text-muted-foreground">marker_id</dt>
          <dd className="text-foreground/85">{marker.marker_id}</dd>
          {marker.reg_ref && (
            <>
              <dt className="uppercase tracking-[0.15em] text-muted-foreground">reg_ref</dt>
              <dd className="text-foreground/85">{marker.reg_ref}</dd>
            </>
          )}
          {marker.morphology && (
            <>
              <dt className="uppercase tracking-[0.15em] text-muted-foreground">morphology</dt>
              <dd className="text-foreground/85">{marker.morphology}</dd>
            </>
          )}
          {marker.confound && (
            <>
              <dt className="uppercase tracking-[0.15em] text-muted-foreground">confound</dt>
              <dd className="text-foreground/85">{marker.confound}</dd>
            </>
          )}
        </dl>
      </ExpanderRow>
    </li>
  );
}

/* ---------- Section C: Migrations ---------- */

function MigrationsList({ nodes }: { nodes: AtlasNode[] }) {
  return (
    <ul className="flex flex-col">
      {nodes.map((n) => {
        const tl = n.morphology_timeline ?? [];
        const a = tl[0];
        const b = tl[tl.length - 1];
        const note = b?.note;
        return (
          <li key={n.node_id} className="border-t border-border/25 py-4 first:border-t-0 first:pt-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="font-serif text-[14.5px] text-foreground">{n.name}</span>
              <span aria-hidden className="text-muted-foreground/60">—</span>
              <FamilyPill year={a.as_of} morph={a.morphology} />
              <span aria-hidden className="text-muted-foreground/70">→</span>
              <FamilyPill year={b.as_of} morph={b.morphology} />
            </div>
            {note && (
              <p className="mt-2 font-serif text-[12.5px] italic leading-relaxed text-foreground/70">
                {note}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function FamilyPill({ year, morph }: { year: string; morph: string }) {
  const fam = familyOf(morph);
  const color = fam ? FAMILY_COLOR[fam] : OPAQUE_GREY;
  const label = fam ? FAMILY_LABEL[fam] : "Opaque";
  return (
    <span className="inline-flex items-center gap-2 border border-border/40 px-2 py-1">
      <span
        className="block h-2 w-2 shrink-0 rounded-[1px]"
        style={{ background: color }}
        aria-hidden
      />
      <span className="flex flex-col leading-tight">
        <span className="mono text-[9.5px] uppercase tracking-[0.15em] text-muted-foreground">
          {(year || "").slice(0, 4)}
        </span>
        <span className="font-serif text-[12px] text-foreground/90">{label}</span>
      </span>
    </span>
  );
}
