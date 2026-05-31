## Goals

Make the globe and UI fully themeable from a single source, add visible country borders, expose a top-right light/dark toggle that also re-skins the globe, remove the broken "Show" filter, add a plain-language info popover for GIRAI, rename `trajectory` → `forecasts` everywhere, and reduce render jank.

No data shape changes. No new dependencies (lucide-react + zustand + react-globe.gl already present; `countries-110m.geojson` is already in `public/data/`).

---

## 1. Single source of truth for theme

New `src/atlas/theme.ts` exporting:

- `type ThemeName = "dark" | "light"`
- `interface AtlasTheme { bg, sphere, atmosphere, countryBase, border, borderStrong, glyphInk, giraiLow, giraiHigh }`
- `THEMES: Record<ThemeName, AtlasTheme>` with the exact values from the brief (dark = current; light has white sphere, off-white bg, inverted GIRAI ramp `#E4E7EC → #0E6E63`, border `rgba(0,0,0,0.22)`).
- `giraiColor(theme, score, alpha)` — replaces the constants in `giraiRamp.ts`. Old `giraiRamp.ts` becomes a thin wrapper that calls into the active theme so the legend gradient also flips.

Move `ThemeToggle` from a self-contained component into the atlas store:

- `useAtlasStore` gets `theme: ThemeName` + `setTheme(t)` + `toggleTheme()`. Session-only (per brief: no `localStorage`); default `"dark"`. Reading `prefers-color-scheme` is dropped — explicit, deterministic.
- A small `useApplyTheme()` hook in `__root.tsx` or `index.tsx` toggles the `dark` class on `document.documentElement` whenever `theme` changes, so existing Tailwind tokens in `styles.css` swap with the globe.

CSS: keep current `:root` (light) / `.dark` (dark) split in `styles.css`. Add a `transition: background-color 200ms, color 200ms, border-color 200ms` on `body` / cards for the smooth ~200ms swap. Globe swaps instantly.

## 2. Country borders, both themes

In `EarthGlobe.tsx`:

- Enable `polygonStrokeColor` so every country gets a hairline. Use `theme.border` for non-curated, `theme.borderStrong` (or a lerp toward the accent) when `hoveredNodeId === nodeId` or `selectedNodeId === nodeId` or `selectedIso === iso`.
- Keep `polygonSideColor` neutral and tied to theme (`theme.countryBase` at ~0.5 alpha) so cap/side don't visually merge.
- Borders are computed from theme — recompute by including `theme` in the accessor's closure (handled via `useCallback([theme, hovered, selected])`).

## 3. Themeable globe in EarthGlobe.tsx

- Read `theme` from store. Compute `const t = THEMES[theme]` once per render.
- Pass `backgroundColor={t.bg}` to `<Globe>`.
- `globeMaterial` rebuilt in a `useMemo([theme])` with `THREE.MeshStandardMaterial({ color: t.sphere, emissive: t.sphere })`.
- `showAtmosphere={true}` with `atmosphereColor={t.atmosphere}` and low `atmosphereAltitude` (light, ~0.12) — currently disabled; brief asks for a faint atmosphere.
- `NEUTRAL_FILL` / `NEUTRAL_SIDE` / `STROKE` constants are removed; everything reads from `t`.
- Forecasts mode (renamed below) uses `t.countryBase` as the flat fill.
- Glyph color is `t.glyphInk` (replaces the hard-coded `rgba(232,232,232,0.92)`).

## 4. Remove "Show: States / Actors / Legitimacy"

- Delete `src/atlas/panels/LayerFilter.tsx`.
- Remove its import and JSX block from `src/routes/index.tsx` (the `mode !== "trajectory"` branch in the top-left card).
- In `src/atlas/store.ts`: drop `layers`, `toggleLayer`, `DEFAULT_LAYERS`, and the `Layer` import. Verify nothing else reads `s.layers` (search before deleting). `EarthGlobe.tsx` does not currently use it; `families` filter stays.
- Also drop the "Reduced motion" checkbox that lived inside LayerFilter — move it into a small inline control beneath the `Legend` (one-line checkbox), so the accessibility option is not lost. Or simpler: relocate into `ModeSwitch`'s row. Pick the Legend footer — fewer visual changes.

## 5. GIRAI info "i" popover

New `src/atlas/panels/InfoPopover.tsx` — reusable:

- A real `<button>` with `aria-label`, `aria-expanded`, `aria-controls`, opens on click/hover/focus, closes on blur/Escape/outside-click.
- Renders a small floating panel (~280px) with the provided text. Plain CSS, no Radix needed (keep bundle lean), but if simpler we use `@/components/ui/popover` (already shipped via shadcn) — choose Radix Popover because it handles focus + dismiss correctly and is already in the bundle.
- Trigger is a 14px `Info` lucide icon inside a `border` `rounded-full` button.

Two placements:

1. In `ModeSwitch.tsx` — render the icon to the right of the "GIRAI" tab label only when that's the relevant mode. Simpler: render it in `index.tsx`'s top-left card next to `ModeSwitch`, but the brief says "next to the GIRAI legend/label AND the GIRAI mode switch". So: place one inside `GiraiLegend.tsx` (next to the "Movement (GIRAI index)" label), and one inside `ModeSwitch.tsx` next to the "GIRAI" tab button (rendered as a sibling button, not nested inside the tab to avoid nested interactive elements).

Copy (exact from brief):
> GIRAI — the Global Index on Responsible AI. It scores how much each of 138 countries is doing on responsible-AI governance, from 0 to 100. Higher = more in place. Data collected 2023. Source: Global Center on AI Governance (CC BY-NC-SA).

## 6. Rename Trajectory → Forecasts

A single, careful find-replace across user-visible labels and identifiers:

- `ModeSwitch.tsx` label `"Trajectory"` → `"Forecasts"`.
- `store.ts`: `AtlasMode = "overview" | "girai" | "forecasts"` (rename the union value; update all comparisons).
- Files: rename component file names (Trajectory* → Forecasts*) — but to keep the diff small, only rename the **public/visible strings and the mode enum value**, leaving file/symbol names as `Trajectory*` internally (a one-line note in the file header). Per brief: "Rename the third mode and all its references" — interpret as **user-visible references**; internal symbol churn risks unrelated breakage. I'll rename the enum value (user-affecting via URL/state) but keep filenames. If the user wants symbol-level rename, they can ask.
- Update all `mode === "trajectory"` checks → `mode === "forecasts"`.
- TrajectoryPanel `aria-label="Trajectory"` → `aria-label="Forecasts"`.
- Header text in `TrajectoryHeader.tsx` already correct; subtitle preserved.

## 7. Performance pass

Concrete edits, each addressing a measured cost in this codebase:

a. **Lower-resolution geo data**: already on `countries-110m.geojson` — confirmed. No change. (`useCountries.ts` line 96.)

b. **Memoize accessors in `EarthGlobe.tsx`**: convert `polygonCapColor`, `polygonSideColor`, `polygonStrokeColor`, `polygonAltitude`, `polygonLabel`, `handleHover`, `handleClick`, `glyphHtml`, `htmlElement` to `useCallback` with explicit dep arrays (`[theme, mode, hovered, selected, selectedIso, families, store, ...]`). Currently they're recreated every render, which forces react-globe.gl to re-diff polygons.

c. **Precomputed iso3→color map per theme**: build a `Map<string, string>` in a `useMemo([theme, store, families])` so `polygonCapColor` is an O(1) lookup, not a function call into `giraiRampColor` per polygon per render.

d. **Decouple globe from card**: today `<NodeCard>` and `<EarthGlobe>` are siblings under `AtlasPage` and both subscribe to `useAtlasStore`. React still re-renders `AtlasPage` on any store change, which calls `<EarthGlobe>` with the same props (cheap if accessors are memoized — fixed by (b)). To be safe, wrap `EarthGlobe` in `React.memo` and pass only `store`, `width`, `height` as props (already true). Selection state inside the globe is read via the store hook — selector functions already narrow re-renders.

e. **Throttle hover**: wrap `setHovered` call in `handleHover` with a small `requestAnimationFrame` coalescer (`useRef<number>` + `cancelAnimationFrame`). Reset cursor synchronously, schedule state set.

f. **Pause auto-rotation on interaction**: existing effect already disables auto-rotate when hovered/selected. Extend the condition to also pause when any card is open (`selectedNodeId || selectedIso || forecastsPanelOpen`). For the forecasts panel, add a tiny `panelHover` ref or rely on `mode === "forecasts"` to pause rotation in that mode.

g. **Cap devicePixelRatio**: pass `rendererConfig={{ pixelRatio: Math.min(2, window.devicePixelRatio) }}` to `<Globe>`. Lightweight atmosphere already configured by enabling it conditionally (cheap).

h. **Lazy-load data + Forecasts panel**: 
   - `src/routes/index.tsx`: replace static `import { TrajectoryPanel }` with `const ForecastsPanel = lazy(() => import("@/atlas/panels/TrajectoryPanel").then(m => ({ default: m.TrajectoryPanel })))` and only render it under `<Suspense fallback={null}>` when `mode === "forecasts"`. Currently it always mounts.
   - Data: `useDataStore` (TanStack Query) already lazy-fetches both JSONs. No change needed.

i. **Avoid new color objects per frame**: the `useMemo(globeMaterial, [theme])` already addresses this. Confirm `polygonsTransitionDuration` stays at 260 for theme swap but set to 0 when only hover changes (skip — react-globe.gl applies it globally; leave default).

## Files

**New**
- `src/atlas/theme.ts` — palette + helpers.
- `src/atlas/panels/InfoPopover.tsx` — accessible popover (uses existing `@/components/ui/popover`).

**Edited**
- `src/atlas/store.ts` — add `theme`/`toggleTheme`; remove `layers`/`toggleLayer`; rename `"trajectory"` enum value to `"forecasts"`.
- `src/atlas/giraiRamp.ts` — re-export theme-aware helper.
- `src/atlas/panels/ThemeToggle.tsx` — drop localStorage, wire into store, move into top-right.
- `src/atlas/panels/ModeSwitch.tsx` — rename "Trajectory" → "Forecasts"; add InfoPopover next to GIRAI tab.
- `src/atlas/panels/GiraiLegend.tsx` — add InfoPopover; gradient now reads active theme.
- `src/atlas/panels/TrajectoryPanel.tsx` — `mode === "forecasts"`; aria-label update.
- `src/atlas/panels/TrajectoryLegend.tsx` — uses theme glyph ink (already CSS-var driven; verify).
- `src/atlas/components/EarthGlobe.tsx` — themeable, memoized, hover throttle, pixelRatio cap, atmosphere on, theme-aware borders + ramp lookup.
- `src/routes/index.tsx` — remove LayerFilter; move ThemeToggle to top-right; lazy-load ForecastsPanel; replace `"trajectory"` checks.
- `src/styles.css` — add ~200ms color/bg/border transition on `body`.

**Deleted**
- `src/atlas/panels/LayerFilter.tsx`.

## Acceptance check (post-build)

- Toggle in top-right: clicking flips `dark` class, page bg and globe sphere both swap; GIRAI ramp inverts; borders stay legible on both themes.
- GIRAI legend and the GIRAI tab each have an "i" that opens the plain-language popover and closes on Esc/blur/outside-click.
- "Show States/Actors/Legitimacy" gone; globe still renders all countries.
- Mode tabs read "Overview · GIRAI · Forecasts"; forecasts panel still works.
- Opening a country card no longer re-mounts the globe; hover feels fluid.