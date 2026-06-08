// Landing-only filter slice. Lives separately from useAtlasStore so that
// `families`, `mode`, `selectedNodeId` and the rest of the legacy state
// keep working untouched. The landing reads/writes here; the globe reads
// `matchingIsoSet` / `matchingNodeIds` via a derived selector.

import { create } from "zustand";
import type { MorphCode, Band, Layer } from "@/atlas/morphology";

export type EvidenceLevel = "STRONG" | "WEAK" | "OPAQUE";

export interface LandingFilters {
  query: string;
  jurisdiction: Set<string>; // iso3
  layer: Set<Layer>;
  morphology: Set<MorphCode>;
  paperBand: Set<Band>;
  realBand: Set<Band>;
  evidence: Set<EvidenceLevel>;
}

interface LandingState extends LandingFilters {
  setQuery: (q: string) => void;
  toggle: <K extends keyof LandingFilters>(key: K, value: string) => void;
  clearFacet: (key: keyof LandingFilters) => void;
  clearAll: () => void;
}

const EMPTY: LandingFilters = {
  query: "",
  jurisdiction: new Set(),
  layer: new Set(),
  morphology: new Set(),
  paperBand: new Set(),
  realBand: new Set(),
  evidence: new Set(),
};

export const useLandingStore = create<LandingState>((set) => ({
  ...EMPTY,
  setQuery: (q) => set({ query: q }),
  toggle: (key, value) =>
    set((s) => {
      if (key === "query") return s;
      const current = s[key] as Set<string>;
      const next = new Set(current);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return { [key]: next } as Partial<LandingState>;
    }),
  clearFacet: (key) =>
    set(() => {
      if (key === "query") return { query: "" };
      return { [key]: new Set() } as Partial<LandingState>;
    }),
  clearAll: () => set({ ...EMPTY }),
}));

export function isLandingActive(f: LandingFilters): boolean {
  if (f.query.trim().length > 0) return true;
  return (
    f.jurisdiction.size +
      f.layer.size +
      f.morphology.size +
      f.paperBand.size +
      f.realBand.size +
      f.evidence.size >
    0
  );
}
