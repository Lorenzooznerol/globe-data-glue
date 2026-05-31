// Single source of truth for both UI and globe palettes.

export type ThemeName = "dark" | "light";

export interface AtlasTheme {
  bg: string;
  sphere: string;
  atmosphere: string;
  countryBase: string;     // flat country fill when no choropleth applies
  border: string;          // hairline border on every country
  borderStrong: string;    // hover/selected border
  glyphInk: string;        // direction glyph stroke in Forecasts mode
  giraiLow: string;        // low end of choropleth ramp (hex)
  giraiHigh: string;       // high end of choropleth ramp (hex)
}

export const THEMES: Record<ThemeName, AtlasTheme> = {
  dark: {
    bg: "#0B0E12",
    sphere: "#11151B",
    atmosphere: "#3a4a66",
    countryBase: "rgba(64,72,86,0.18)",
    border: "rgba(255,255,255,0.25)",
    borderStrong: "rgba(255,255,255,0.7)",
    glyphInk: "rgba(232,234,238,0.92)",
    giraiLow: "#2A3340",
    giraiHigh: "#BFE9E4",
  },
  light: {
    bg: "#F7F8FA",
    sphere: "#FFFFFF",
    atmosphere: "#c7c2b8",
    countryBase: "rgba(228,231,236,0.95)",
    border: "rgba(0,0,0,0.22)",
    borderStrong: "rgba(0,0,0,0.65)",
    glyphInk: "rgba(26,29,33,0.92)",
    giraiLow: "#E4E7EC",
    giraiHigh: "#0E6E63",
  },
};

function hexToRgb(hex: string): [number, number, number] {
  const m = hex.replace("#", "");
  return [
    parseInt(m.slice(0, 2), 16),
    parseInt(m.slice(2, 4), 16),
    parseInt(m.slice(4, 6), 16),
  ];
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** Map a GIRAI index_score (0–100) to a CSS rgba string for the active theme. */
export function giraiColor(theme: AtlasTheme, score: number, alpha = 1): string {
  const [lr, lg, lb] = hexToRgb(theme.giraiLow);
  const [hr, hg, hb] = hexToRgb(theme.giraiHigh);
  const t = Math.max(0, Math.min(1, score / 100));
  const e = Math.pow(t, 0.85);
  const r = Math.round(lerp(lr, hr, e));
  const g = Math.round(lerp(lg, hg, e));
  const b = Math.round(lerp(lb, hb, e));
  return `rgba(${r},${g},${b},${alpha})`;
}

export function giraiGradientCss(theme: AtlasTheme): string {
  return `linear-gradient(to right, ${theme.giraiLow}, ${theme.giraiHigh})`;
}
