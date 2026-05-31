import { create } from "zustand";
import type { Layer } from "./morphology";
import type { Family } from "./families";

const DEFAULT_LAYERS: Layer[] = ["state", "actor", "vision"];

export type AtlasMode = "overview" | "girai" | "trajectory";

interface AtlasState {
  selectedNodeId: string | null;
  selectedIso: string | null;
  hoveredNodeId: string | null;
  flyToken: number;
  layers: Set<Layer>;
  families: Set<Family>;
  sideIndexOpen: boolean;
  reducedMotion: boolean;
  mode: AtlasMode;
  migrationToken: number;

  selectNode: (id: string | null, opts?: { fly?: boolean }) => void;
  selectIso: (iso: string | null) => void;
  clearIso: () => void;
  setHovered: (id: string | null) => void;
  toggleLayer: (l: Layer) => void;
  toggleFamily: (f: Family) => void;
  clearFamilies: () => void;
  toggleSideIndex: () => void;
  setReducedMotion: (v: boolean) => void;
  setMode: (m: AtlasMode) => void;
  playMigrations: () => void;
}

export const useAtlasStore = create<AtlasState>((set) => ({
  selectedNodeId: null,
  selectedIso: null,
  hoveredNodeId: null,
  flyToken: 0,
  layers: new Set(DEFAULT_LAYERS),
  families: new Set(),
  sideIndexOpen: false,
  reducedMotion: false,
  mode: "overview",
  migrationToken: 0,

  selectNode: (id, opts) =>
    set((s) => ({
      selectedNodeId: id,
      selectedIso: id ? null : s.selectedIso,
      flyToken: id && opts?.fly !== false ? s.flyToken + 1 : s.flyToken,
    })),
  selectIso: (iso) => set({ selectedIso: iso, selectedNodeId: null }),
  clearIso: () => set({ selectedIso: null }),
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
  setMode: (m) => set({ mode: m }),
  playMigrations: () => set((s) => ({ migrationToken: s.migrationToken + 1 })),
}));
