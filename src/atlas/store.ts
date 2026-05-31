import { create } from "zustand";
import type { Layer } from "./morphology";
import type { Family } from "./families";

const DEFAULT_LAYERS: Layer[] = ["state", "actor", "vision"];

interface AtlasState {
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
  flyToken: number; // bump to request a camera fly to the current selection
  layers: Set<Layer>;
  families: Set<Family>; // empty = no filter
  sideIndexOpen: boolean;
  reducedMotion: boolean;

  selectNode: (id: string | null, opts?: { fly?: boolean }) => void;
  setHovered: (id: string | null) => void;
  toggleLayer: (l: Layer) => void;
  toggleFamily: (f: Family) => void;
  clearFamilies: () => void;
  toggleSideIndex: () => void;
  setReducedMotion: (v: boolean) => void;
}

export const useAtlasStore = create<AtlasState>((set) => ({
  selectedNodeId: null,
  hoveredNodeId: null,
  flyToken: 0,
  layers: new Set(DEFAULT_LAYERS),
  families: new Set(),
  sideIndexOpen: false,
  reducedMotion: false,

  selectNode: (id, opts) =>
    set((s) => ({
      selectedNodeId: id,
      flyToken: id && opts?.fly !== false ? s.flyToken + 1 : s.flyToken,
    })),
  setHovered: (id) => set({ hoveredNodeId: id }),

  toggleLayer: (l) =>
    set((s) => {
      const next = new Set(s.layers);
      if (next.has(l)) next.delete(l);
      else next.add(l);
      return { layers: next };
    }),

  toggleFamily: (f) =>
    set((s) => {
      const next = new Set(s.families);
      if (next.has(f)) next.delete(f);
      else next.add(f);
      return { families: next };
    }),

  clearFamilies: () => set({ families: new Set() }),
  toggleSideIndex: () => set((s) => ({ sideIndexOpen: !s.sideIndexOpen })),
  setReducedMotion: (v) => set({ reducedMotion: v }),
}));
