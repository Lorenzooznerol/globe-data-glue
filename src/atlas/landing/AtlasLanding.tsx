import { useEffect, useMemo, useState } from "react";
import type { DataStore } from "@/data/store";
import { useAtlasStore } from "@/atlas/store";
import { useLandingStore, isLandingActive } from "./landingStore";
import { nodesByIso } from "./derive";
import { TopBar } from "./TopBar";
import { SearchHero } from "./SearchHero";
import { FilterChips } from "./FilterChips";
import { ResultsPanel } from "./ResultsPanel";
import "./landing.css";

interface Props {
  store: DataStore;
}

/**
 * Orchestrator for the Language-Explorer landing.
 * - Two states (rest / active) driven by `landingFilters` + selected globe dot.
 * - Mounts top bar, hero (which collapses), chip row, and side results panel.
 * - When the user clicks a country dot on the globe, `selectedIso` is set
 *   in the legacy store and we open the panel focused on that ISO.
 */
export function AtlasLanding({ store }: Props) {
  const filters = useLandingStore();
  const active = isLandingActive(filters);

  const selectedIso = useAtlasStore((s) => s.selectedIso);
  const clearIso = useAtlasStore((s) => s.clearIso);

  const [panelOpen, setPanelOpen] = useState(false);

  // Open panel automatically when filters become active or a country is focused.
  useEffect(() => {
    if (active || selectedIso) setPanelOpen(true);
    else setPanelOpen(false);
  }, [active, selectedIso]);

  // Escape: clear focused iso first, else clear filters.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (selectedIso) clearIso();
      else if (active) useLandingStore.getState().clearAll();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedIso, active, clearIso]);

  const totals = useMemo(() => {
    const nodes = store.atlas.nodes;
    return { nodes: nodes.length, countries: nodesByIso(nodes).size };
  }, [store]);

  const shellActive = active || !!selectedIso;

  return (
    <div className="atlas-landing pointer-events-none absolute inset-0 z-10">
      <TopBar />

      <SearchHero
        active={shellActive}
        totalNodes={totals.nodes}
        totalCountries={totals.countries}
      />

      {/* Chip row — sits below the search pill in both states. */}
      <div
        className="pointer-events-none absolute left-1/2 z-30 -translate-x-1/2"
        style={{
          top: shellActive
            ? "72px"
            : "calc(20vh + clamp(2.6rem, 6vw, 5.2rem) + 90px + 70px)",
          transition: "top 550ms cubic-bezier(0.22,0.61,0.36,1)",
          width: "min(900px, 90vw)",
        }}
      >
        <div className="pointer-events-auto px-4">
          <FilterChips store={store} />
        </div>
      </div>

      <ResultsPanel
        store={store}
        open={panelOpen}
        focusedIso={selectedIso}
        onClose={() => {
          if (selectedIso) clearIso();
          useLandingStore.getState().clearAll();
        }}
      />
    </div>
  );
}
