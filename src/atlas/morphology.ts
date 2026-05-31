// Morphology palette + helpers. Morphology is the ONLY categorical color in the app.

export type MorphCode = "M1" | "M2" | "M3" | "M4" | "M5" | "M6" | "M7";
export type Layer = "state" | "actor" | "deployer" | "vision";

export const MORPH_COLOR: Record<MorphCode, string> = {
  M1: "#5b7a99",
  M2: "#5a8a86",
  M3: "#5f8c63",
  M4: "#7d6a96",
  M5: "#7a7a7a",
  M6: "#a98a52",
  M7: "#6b7385",
};

export const MORPH_LABEL: Record<MorphCode, string> = {
  M1: "open gap",
  M2: "inversion",
  M3: "ex-ante convergence",
  M4: "submerged gap",
  M5: "opacity",
  M6: "revocable self-binding",
  M7: "aligned-nascent",
};

export const MORPH_ORDER: MorphCode[] = ["M1", "M2", "M3", "M4", "M5", "M6", "M7"];

/** Split "M3+M4" -> { primary:'M3', secondary:'M4' }; "M7-then-enacted" -> { primary:'M7' }. */
export function splitMorphology(raw: string | undefined): {
  primary: MorphCode | null;
  secondary: MorphCode | null;
} {
  if (!raw) return { primary: null, secondary: null };
  const m = raw.match(/M[1-7]/g);
  if (!m) return { primary: null, secondary: null };
  const primary = (m[0] as MorphCode) ?? null;
  const secondary = (m[1] as MorphCode) ?? null;
  return { primary, secondary };
}

export function colorFor(raw: string | undefined): string {
  const { primary } = splitMorphology(raw);
  return primary ? MORPH_COLOR[primary] : "#777";
}

export function evidenceOpacity(evidence: string | undefined): number {
  switch ((evidence ?? "").toUpperCase()) {
    case "STRONG":
      return 1.0;
    case "WEAK":
      return 0.5;
    case "OPAQUE":
      return 0.22;
    default:
      return 0.7;
  }
}

export function layerOf(id: string): Layer {
  if (id.startsWith("ST-")) return "state";
  if (id.startsWith("AC-")) return "actor";
  if (id.startsWith("DP-")) return "deployer";
  if (id.startsWith("VN-")) return "vision";
  return "state";
}

// Band ordinals: low realization (CI) -> high realization (C). 5 levels.
export const BANDS = ["CI", "IN", "AS", "S", "C"] as const;
export type Band = (typeof BANDS)[number];

export function bandIndex(band: string | undefined): number {
  const idx = BANDS.indexOf((band ?? "").trim().toUpperCase() as Band);
  return idx < 0 ? 0 : idx;
}
