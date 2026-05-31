// Helpers for Trajectory mode: glyph mapping, marker titles, countdown, causal chain.

export type GlyphKind =
  | "stability"
  | "enactment"
  | "lag"
  | "durability"
  | "refinement"
  | "unknown";

export function directionGlyph(direction: string | undefined | null): GlyphKind {
  const d = (direction ?? "").toLowerCase();
  if (!d) return "unknown";
  if (d.includes("stability")) return "stability";
  if (d.includes("enactment")) return "enactment";
  if (d.includes("realization-lag") || d.includes("lag")) return "lag";
  if (d.includes("variable-durability") || d.includes("durability")) return "durability";
  if (d.includes("refinement")) return "refinement";
  return "unknown";
}

const MARKER_TITLES: Record<string, string> = {
  M3: "Cleared at the gate holds",
  M6: "Self-imposed promises erode",
  M1: "Capacity, not will, is the brake",
  "M7-DLT": "Deliberately light stays light",
};

export function markerTitle(marker_id: string | undefined | null): string {
  if (!marker_id) return "Thesis";
  return MARKER_TITLES[marker_id] ?? marker_id;
}

/** Map a prediction.marker value (e.g. "M7-DLT-fails") to a marker_id in atlas.markers. */
export function resolveMarkerId(
  predictionMarker: string | undefined | null,
  markerIds: string[],
): string | null {
  if (!predictionMarker) return null;
  if (markerIds.includes(predictionMarker)) return predictionMarker;
  // longest prefix match
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

export function formatCountdown(isoDate: string | undefined | null, now: Date = new Date()): Countdown | null {
  if (!isoDate) return null;
  const target = new Date(isoDate);
  if (Number.isNaN(target.getTime())) return null;
  const monthLabel = `${MONTH_LABEL[target.getUTCMonth()]} ${target.getUTCFullYear()}`;
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
