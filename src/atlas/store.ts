import { create } from "zustand";
import type { Layer, MorphCode } from "./morphology";

const ALL_LAYERS: Layer[] = ["state", "actor", "deployer", "vision"];

interface Filters {
  layers: Set<Layer>;
  morphologies: Set<MorphCode>; // empty = no morphology filter (everything shown)
}

interface Rings {
  actors: boolean;
  deployers: boolean;
  vision: boolean;
}

interface AtlasState {
  selectedNodeId: string | null;
  pendingFlyTo: { id: string; nonce: number } | null;
  filters: Filters;
  rings: Rings;
  libraryOpen: boolean;
  libraryTab: "sources" | "claims";
  reducedMotion: boolean;

  selectNode: (id: string | null) => void;
  toggleLayer: (l: Layer) => void;
  toggleMorphology: (m: MorphCode) => void;
  clearMorphologyFilter: () => void;
  toggleRing: (key: keyof Rings) => void;
  openLibrary: (tab?: "sources" | "claims") => void;
  closeLibrary: () => void;
  setLibraryTab: (tab: "sources" | "claims") => void;
  setReducedMotion: (v: boolean) => void;
}

export const useAtlasStore = create<AtlasState>((set) => ({
  selectedNodeId: null,
  pendingFlyTo: null,
  filters: { layers: new Set(ALL_LAYERS), morphologies: new Set() },
  rings: { actors: true, deployers: true, vision: true },
  libraryOpen: false,
  libraryTab: "sources",
  reducedMotion: false,

  selectNode: (id) =>
    set((s) => ({
      selectedNodeId: id,
      pendingFlyTo: id ? { id, nonce: (s.pendingFlyTo?.nonce ?? 0) + 1 } : null,
    })),

  toggleLayer: (l) =>
    set((s) => {
      const next = new Set(s.filters.layers);
      if (next.has(l)) next.delete(l);
      else next.add(l);
      return { filters: { ...s.filters, layers: next } };
    }),

  toggleMorphology: (m) =>
    set((s) => {
      const next = new Set(s.filters.morphologies);
      if (next.has(m)) next.delete(m);
      else next.add(m);
      return { filters: { ...s.filters, morphologies: next } };
    }),

  clearMorphologyFilter: () =>
    set((s) => ({ filters: { ...s.filters, morphologies: new Set() } })),

  toggleRing: (key) =>
    set((s) => ({ rings: { ...s.rings, [key]: !s.rings[key] } })),

  openLibrary: (tab) =>
    set((s) => ({ libraryOpen: true, libraryTab: tab ?? s.libraryTab })),
  closeLibrary: () => set({ libraryOpen: false }),
  setLibraryTab: (tab) => set({ libraryTab: tab }),
  setReducedMotion: (v) => set({ reducedMotion: v }),
}));

/** Returns true if a morphology code passes the current filter (empty filter = pass all). */
export function morphologyPasses(filter: Set<MorphCode>, code: MorphCode | null): boolean {
  if (filter.size === 0) return true;
  if (!code) return false;
  return filter.has(code);
}
