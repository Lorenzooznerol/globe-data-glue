// Sequential ramp for the GIRAI base layer: low = desaturated slate,
// high = pale luminous cyan-white. Interpolated linearly in sRGB.

const LOW: [number, number, number] = [0x2a, 0x33, 0x40]; // #2A3340
const HIGH: [number, number, number] = [0xbf, 0xe9, 0xe4]; // #BFE9E4

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** Map a GIRAI index_score (0–100) to a CSS rgba string. */
export function giraiRampColor(score: number, alpha = 1): string {
  const t = Math.max(0, Math.min(1, score / 100));
  // Apply mild gamma so near-zero scorers stay visible at the dark end.
  const e = Math.pow(t, 0.85);
  const r = Math.round(lerp(LOW[0], HIGH[0], e));
  const g = Math.round(lerp(LOW[1], HIGH[1], e));
  const b = Math.round(lerp(LOW[2], HIGH[2], e));
  return `rgba(${r},${g},${b},${alpha})`;
}

export const RAMP_LOW_HEX = "#2A3340";
export const RAMP_HIGH_HEX = "#BFE9E4";

/** CSS linear-gradient string for the legend bar. */
export const RAMP_GRADIENT_CSS = `linear-gradient(to right, ${RAMP_LOW_HEX}, ${RAMP_HIGH_HEX})`;
