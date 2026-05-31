import { create } from "zustand";
import type { Layer, MorphCode } from "./morphology";

const ALL_LAYERS: Layer[] = ["state", "actor", "deployer", "vision"];

interface AtlasState {
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
  flyToken: number; // bump to request a camera fly to the current selection
  layers: Set<Layer>;
  morphologies: Set<MorphCode>; // empty = no filter
  sideIndexOpen: boolean;
  reducedMotion: boolean;

  selectNode: (id: string | null, opts?: { fly?: boolean }) => void;
  setHovered: (id: string | null) => void;
  toggleLayer: (l: Layer) => void;
  toggleMorphology: (m: MorphCode) => void;
  clearMorphologies: () => void;
  toggleSideIndex: () => void;
  setReducedMotion: (v: boolean) => void;
}

export const useAtlasStore = create<AtlasState>((set) => ({
  selectedNodeId: null,
  hoveredNodeId: null,
  flyToken: 0,
  layers: new Set(ALL_LAYERS),
  morphologies: new Set(),
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

  toggleMorphology: (m) =>
    set((s) => {
      const next = new Set(s.morphologies);
      if (next.has(m)) next.delete(m);
      else next.add(m);
      return { morphologies: next };
    }),

  clearMorphologies: () => set({ morphologies: new Set() }),
  toggleSideIndex: () => set((s) => ({ sideIndexOpen: !s.sideIndexOpen })),
  setReducedMotion: (v) => set({ reducedMotion: v }),
}));
