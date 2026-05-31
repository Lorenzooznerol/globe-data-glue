import { useEffect, useMemo, useRef, useState } from "react";
import type { DataStore } from "@/data/store";
import type { AtlasPrediction, Marker } from "@/data/types";
import { useAtlasStore } from "@/atlas/store";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { colorForNode, FAMILY_COLOR, familyOf, OPAQUE_GREY } from "@/atlas/families";
import {
  formatCountdown,
  markerTitle,
  resolveMarkerId,
  splitCausalChain,
} from "@/atlas/trajectory";

interface Props {
  store: DataStore;
}

type Tab = "register" | "theses";

export function TrajectoryPanel({ store }: Props) {
  const mode = useAtlasStore((s) => s.mode);
  const selectNode = useAtlasStore((s) => s.selectNode);
  const [tab, setTab] = useState<Tab>("register");
  const [open, setOpen] = useState(true);
  const [highlightMarker, setHighlightMarker] = useState<string | null>(null);

  // re-tick once per hour for live countdowns
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 60 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  if (mode !== "trajectory") return null;

  const preds = store.allPredictions;
  const markers = store.atlas.markers;

  const jumpToThesis = (mid: string) => {
    setTab("theses");
    setHighlightMarker(mid);
    setOpen(true);
    setTimeout(() => {
      const el = document.getElementById(`thesis-${mid}`);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  return (
    <aside
      className="pointer-events-auto fixed bottom-0 left-0 right-0 z-30 mx-auto flex max-w-[920px] flex-col border border-border/60 bg-background/95 backdrop-blur-md"
      style={{ maxHeight: "62vh" }}
      role="dialog"
      aria-label="Trajectory panel"
    >
      {/* Header bar */}
      <div className="flex shrink-0 items-center gap-3 border-b border-border/40 px-5 py-3">
        <button
          onClick={() => setOpen((v) => !v)}
          className="text-muted-foreground hover:text-foreground"
          aria-label={open ? "Collapse" : "Expand"}
        >
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>
        <div className="flex gap-1">
          <TabButton active={tab === "register"} onClick={() => setTab("register")}>
            Prospective register
          </TabButton>
          <TabButton active={tab === "theses"} onClick={() => setTab("theses")}>
            Theses
          </TabButton>
        </div>
        <span className="mono ml-auto text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {preds.length} forecasts · {markers.length} theses
        </span>
      </div>

      {open && (
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {tab === "register" ? (
            <RegisterTab
              store={store}
              preds={preds}
              jumpToThesis={jumpToThesis}
              selectNode={(id) => selectNode(id, { fly: true })}
            />
          ) : (
            <ThesesTab
              store={store}
              markers={markers}
              highlight={highlightMarker}
              clearHighlight={() => setHighlightMarker(null)}
            />
          )}
        </div>
      )}
    </aside>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      role="tab"
      aria-selected={active}
      className={[
        "mono px-3 py-1 text-[10px] uppercase tracking-[0.18em] transition-colors",
        active
          ? "border border-border/70 bg-secondary/40 text-foreground"
          : "border border-transparent text-muted-foreground hover:text-foreground",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

/* ---------- Register tab ---------- */

function RegisterTab({
  store,
  preds,
  jumpToThesis,
  selectNode,
}: {
  store: DataStore;
  preds: AtlasPrediction[];
  jumpToThesis: (mid: string) => void;
  selectNode: (id: string) => void;
}) {
  const markerIds = store.atlas.markers.map((m) => m.marker_id);
  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h3 className="font-serif text-[18px] text-foreground">Prospective register</h3>
        <p className="font-serif text-[13px] italic leading-relaxed text-foreground/75">
          Dated, falsifiable forecasts. Each one names in advance what would prove it wrong.
        </p>
      </header>
      <ul className="flex flex-col">
        {preds.map((p) => {
          const nodeId: string = p.node_id;
          const nodeName: string = p.node_name;
          const node = store.nodesById.get(nodeId);
          const hue = node ? colorForNode(node) : OPAQUE_GREY;
          const mid = resolveMarkerId(p.marker, markerIds);
          const cd = formatCountdown(p.falsification_date);
          return (
            <li
              key={p.pred_id}
              className="border-t border-border/30 py-4 first:border-t-0 first:pt-0"
            >
              <div className="flex items-start gap-3">
                <span
                  className="mt-2 block h-2.5 w-2.5 shrink-0 rounded-[1px]"
                  style={{ background: hue }}
                  aria-hidden
                />
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <button
                      onClick={() => selectNode(nodeId)}
                      className="font-serif text-[15px] text-foreground/95 hover:underline"
                    >
                      {nodeName}
                    </button>
                    <StatusPill status={p.status} />
                  </div>
                  <p className="font-serif text-[14px] leading-relaxed text-foreground/90">
                    {p.predicted_trajectory || "Predicted trajectory not specified."}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
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
                        onClick={() => jumpToThesis(mid)}
                        className="font-serif text-[12px] italic text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground"
                      >
                        Thesis: {markerTitle(mid)}
                      </button>
                    )}
                  </div>
                  {p.falsification_threshold && (
                    <Collapsible>
                      <CollapsibleTrigger className="mono mt-1 flex items-center gap-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground">
                        <span>what would prove this wrong</span>
                        <ChevronDown className="h-3 w-3 transition-transform data-[state=open]:rotate-180" aria-hidden />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2">
                        <p className="font-serif text-[12.5px] italic leading-relaxed text-foreground/75">
                          {p.falsification_threshold}
                        </p>
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function StatusPill({ status }: { status: string | undefined }) {
  const s = (status || "OPEN").toUpperCase();
  // Designed for future states; currently all OPEN.
  const tone =
    s === "HOLDING"
      ? "border-[#5C9E8F]/60 text-[#5C9E8F]"
      : s === "FALSIFIED"
        ? "border-[#C96E5C]/60 text-[#C96E5C]"
        : s === "RESOLVED"
          ? "border-[#6E8FB8]/60 text-[#6E8FB8]"
          : "border-border/60 text-muted-foreground";
  return (
    <span
      className={`mono shrink-0 border ${tone} px-1.5 py-[1px] text-[9px] uppercase tracking-[0.18em]`}
    >
      {s}
    </span>
  );
}

/* ---------- Theses tab ---------- */

function ThesesTab({
  store,
  markers,
  highlight,
  clearHighlight,
}: {
  store: DataStore;
  markers: Marker[];
  highlight: string | null;
  clearHighlight: () => void;
}) {
  return (
    <div className="flex flex-col gap-7">
      <header className="flex flex-col gap-1">
        <h3 className="font-serif text-[18px] text-foreground">Theses</h3>
        <p className="font-serif text-[13px] italic leading-relaxed text-foreground/75">
          Four claims the atlas is willing to be wrong about, with the tell to watch for.
        </p>
      </header>
      {markers.map((m) => (
        <ThesisCard
          key={m.marker_id}
          store={store}
          marker={m}
          highlight={highlight === m.marker_id}
          clearHighlight={clearHighlight}
        />
      ))}
    </div>
  );
}

function ThesisCard({
  store,
  marker,
  highlight,
  clearHighlight,
}: {
  store: DataStore;
  marker: Marker;
  highlight: boolean;
  clearHighlight: () => void;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!highlight) return;
    const t = setTimeout(clearHighlight, 2400);
    return () => clearTimeout(t);
  }, [highlight, clearHighlight]);

  const steps = useMemo(() => splitCausalChain(marker.causal_chain), [marker.causal_chain]);
  const fam = familyOf(marker.morphology);
  const hue = fam ? FAMILY_COLOR[fam] : OPAQUE_GREY;
  const preds = store.predictionsByMarker.get(marker.marker_id) ?? [];

  return (
    <article
      ref={ref}
      id={`thesis-${marker.marker_id}`}
      className={
        "flex flex-col gap-3 border-l-2 pl-4 transition-colors " +
        (highlight ? "bg-secondary/30" : "")
      }
      style={{ borderColor: hue }}
    >
      <h4 className="font-serif text-[17px] leading-tight text-foreground" style={{ color: hue }}>
        {markerTitle(marker.marker_id)}
      </h4>
      {steps.length > 0 && (
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
          {steps.map((step, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="font-serif text-[12.5px] text-foreground/90">{step}</span>
              {i < steps.length - 1 && (
                <span aria-hidden className="text-muted-foreground">›</span>
              )}
            </li>
          ))}
        </ol>
      )}
      {marker.ex_ante_marker && (
        <p className="font-serif text-[13px] leading-relaxed text-foreground/85">
          <span className="mono mr-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Tell
          </span>
          {marker.ex_ante_marker}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {marker.confidence && (
          <span className="mono border border-border/60 px-1.5 py-[1px] text-[9px] uppercase tracking-[0.15em] text-muted-foreground">
            {marker.confidence}
          </span>
        )}
      </div>
      {marker.discriminating_counterfactual && (
        <Collapsible>
          <CollapsibleTrigger className="mono flex items-center gap-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground">
            <span>how we tested it</span>
            <ChevronDown className="h-3 w-3 transition-transform data-[state=open]:rotate-180" aria-hidden />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <p className="font-serif text-[12.5px] italic leading-relaxed text-foreground/75">
              {marker.discriminating_counterfactual}
            </p>
          </CollapsibleContent>
        </Collapsible>
      )}
      {preds.length > 0 && (
        <div className="flex flex-col gap-1.5 pt-1">
          <span className="mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Hangs on
          </span>
          <ul className="flex flex-col gap-1">
            {preds.map((p) => {
              const nodeName: string = p.node_name;
              const cd = formatCountdown(p.falsification_date);
              return (
                <li
                  key={p.pred_id}
                  className="flex flex-wrap items-baseline gap-x-2 font-serif text-[12.5px] text-foreground/85"
                >
                  <span>{nodeName}</span>
                  {cd && (
                    <span className="mono text-[10.5px] text-muted-foreground">{cd.line}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <Collapsible>
        <CollapsibleTrigger className="mono flex items-center gap-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground">
          <span>technical detail</span>
          <ChevronDown className="h-3 w-3 transition-transform data-[state=open]:rotate-180" aria-hidden />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <dl className="mono grid grid-cols-[120px_1fr] gap-y-1.5 text-[11px]">
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
            {marker.verdict && (
              <>
                <dt className="uppercase tracking-[0.15em] text-muted-foreground">verdict</dt>
                <dd className="text-foreground/85">{marker.verdict}</dd>
              </>
            )}
          </dl>
        </CollapsibleContent>
      </Collapsible>
    </article>
  );
}
