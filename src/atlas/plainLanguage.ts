// Plain-language glosses — verbatim from the brief. The readable layer.
import type { MorphCode } from "./morphology";

export const MORPH_PLAIN: Record<MorphCode, string> = {
  M1: "Open gap — ambitious on paper, lagging in practice. The rules exist; the capacity to enforce them is still being built.",
  M2: "Inversion — stronger in practice than on paper. There's no big AI law, but courts and lawsuits create real consequences.",
  M3: "Controlled upfront — systems must be cleared before they launch, so the rules and reality line up at the gate.",
  M4: "Hidden gap — compliant on the surface, divergent underneath. The conflict is real but kept out of sight.",
  M5: "Closed — the real picture can't be seen from outside; the opacity is deliberate.",
  M6: "Self-imposed and reversible — a private safety promise the company can quietly rewrite or drop.",
  M7: "Light by design, or not built yet — little gap because there isn't much binding rule in place.",
};

/** Short headline form (one short clause) for hover labels & summary lines. */
export const MORPH_HEADLINE: Record<MorphCode, string> = {
  M1: "Ambitious on paper, lagging in practice.",
  M2: "Stronger in practice than on paper.",
  M3: "Cleared upfront — rules and reality line up at the gate.",
  M4: "Compliant on the surface, divergent underneath.",
  M5: "Closed — deliberately opaque from outside.",
  M6: "Self-imposed and reversible private commitments.",
  M7: "Light by design, or not built yet.",
};

export const SUBMECH_PLAIN: Record<string, string> = {
  "deliberate-light-touch": "A deliberate choice to stay light-touch.",
  "legislative-pending": "A binding law is on the way.",
  "nascent-capacity": "Just getting started.",
  "developmental-promotional": "Build fast, govern light.",
  "institutional-regression": "A capacity that existed was dismantled.",
  "reverted": "A planned law was abandoned.",
};

export const BAND_ORDER = ["CI", "IN", "AS", "S", "C"] as const;
export type BandCode = (typeof BAND_ORDER)[number];

export const BAND_PLAIN: Record<BandCode, string> = {
  CI: "almost none",
  IN: "minimal",
  AS: "partial",
  S: "substantial",
  C: "comprehensive",
};

export function bandPlain(code: string | undefined): string {
  const u = (code ?? "").trim().toUpperCase() as BandCode;
  return BAND_PLAIN[u] ?? "—";
}

export function bandStep(code: string | undefined): number {
  const u = (code ?? "").trim().toUpperCase() as BandCode;
  const i = BAND_ORDER.indexOf(u);
  return i < 0 ? 0 : i + 1; // 1..5
}

/** A one-line gap gloss derived from paper vs realization band delta. */
export function gapGloss(paper: string, reality: string): string {
  const p = bandStep(paper);
  const r = bandStep(reality);
  if (!p && !r) return "";
  if (p === r) return "What's written and what happens are roughly aligned.";
  if (p > r) return "Ambitious on paper, still ramping in practice.";
  return "Quieter on paper than the practice on the ground.";
}

export function plainHeadline(morphology: string | undefined): string {
  if (!morphology) return "";
  const m = morphology.match(/M[1-7]/);
  if (!m) return "";
  return MORPH_HEADLINE[m[0] as MorphCode] ?? "";
}

export function plainMorph(morphology: string | undefined): string {
  if (!morphology) return "";
  const m = morphology.match(/M[1-7]/);
  if (!m) return "";
  return MORPH_PLAIN[m[0] as MorphCode] ?? "";
}
