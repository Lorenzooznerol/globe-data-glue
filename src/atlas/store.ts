import { create } from "zustand";
import type { Family } from "./families";
import type { ThemeName } from "./theme";

export type AtlasMode = "overview" | "girai" | "forecasts";
export type UserStance = "yes" | "no" | null;

interface AtlasState {
  selectedNodeId: string | null;
  selectedIso: string | null;
  hoveredNodeId: string | null;
  flyToken: number;
  families: Set<Family>;
  sideIndexOpen: boolean;
  reducedMotion: boolean;
  mode: AtlasMode;
  migrationToken: number;
  theme: ThemeName;
  userStance: UserStance;

  selectNode: (id: string | null, opts?: { fly?: boolean }) => void;
  selectIso: (iso: string | null) => void;
  clearIso: () => void;
  setHovered: (id: string | null) => void;
  toggleFamily: (f: Family) => void;
  clearFamilies: () => void;
  toggleSideIndex: () => void;
  setReducedMotion: (v: boolean) => void;
  setMode: (m: AtlasMode) => void;
  playMigrations: () => void;
  setTheme: (t: ThemeName) => void;
  toggleTheme: () => void;
  setUserStance: (s: UserStance) => void;
}

export const useAtlasStore = create<AtlasState>((set) => ({
  selectedNodeId: null,
  selectedIso: null,
  hoveredNodeId: null,
  flyToken: 0,
  families: new Set(),
  sideIndexOpen: false,
  reducedMotion: false,
  mode: "overview",
  migrationToken: 0,
  theme: "dark",

  selectNode: (id, opts) =>
    set((s) => ({
      selectedNodeId: id,
      selectedIso: id ? null : s.selectedIso,
      flyToken: id && opts?.fly !== false ? s.flyToken + 1 : s.flyToken,
    })),
  selectIso: (iso) => set({ selectedIso: iso, selectedNodeId: null }),
  clearIso: () => set({ selectedIso: null }),
  setHovered: (id) => set({ hoveredNodeId: id }),

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
  setTheme: (t) => set({ theme: t }),
  toggleTheme: () => set((s) => ({ theme: s.theme === "dark" ? "light" : "dark" })),
}));
