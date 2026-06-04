import { useEffect, useState } from "react";
import type { DataStore } from "@/data/store";
import type {
  AtlasDocument,
  AtlasDocumentGroups,
  AtlasNode,
  CountryOverlay,
} from "@/data/types";
import { useAtlasStore } from "@/atlas/store";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { X, ChevronDown, AlertTriangle } from "lucide-react";
import { splitMorphology, MORPH_COLOR, MORPH_LABEL, layerOf } from "@/atlas/morphology";
import { colorForNode, familyOf } from "@/atlas/families";
import { plainGapGloss } from "@/atlas/plainLanguage";
import { BandMeter } from "./BandMeter";
import { Term, TermScope } from "./Term";
import { NodeGlossary } from "./NodeGlossary";
import { GiraiSnapshot } from "./GiraiSnapshot";
import { MorphologyVsScoreLine } from "./MorphologyVsScoreLine";
import { TrajectorySection } from "./TrajectorySection";
import { ClaimsProvenance } from "./ClaimsProvenance";
import { CoordinatesReadout } from "./CoordinatesReadout";
import { ToVerify } from "./ToVerify";
import { CountryDescent } from "./descent/CountryDescent";
import { ItalyView } from "./descent/ItalyView";

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

  useEffect(() => {
    setLevel("short");
  }, [selectedNodeId]);

  if (!selectedNodeId) return null;

  const node = store.nodesById.get(selectedNodeId);
  if (!node) return null;
  const overlay = store.overlayByNodeId.get(selectedNodeId) ?? null;

  // Curated overlay countries get the layered descent instead of the flat card.
  if (overlay) {
    return <CountryDescent store={store} node={node} overlay={overlay} />;
  }


  const isVision = !!node.vision || layerOf(node.node_id) === "vision";
  const groups = node.documents ?? { primary: [], secondary: [], context: [] };
  const totalDocs = groups.primary.length + groups.secondary.length + groups.context.length;
  const hue = colorForNode(node);
  const layer = layerOf(node.node_id).toUpperCase();
  const showIndependenceFlag = node.independence_flag === true;

  return (
    <aside
      className="pointer-events-auto fixed right-0 top-0 z-30 flex h-screen w-full max-w-[480px] flex-col border-l border-border/70 bg-background/95 backdrop-blur-md"
      role="dialog"
      aria-label={`${node.name} — atlas card`}
    >
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
          {node.region && (
            <>
              <span aria-hidden>·</span>
              <span>{node.region}</span>
            </>
          )}
        </div>
        <h2 className="font-serif text-[26px] font-medium leading-tight tracking-tight text-foreground">
          {node.name}
        </h2>
        <NodeGlossary store={store} node={node} />
        {showIndependenceFlag && (
          <div
            className="mt-3 flex items-start gap-2 border-l-2 pl-2.5 font-serif text-[12.5px] leading-snug"
            style={{ borderColor: "var(--epistemic-warn)", color: "var(--epistemic-warn)" }}
            role="note"
          >
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>Supervisors are government agencies, not independent authorities.</span>
          </div>
        )}
      </header>

      <nav
        role="tablist"
        aria-label="Detail level"
        className="mx-6 mt-4 flex shrink-0 overflow-hidden rounded-sm border border-border/60 bg-secondary/30"
      >
        {LEVELS.map((l) => {
          const active = l.key === level;
          const isDocs = l.key === "docs";
          return (
            <button
              key={l.key}
              role="tab"
              aria-selected={active}
              onClick={() => setLevel(l.key)}
              className={[
                "flex-1 px-2 py-2 font-serif text-[11px] transition-colors",
                active
                  ? "bg-background text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              {l.label}
              {isDocs && totalDocs > 0 && (
                <span className="ml-1 text-muted-foreground">({totalDocs})</span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-10 pt-5">
        <LevelView
          level={level}
          reducedMotion={reducedMotion}
          store={store}
          node={node}
          overlay={overlay}
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
  node,
  overlay,
  isVision,
  hue,
  groups,
}: {
  level: Level;
  reducedMotion: boolean;
  store: DataStore;
  node: AtlasNode;
  overlay: CountryOverlay | null;
  isVision: boolean;
  hue: string;
  groups: AtlasDocumentGroups;
}) {
  return (
    <div
      key={level}
      className={reducedMotion ? "" : "animate-in fade-in-0 slide-in-from-bottom-1 duration-200"}
    >
      {level === "short" && <ShortLevel store={store} node={node} overlay={overlay} hue={hue} />}
      {level === "how" && (
        <HowLevel store={store} node={node} overlay={overlay} isVision={isVision} hue={hue} />
      )}
      {level === "docs" && <DocsLevel groups={groups} overlay={overlay} hue={hue} />}
      {level === "tech" && <TechLevel node={node} overlay={overlay} />}
    </div>
  );
}

/* ---------- Level 1: In short ---------- */

function ShortLevel({
  store,
  node,
  overlay,
  hue,
}: {
  store: DataStore;
  node: AtlasNode;
  overlay: CountryOverlay | null;
  hue: string;
}) {
  const headline = node.headline ?? "";
  const summary = node.summary || node.notes || node.vision?.notes || "";

  // Resolve GIRAI for the country (or its parent country for subnational nodes).
  const directIso = node.iso3 ?? null;
  const parentIso = node.part_of_iso3 ?? null;
  const girai = directIso
    ? store.giraiByIso.get(directIso) ?? null
    : parentIso
      ? store.giraiByIso.get(parentIso) ?? null
      : null;
  const totalCountries = store.girai.countries.length;
  const isStateNode = node.layer === "state";
  const showUnscoredNote = isStateNode && !!directIso && !girai;
  const subnationalNote =
    node.subnational && parentIso && girai
      ? `national (${parentIso}) — GIRAI does not score sub-nationally.`
      : undefined;
  const family = familyOf(node.morphology);

  if (!headline && !summary && !girai && !showUnscoredNote && !overlay) {
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
        {girai && !node.subnational && (
          <MorphologyVsScoreLine family={family} index_score={girai.index_score} />
        )}
        {summary && (
          <p className="font-serif text-[15.5px] leading-relaxed text-foreground/90">
            <Term>{summary}</Term>
          </p>
        )}
        {girai && (
          <GiraiSnapshot
            store={store}
            girai={girai}
            totalCountries={totalCountries}
            contextNote={subnationalNote}
            currentIso={girai.iso3}
          />
        )}
        {showUnscoredNote && (
          <p className="font-serif text-[12.5px] italic leading-relaxed text-muted-foreground">
            Not scored by GIRAI.
          </p>
        )}
        <TrajectorySection store={store} node={node} />
        {overlay && <ClaimsProvenance overlay={overlay} />}
        {overlay && <CoordinatesReadout coordinates={overlay.coordinates} />}
      </div>
    </TermScope>
  );
}


/* ---------- Level 2: How it works ---------- */

function HowLevel({
  store,
  node,
  overlay,
  isVision,
  hue,
}: {
  store: DataStore;
  node: AtlasNode;
  overlay: CountryOverlay | null;
  isVision: boolean;
  hue: string;
}) {
  if (isVision && node.vision) {
    const v = node.vision;
    return (
      <TermScope store={store}>
        <div className="flex flex-col gap-6">
          <VnField label="Source of authority" value={v.source_of_authority ?? ""} />
          <VnField label="Scope" value={v.scope ?? ""} />
          <VnField label="Mode of influence" value={v.mode_of_influence ?? ""} />
          <VnField label="Dated anchor" value={v.dated_anchor ?? ""} />
        </div>
      </TermScope>
    );
  }

  const morphLine = node.morphology_plain ?? "";
  const paperWord = node.paper_plain ?? "";
  const realityWord = node.reality_plain ?? "";
  const isOpaque = !paperWord && !realityWord;

  return (
    <TermScope store={store}>
      <div className="flex flex-col gap-7">
        {morphLine && (
          <p className="font-serif text-[15px] leading-relaxed" style={{ color: hue }}>
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

        {overlay?.readable.how_it_works && (
          <p className="font-serif text-[14px] leading-relaxed text-foreground/85">
            {overlay.readable.how_it_works}
          </p>
        )}

        {node.node_id === "ST-US" && <SubFederal store={store} />}
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
    .map((id) => store.nodesById.get(id))
    .filter((n): n is AtlasNode => !!n);
  if (rows.length === 0) return null;
  return (
    <section>
      <h3 className="mono mb-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        Sub-federal
      </h3>
      <ul className="flex flex-col gap-3">
        {rows.map((n) => (
          <li
            key={n.node_id}
            className="border-l-2 pl-3"
            style={{ borderColor: colorForNode(n) }}
          >
            <p className="font-serif text-[14px] text-foreground/95">{n.name}</p>
            {n.headline && (
              <p className="mt-0.5 font-serif text-[12.5px] italic leading-relaxed text-foreground/70">
                {n.headline}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------- Level 3: Documents ---------- */

function DocsLevel({
  groups,
  overlay,
  hue,
}: {
  groups: AtlasDocumentGroups;
  overlay: CountryOverlay | null;
  hue: string;
}) {
  // Merge curated overlay docs into the Official & primary group.
  const overlayDocs: AtlasDocument[] =
    overlay?.readable.documents
      ?.map((d) => {
        const s = overlay.sources.find((x) => x.source_id === d.source_id);
        if (!s) return null;
        return {
          source_id: s.source_id,
          title: d.label || s.title,
          publisher: s.publisher,
          url: s.url,
          pub_date: s.pub_date,
          source_type: s.source_type,
          origin: "curated",
        } as AtlasDocument;
      })
      .filter((x): x is AtlasDocument => !!x) ?? [];
  const primary = [...overlayDocs, ...groups.primary];
  const { secondary, context } = groups;
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
  items: AtlasDocument[];
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
  items: AtlasDocument[];
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

function TechLevel({ node, overlay }: { node: AtlasNode; overlay: CountryOverlay | null }) {
  const isVision = !!node.vision || layerOf(node.node_id) === "vision";
  if (isVision && node.vision) {
    const v = node.vision;
    return (
      <dl className="mono grid grid-cols-[140px_1fr] gap-y-2.5 text-[11px]">
        <Row k="node_id" v={node.node_id} />
        <Row k="layer" v={node.layer} />
        <Row k="source_of_authority" v={v.source_of_authority ?? ""} />
        <Row k="scope" v={v.scope ?? ""} />
        <Row k="mode_of_influence" v={v.mode_of_influence ?? ""} />
        <Row k="dated_anchor" v={v.dated_anchor ?? ""} />
        <Row k="notes" v={v.notes ?? ""} />
      </dl>
    );
  }

  const { primary, secondary } = splitMorphology(node.morphology);
  return (
    <div className="flex flex-col gap-6">
      <dl className="mono grid grid-cols-[140px_1fr] gap-y-2.5 text-[11px]">
        <Row k="node_id" v={node.node_id} />
        <Row k="layer" v={node.layer} />
        <Row
          k="morphology"
          v={
            (node.morphology ?? "") +
            (primary ? ` (${primary}${secondary ? "+" + secondary : ""} · ${MORPH_LABEL[primary]})` : "")
          }
        />
        <Row k="sub_mechanism" v={node.sub_mechanism ?? ""} />
        <Row k="paper_band" v={node.paper_band ?? ""} />
        <Row k="realization_band" v={node.realization_band ?? ""} />
        <Row k="realization_mode" v={node.realization_mode ?? ""} />
        <Row k="epistemic_level" v={node.epistemic_level ?? ""} />
        <Row k="evidence_strength" v={node.evidence_strength ?? ""} />
        {primary && <Row k="color" v={MORPH_COLOR[primary]} />}
        <Row k="notes" v={node.notes ?? ""} />
      </dl>
      {overlay?.readable.technical_detail && (
        <p className="font-serif text-[13.5px] leading-relaxed text-foreground/85">
          {overlay.readable.technical_detail}
        </p>
      )}
      {overlay?.to_verify && overlay.to_verify.length > 0 && (
        <ToVerify items={overlay.to_verify} />
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  if (!v) return null;
  return (
    <>
      <dt className="uppercase tracking-[0.15em] text-muted-foreground">{k}</dt>
      <dd className="break-words text-foreground/90">{v}</dd>
    </>
  );
}
