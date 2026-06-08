import { useMemo } from "react";
import { X } from "lucide-react";
import type { DataStore } from "@/data/store";
import type { AtlasNode } from "@/data/types";
import { useAtlasStore } from "@/atlas/store";
import { useLandingStore } from "./landingStore";
import { nodeMatches, nodesByIso } from "./derive";
import { splitMorphology } from "@/atlas/morphology";

interface Props {
  store: DataStore;
  open: boolean;
  /** When a country dot is clicked from the globe, focus that iso3 in the list. */
  focusedIso: string | null;
  onClose: () => void;
}

export function ResultsPanel({ store, open, focusedIso, onClose }: Props) {
  const f = useLandingStore();
  const selectNode = useAtlasStore((s) => s.selectNode);

  const matchedNodes = useMemo(
    () => store.atlas.nodes.filter((n) => nodeMatches(n, f)),
    [store, f],
  );

  const byIso = useMemo(() => nodesByIso(matchedNodes), [matchedNodes]);

  // If a country is focused via globe click, show its detail. Otherwise: list view.
  const focusList = focusedIso ? store.atlas.nodes.filter(
    (n) => (n.iso3 ?? n.part_of_iso3) === focusedIso,
  ) : null;

  return (
    <aside
      className="landing-panel pointer-events-auto fixed left-0 top-0 z-30 flex h-screen flex-col"
      style={{ width: "min(440px, 40vw)" }}
      data-open={open}
      role="dialog"
      aria-label="Results"
    >
      <div className="flex shrink-0 items-center justify-between border-b border-border/40 px-6 py-5">
        <div>
          <div className="num text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            {focusedIso ? "Country" : "Results"}
          </div>
          <div className="num mt-1 text-[18px] text-foreground">
            {focusedIso
              ? store.giraiByIso.get(focusedIso)?.country ?? focusedIso
              : `${matchedNodes.length} nodes · ${byIso.size} countries`}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="rounded-full p-1.5 text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-3">
        {focusList ? (
          <NodeList nodes={focusList} onSelect={(id) => selectNode(id, { fly: true })} />
        ) : matchedNodes.length === 0 ? (
          <p className="mt-6 text-[13px] italic text-muted-foreground">
            No node matches these filters yet.
          </p>
        ) : (
          <CountryGroups
            byIso={byIso}
            store={store}
            onSelect={(id) => selectNode(id, { fly: true })}
          />
        )}
      </div>
    </aside>
  );
}

function CountryGroups({
  byIso,
  store,
  onSelect,
}: {
  byIso: Map<string, AtlasNode[]>;
  store: DataStore;
  onSelect: (id: string) => void;
}) {
  const entries = Array.from(byIso.entries()).sort((a, b) => {
    const an = store.giraiByIso.get(a[0])?.country ?? a[0];
    const bn = store.giraiByIso.get(b[0])?.country ?? b[0];
    return an.localeCompare(bn);
  });
  return (
    <div className="flex flex-col gap-5 py-2">
      {entries.map(([iso, nodes]) => (
        <div key={iso}>
          <div className="num mb-1 flex items-baseline justify-between text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            <span>{store.giraiByIso.get(iso)?.country ?? iso}</span>
            <span>{nodes.length}</span>
          </div>
          <NodeList nodes={nodes} onSelect={onSelect} />
        </div>
      ))}
    </div>
  );
}

function NodeList({ nodes, onSelect }: { nodes: AtlasNode[]; onSelect: (id: string) => void }) {
  return (
    <ul>
      {nodes.map((n) => {
        const { primary } = splitMorphology(n.morphology);
        const ev = (n.evidence_strength ?? "").toUpperCase();
        return (
          <li key={n.node_id}>
            <button
              type="button"
              onClick={() => onSelect(n.node_id)}
              className="landing-row w-full text-left"
            >
              <span className="num text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                {(n.layer ?? "?")[0]?.toUpperCase()}
              </span>
              <span className="flex flex-col">
                <span className="text-[14px] text-foreground">{n.name}</span>
                {n.headline && (
                  <span className="mt-0.5 line-clamp-1 text-[12px] text-muted-foreground">
                    {n.headline}
                  </span>
                )}
              </span>
              <span className="num flex shrink-0 items-baseline gap-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                {primary && <span>{primary}</span>}
                {ev && <span>{ev[0]}</span>}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
