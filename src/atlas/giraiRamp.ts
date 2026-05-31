// Backward-compat wrapper. Prefer `giraiColor(theme, score)` from `./theme`.
import { THEMES, giraiColor, giraiGradientCss, type ThemeName } from "./theme";

export function giraiRampColor(score: number, alpha = 1, theme: ThemeName = "dark"): string {
  return giraiColor(THEMES[theme], score, alpha);
}

export function giraiRampGradient(theme: ThemeName = "dark"): string {
  return giraiGradientCss(THEMES[theme]);
}

// Legacy constants — kept so older imports don't break, but new code should use the theme.
export const RAMP_LOW_HEX = THEMES.dark.giraiLow;
export const RAMP_HIGH_HEX = THEMES.dark.giraiHigh;
export const RAMP_GRADIENT_CSS = giraiGradientCss(THEMES.dark);
