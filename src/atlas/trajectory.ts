// Helpers for Trajectory mode: glyph mapping, marker titles, countdown, plain prose.

import type { AtlasPrediction } from "@/data/types";

export type GlyphKind = "holds" | "rising" | "eroding";

export function directionGlyph(direction: string | undefined | null): GlyphKind {
  const d = (direction ?? "").toLowerCase();
  if (!d) return "holds";
  if (d.includes("variable-durability") || d.includes("durability") || d.includes("erod"))
    return "eroding";
  if (d.includes("enactment") || d.includes("realization") || d.includes("lag")) return "rising";
  // stability, refinement-test, anything else → holds
  return "holds";
}

const GLYPH_LABEL: Record<GlyphKind, string> = {
  holds: "Holds",
  rising: "Rising",
  eroding: "Eroding",
};

export function glyphLabel(k: GlyphKind): string {
  return GLYPH_LABEL[k];
}

const MARKER_TITLES: Record<string, string> = {
  M3: "Cleared at the gate holds",
  M6: "Self-imposed promises erode",
  M1: "Capacity, not will, is the brake",
  "M7-DLT": "Deliberately light stays light",
};

const MARKER_GLOSS: Record<string, string> = {
  M3: "Where the state pre-clears AI uses, those approvals stick — the bottleneck holds.",
  M6: "When firms promise themselves, the slowest signatory drifts and the floor sags.",
  M1: "New AI laws pass on time but bite slowly — the brake is enforcement capacity, not political will.",
  "M7-DLT": "Frameworks designed to be deliberately light stay light, even under pressure.",
};

export function markerTitle(marker_id: string | undefined | null): string {
  if (!marker_id) return "Thesis";
  return MARKER_TITLES[marker_id] ?? marker_id;
}

export function markerGloss(marker_id: string | undefined | null): string {
  if (!marker_id) return "";
  return MARKER_GLOSS[marker_id] ?? "";
}

/** Map a prediction.marker value (e.g. "M7-DLT-fails") to a marker_id in atlas.markers. */
export function resolveMarkerId(
  predictionMarker: string | undefined | null,
  markerIds: string[],
): string | null {
  if (!predictionMarker) return null;
  if (markerIds.includes(predictionMarker)) return predictionMarker;
  const matches = markerIds
    .filter((id) => predictionMarker.startsWith(id))
    .sort((a, b) => b.length - a.length);
  return matches[0] ?? null;
}

export function splitCausalChain(s: string | undefined | null): string[] {
  if (!s) return [];
  return s
    .split(/\s*->\s*/)
    .map((step) => step.trim())
    .filter(Boolean);
}

export interface Countdown {
  line: string;
  months: number;
  overdue: boolean;
}

const MONTH_LABEL = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function friendlyMonth(isoDate: string | undefined | null): string {
  if (!isoDate) return "";
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return "";
  return `${MONTH_LABEL[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function formatCountdown(isoDate: string | undefined | null, now: Date = new Date()): Countdown | null {
  if (!isoDate) return null;
  const target = new Date(isoDate);
  if (Number.isNaN(target.getTime())) return null;
  const monthLabel = friendlyMonth(isoDate);
  const diffMs = target.getTime() - now.getTime();
  const months = Math.round(diffMs / (1000 * 60 * 60 * 24 * 30.44));
  const overdue = diffMs < 0;
  let suffix: string;
  if (overdue) {
    const absM = Math.abs(months);
    suffix = absM === 0 ? "due now" : `~${absM} month${absM === 1 ? "" : "s"} overdue`;
  } else if (months === 0) {
    suffix = "due this month";
  } else {
    suffix = `~${months} month${months === 1 ? "" : "s"}`;
  }
  return {
    line: `falsifies if not met by ${monthLabel} · ${suffix}`,
    months,
    overdue,
  };
}

/** Plain-language rewrites of the 10 known predictions, keyed by pred_id. */
const PLAIN_PREDICTIONS: Record<string, string> = {
  P1: "The UK keeps governing AI through sector regulators — no horizontal AI law arrives by end-2027.",
  P2: "India sticks with voluntary AI guidelines through 2027 — no binding horizontal AI law passes.",
  P3: "Singapore stays on its voluntary framework path — no binding AI Act by end-2027.",
  P4: "Brazil enacts a binding AI law by end-2026, but enforcement ramps slowly afterwards.",
  P5: "Chile's AI bill clears the Senate and is enacted by end-2027, with secondary rules lagging.",
  P6: "Colombia does not pass a binding horizontal AI law by end-2026 — fragmentation wins out.",
  P7: "South Korea's new AI Act takes effect in January 2027, but enforcement actions stay scarce in its first year.",
  P8: "Vietnam's AI rules take effect in 2026, but real enforcement stays minimal through the grace period.",
  P9: "China keeps its pre-clearance gate running stably through end-2027 — no abandonment, continued enforcement.",
  P10: "xAI's voluntary safety commitments fray through end-2026 — at least one signatory visibly slips, no convergence.",
};

export function plainPrediction(p: AtlasPrediction): string {
  const id = p.pred_id;
  if (id && PLAIN_PREDICTIONS[id]) return PLAIN_PREDICTIONS[id];
  return p.predicted_trajectory || "Predicted trajectory not specified.";
}
