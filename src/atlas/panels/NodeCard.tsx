import { useEffect, useState } from "react";
import type { DataStore } from "@/data/store";
import type { NodeBanded, NodeReadable, NodeVision, SourceV2 } from "@/data/types";
import { useAtlasStore } from "@/atlas/store";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { X, ChevronDown } from "lucide-react";
import { colorFor, splitMorphology, MORPH_COLOR, MORPH_LABEL, layerOf } from "@/atlas/morphology";
import { plainGapGloss } from "@/atlas/plainLanguage";
import { BandMeter } from "./BandMeter";
import { Term, TermScope } from "./Term";
import { GlossaryPanel } from "./GlossaryPanel";

interface Props {
  store: DataStore;
}

type Level = "short" | "how" | "docs" | "tech";

const LEVELS: { key: Level; label: string }[] = [
  { key: "short", label: "In short" },
  { key: "how", label: "How it works" },
  { key: "docs", label: "Documents" },
  { key: "tech", label: "Technical detail" },
];

export function NodeCard({ store }: Props) {
  const selectedNodeId = useAtlasStore((s) => s.selectedNodeId);
  const selectNode = useAtlasStore((s) => s.selectNode);
  const reducedMotion = useAtlasStore((s) => s.reducedMotion);
  const [level, setLevel] = useState<Level>("short");

  // Reset to Level 1 whenever the selection changes.
  useEffect(() => {
    setLevel("short");
  }, [selectedNodeId]);

  if (!selectedNodeId) return null;

  const banded = store.nodesBandedById.get(selectedNodeId);
  const vision = store.nodesVisionById.get(selectedNodeId);
  const readable = store.readableById.get(selectedNodeId);
  const node = banded ?? vision;
  if (!node) return null;

  const isVision = !!vision && !banded;
  const groups = store.documentGroupsForNode(selectedNodeId);
  const totalDocs = groups.primary.length + groups.secondary.length + groups.context.length;
  const hue = banded ? colorFor(banded.morphology) : "var(--muted-foreground)";
  const layer = layerOf(selectedNodeId).toUpperCase();

  return (
    <aside
      className="pointer-events-auto fixed right-0 top-0 z-30 flex h-screen w-full max-w-[480px] flex-col border-l border-border/70 bg-background/95 backdrop-blur-md"
      role="dialog"
      aria-label={`${node.name} — atlas card`}
    >
      {/* Header */}
      <header className="relative shrink-0 border-b border-border/40 px-6 pb-5 pt-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => selectNode(null)}
          className="absolute right-3 top-3 h-7 w-7 text-muted-foreground hover:text-foreground"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </Button>
        <div className="mono mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          <span>{layer}</span>
          {banded?.region && (
            <>
              <span aria-hidden>·</span>
              <span>{banded.region}</span>
            </>
          )}
          <span aria-hidden className="ml-auto" />
          <GlossaryPanel store={store} />
        </div>
        <h2 className="font-serif text-[26px] font-medium leading-tight tracking-tight text-foreground">
          {readable?.name ?? node.name}
        </h2>
      </header>

      {/* Segmented control */}
      <nav
        role="tablist"
        aria-label="Detail level"
        className="mx-6 mt-4 flex shrink-0 overflow-hidden rounded-sm border border-border/60 bg-secondary/30"
      >
        {LEVELS.map((l) => {
          const active = l.key === level;
          const isTech = l.key === "tech";
          const isDocs = l.key === "docs";
          return (
            <button
              key={l.key}
              role="tab"
              aria-selected={active}
              onClick={() => setLevel(l.key)}
              className={[
                "flex-1 px-2 py-2 text-[11px] transition-colors",
                isTech ? "mono uppercase tracking-[0.14em]" : "font-serif",
                active
                  ? "bg-background text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              {l.label}
              {isDocs && totalDocs > 0 && (
                <span className="mono ml-1.5 text-[9px] text-muted-foreground">{totalDocs}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Body */}
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-10 pt-5">
        <LevelView
          level={level}
          reducedMotion={reducedMotion}
          store={store}
          banded={banded ?? null}
          vision={vision ?? null}
          readable={readable ?? null}
          isVision={isVision}
          hue={hue}
          groups={groups}
        />
      </div>
    </aside>
  );
}

function LevelView({
  level,
  reducedMotion,
  store,
  banded,
  vision,
  readable,
  isVision,
  hue,
  groups,
}: {
  level: Level;
  reducedMotion: boolean;
  store: DataStore;
  banded: NodeBanded | null;
  vision: NodeVision | null;
  readable: NodeReadable | null;
  isVision: boolean;
  hue: string;
  groups: { primary: SourceV2[]; secondary: SourceV2[]; context: SourceV2[] };
}) {
  return (
    <div
      key={level}
      className={reducedMotion ? "" : "animate-in fade-in-0 slide-in-from-bottom-1 duration-200"}
    >
      {level === "short" && (
        <ShortLevel store={store} readable={readable} banded={banded} vision={vision} hue={hue} />
      )}
      {level === "how" && (
        <HowLevel
          store={store}
          readable={readable}
          banded={banded}
          vision={vision}
          isVision={isVision}
          hue={hue}
        />
      )}
      {level === "docs" && <DocsLevel groups={groups} hue={hue} />}
      {level === "tech" && <TechLevel banded={banded} vision={vision} />}
    </div>
  );
}

/* ---------- Level 1: In short ---------- */

function ShortLevel({
  store,
  readable,
  banded,
  vision,
  hue,
}: {
  store: DataStore;
  readable: NodeReadable | null;
  banded: NodeBanded | null;
  vision: NodeVision | null;
  hue: string;
}) {
  const headline = readable?.headline ?? "";
  const summary =
    readable?.summary || banded?.notes || vision?.notes || "";

  if (!headline && !summary) {
    return (
      <p className="mono text-[11px] uppercase tracking-wider text-muted-foreground">
        No readable summary recorded yet.
      </p>
    );
  }
  return (
    <TermScope store={store}>
      <div className="flex flex-col gap-5">
        {headline && (
          <p
            className="font-serif text-[22px] font-medium leading-[1.25] tracking-tight"
            style={{ color: hue }}
          >
            <Term>{headline}</Term>
          </p>
        )}
        {summary && (
          <p className="font-serif text-[15.5px] leading-relaxed text-foreground/90">
            <Term>{summary}</Term>
          </p>
        )}
      </div>
    </TermScope>
  );
}

/* ---------- Level 2: How it works ---------- */

function HowLevel({
  store,
  readable,
  banded,
  vision,
  isVision,
  hue,
}: {
  store: DataStore;
  readable: NodeReadable | null;
  banded: NodeBanded | null;
  vision: NodeVision | null;
  isVision: boolean;
  hue: string;
}) {
  // Legitimacy (VN-*) variant: prose, no meters.
  if (isVision && vision) {
    return (
      <TermScope store={store}>
        <div className="flex flex-col gap-6">
          <VnField label="Source of authority" value={vision.source_of_authority} />
          <VnField label="Scope" value={vision.scope} />
          <VnField label="Mode of influence" value={vision.mode_of_influence} />
          <VnField label="Dated anchor" value={vision.dated_anchor} />
        </div>
      </TermScope>
    );
  }

  const morphLine = readable?.morphology_plain ?? "";
  const paperWord = readable?.paper_plain ?? "";
  const realityWord = readable?.reality_plain ?? "";
  const isOpaque = !paperWord && !realityWord;

  return (
    <TermScope store={store}>
      <div className="flex flex-col gap-7">
        {morphLine && (
          <p
            className="font-serif text-[15px] leading-relaxed"
            style={{ color: hue }}
          >
            <Term>{morphLine}</Term>
          </p>
        )}

        {isOpaque ? (
          <p className="font-serif text-[14px] italic leading-relaxed text-muted-foreground">
            Closed — cannot be assessed from outside.
          </p>
        ) : (
          <section>
            <div className="flex flex-col gap-5">
              <BandMeter
                label="On paper"
                plainWord={paperWord}
                hue={hue}
                renderLabel={(l) => <Term>{l}</Term>}
              />
              <BandMeter
                label="In practice"
                plainWord={realityWord}
                hue={hue}
                renderLabel={(l) => <Term>{l}</Term>}
              />
            </div>
            {(() => {
              const g = plainGapGloss(paperWord, realityWord);
              return g ? (
                <p className="mt-4 font-serif text-[13px] italic leading-relaxed text-foreground/75">
                  {g}
                </p>
              ) : null;
            })()}
          </section>
        )}

        {/* Sub-federal hint stays useful for US */}
        {banded?.node_id === "ST-US" && (
          <SubFederal store={store} />
        )}
      </div>
    </TermScope>
  );
}

function VnField({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <section>
      <h3 className="mono mb-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </h3>
      <p className="font-serif text-[14.5px] leading-relaxed text-foreground/90">
        <Term>{value}</Term>
      </p>
    </section>
  );
}

function SubFederal({ store }: { store: DataStore }) {
  const ids = ["ST-US-CA", "ST-US-CO"];
  const rows = ids
    .map((id) => ({ banded: store.nodesBandedById.get(id), readable: store.readableById.get(id) }))
    .filter((x) => x.banded);
  if (rows.length === 0) return null;
  return (
    <section>
      <h3 className="mono mb-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        Sub-federal
      </h3>
      <ul className="flex flex-col gap-3">
        {rows.map(({ banded, readable }) =>
          banded ? (
            <li
              key={banded.node_id}
              className="border-l-2 pl-3"
              style={{ borderColor: colorFor(banded.morphology) }}
            >
              <p className="font-serif text-[14px] text-foreground/95">{banded.name}</p>
              {readable?.headline && (
                <p className="mt-0.5 font-serif text-[12.5px] italic leading-relaxed text-foreground/70">
                  {readable.headline}
                </p>
              )}
            </li>
          ) : null,
        )}
      </ul>
    </section>
  );
}

/* ---------- Level 3: Documents ---------- */

function DocsLevel({
  groups,
  hue,
}: {
  groups: { primary: SourceV2[]; secondary: SourceV2[]; context: SourceV2[] };
  hue: string;
}) {
  const { primary, secondary, context } = groups;
  if (primary.length + secondary.length + context.length === 0) {
    return (
      <p className="mono text-[11px] uppercase tracking-wider text-muted-foreground">
        No documents recorded for this node.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-7">
      {primary.length > 0 && (
        <DocGroup title="Official & primary" items={primary} hue={hue} tone="primary" />
      )}
      {secondary.length > 0 && (
        <DocGroup title="Analysis & commentary" items={secondary} hue={hue} tone="secondary" />
      )}
      {context.length > 0 && (
        <Collapsible>
          <CollapsibleTrigger className="mono flex w-full items-center justify-between border-t border-border/40 pt-4 text-[10px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground">
            <span>More references</span>
            <span className="flex items-center gap-1.5">
              <span>{context.length}</span>
              <ChevronDown className="h-3 w-3 transition-transform data-[state=open]:rotate-180" aria-hidden />
            </span>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <DocList items={context} hue={hue} tone="context" />
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

function DocGroup({
  title,
  items,
  hue,
  tone,
}: {
  title: string;
  items: SourceV2[];
  hue: string;
  tone: "primary" | "secondary" | "context";
}) {
  return (
    <section>
      <h3 className="mono mb-3 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {title}
      </h3>
      <DocList items={items} hue={hue} tone={tone} />
    </section>
  );
}

function DocList({
  items,
  hue,
  tone,
}: {
  items: SourceV2[];
  hue: string;
  tone: "primary" | "secondary" | "context";
}) {
  const titleClass =
    tone === "primary"
      ? "font-serif text-[14.5px] leading-snug text-foreground/95"
      : tone === "secondary"
        ? "font-serif text-[13.5px] leading-snug text-foreground/80"
        : "font-serif text-[13px] leading-snug text-foreground/65";

  return (
    <ul className="flex flex-col">
      {items.map((s) => {
        const year =
          s.date_status === "unknown" || !s.pub_date ? "" : (s.pub_date || "").slice(0, 4);
        const curated = (s.origin || "").toLowerCase() === "curated";
        return (
          <li
            key={s.source_id}
            className="border-t border-border/30 py-3 first:border-t-0 first:pt-0"
          >
            <div className="flex items-start gap-2">
              {curated && (
                <span
                  aria-label="curated"
                  className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: hue }}
                />
              )}
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`${titleClass} underline decoration-border underline-offset-4 hover:decoration-foreground/60`}
              >
                {s.title || s.url}
              </a>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
              {s.publisher && <span>{s.publisher}</span>}
              {year && (
                <>
                  <span aria-hidden>·</span>
                  <span>{year}</span>
                </>
              )}
              {s.source_type && (
                <span className="mono inline-block border border-border/60 px-1.5 py-[1px] text-[9px] uppercase tracking-[0.15em]">
                  {s.source_type}
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/* ---------- Level 4: Technical detail ---------- */

function TechLevel({ banded, vision }: { banded: NodeBanded | null; vision: NodeVision | null }) {
  if (!banded && !vision) return null;
  if (banded) {
    const { primary, secondary } = splitMorphology(banded.morphology);
    return (
      <dl className="mono grid grid-cols-[140px_1fr] gap-y-2.5 text-[11px]">
        <Row k="node_id" v={banded.node_id} />
        <Row k="layer" v={banded.layer} />
        <Row
          k="morphology"
          v={
            banded.morphology +
            (primary ? `  (${primary}${secondary ? "+" + secondary : ""})` : "")
          }
        />
        {primary && (
          <Row k="morph_label" v={MORPH_LABEL[primary] + (secondary ? ` + ${MORPH_LABEL[secondary]}` : "")} />
        )}
        <Row k="sub_mechanism" v={banded.sub_mechanism} />
        <Row k="paper_band" v={banded.paper_band} />
        <Row k="realization_band" v={banded.realization_band} />
        <Row k="realization_mode" v={banded.realization_mode} />
        <Row k="epistemic_level" v={banded.epistemic_level} />
        <Row k="evidence_strength" v={banded.evidence_strength} />
        {primary && <Row k="color" v={MORPH_COLOR[primary]} />}
      </dl>
    );
  }
  // vision
  return (
    <dl className="mono grid grid-cols-[140px_1fr] gap-y-2.5 text-[11px]">
      <Row k="node_id" v={vision!.node_id} />
      <Row k="source_of_authority" v={vision!.source_of_authority} />
      <Row k="scope" v={vision!.scope} />
      <Row k="mode_of_influence" v={vision!.mode_of_influence} />
      <Row k="dated_anchor" v={vision!.dated_anchor} />
    </dl>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  if (!v) return null;
  return (
    <>
      <dt className="uppercase tracking-[0.15em] text-muted-foreground">{k}</dt>
      <dd className="text-foreground/90">{v}</dd>
    </>
  );
}
