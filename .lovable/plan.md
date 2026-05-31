# Plan: Forecast as Globe Mode + Visible Borders

## Change 1 — Forecast as a globe mode

### Goal
Globe stays full/central in Forecast mode (like Overview/GIRAI). The ~9 countries with predictions are lit in one accent color; everything else is the flat neutral base. The big bottom sheet stops opening by default. The full register (predictions / theses / migrations) moves to an on-demand drawer.

### Header (lightweight, no panel chrome)
New `ForecastHeader.tsx` rendered in `routes/index.tsx` only when `mode === "forecasts"`:
- Top-center, transparent background, max two lines.
- Line 1 (serif): "Where AI governance is heading".
- Line 2 (mono, accent): "N open forecasts · next deadline in ~M months" (reuse `formatCountdown` + `store.allPredictions`).
- Right side: small ghost button "View all forecasts" (list icon) → opens the drawer.
- Optional small "xAI" chip next to it that opens the xAI forecast in `NodeCard` (xAI isn't a polygon).

### Globe highlighting (`EarthGlobe.tsx`)
- Add `accent: string` to `AtlasTheme` (warm amber). E.g. dark `#E5A752`, light `#B5781A`.
- Precompute `forecastNodeIds = new Set(store.predictionsByNode.keys())`.
- In `polygonCapColor`, when `forecastsMode`:
  - if `r.nodeId && forecastNodeIds.has(r.nodeId)` → `theme.accent` (slightly brighter on hover/selected).
  - else → `theme.countryBase` (dimmed; no GIRAI fill in this mode).
- In `polygonAltitude`, give forecast countries a small raise (e.g. 0.03) so they read as active; hovered/selected raise more (existing logic).
- Remove the on-globe direction glyphs in Forecast mode (`glyphData = []`). They're replaced by the simple accent fill.
- Migration pulse: when `migrationToken` ticks (entry into Forecast mode), briefly raise altitude of the 6 morphology-timeline countries for ~1.4s, then settle. Skip if `reducedMotion`. Trigger `playMigrations()` from `routes/index.tsx` in a `useEffect([mode === "forecasts"])`.

### Interaction
- Click highlighted country → existing `selectNode(nodeId, { fly: true })` → existing `NodeCard` opens. Inside `ShortLevel`, `TrajectorySection` already shows the forecast block (prediction, deadline, "what would prove this wrong", migration before→after if any). Verify it renders cleanly for forecast nodes; no changes to data flow.
- Hover label: already shows headline; for forecast nodes, append the one-line prediction in `polygonLabel` (use `plainPrediction(p)` from `trajectory.ts`).

### Drawer (on-demand)
Rename `TrajectoryPanel.tsx` content to a controlled drawer:
- New prop `open: boolean; onClose: () => void`.
- Replace the fixed bottom `aside` with shadcn `Sheet` (`side="bottom"` on mobile, `side="right"` on desktop ≥768px) OR `Drawer` from vaul — both are already available. Use `Sheet` with a max-width on desktop for consistency with `NodeCard`.
- Header inside drawer: title "All forecasts" + close button. Body keeps the three existing `SectionAccordion` sections exactly as they are (register / theses / migrations) with the working `ExpanderRow` items. xAI naturally appears in the register list.
- `routes/index.tsx`: add `const [registerOpen, setRegisterOpen] = useState(false)`. Pass setter to `ForecastHeader`. Remove the unconditional render; mount the drawer only when `mode === "forecasts"`.

### Cleanup
- `TrajectoryLegend` reference in the top-left stack: replace with a tiny inline legend "● has a forecast" using the accent color (or drop entirely — the header + lit countries already explain it). Keep `TrajectoryLegend` file but simplify content.
- Auto-rotate: keep disabled in forecasts mode (already done).

## Change 2 — Visible country borders (all modes)

In `theme.ts`:
- `light.border`: `rgba(0,0,0,0.45)` (was `0.22`).
- `light.borderStrong`: keep `rgba(0,0,0,0.7)`.
- `dark.border`: `rgba(255,255,255,0.28)` (was `0.25`).
- `dark.borderStrong`: keep `rgba(255,255,255,0.75)`.

In `EarthGlobe.tsx`:
- `polygonStrokeColor`: always return `theme.border` (or `theme.borderStrong` when hovered/selected). Currently it returns `colorForNode(r.node)` for any node — this overrides the hairline border with the family color and makes adjacent countries blend. Replace with: focused → `borderStrong`; otherwise → `border` (uniform hairline). Family color stays in the cap fill / side wall, not the stroke.
- Add a `Globe` prop or `polygonStrokeWidth` if supported by react-globe.gl (otherwise the existing 0.75px default is fine — three-globe draws strokes at a fixed thinness; contrast bump alone solves visibility).

Applies uniformly in Overview, GIRAI, and Forecast — no per-mode branching for borders.

## Files

**New**
- `src/atlas/panels/ForecastHeader.tsx`

**Edited**
- `src/atlas/theme.ts` — add `accent`; bump border alphas.
- `src/atlas/components/EarthGlobe.tsx` — forecast-mode cap coloring; uniform borders; disable glyphs in forecast mode; migration pulse via `migrationToken`; hover label appends prediction.
- `src/atlas/panels/TrajectoryPanel.tsx` — wrap content in shadcn `Sheet`; accept `open`/`onClose` props; remove fixed bottom layout.
- `src/routes/index.tsx` — render `ForecastHeader` in forecast mode; controlled drawer state; trigger `playMigrations()` on entering forecast mode; drop the always-mounted `ForecastsPanel`.
- `src/atlas/panels/TrajectoryLegend.tsx` — simplify to one-line "● has a forecast" using `theme.accent`.

**Unchanged**
- Data (`data/store.ts`, JSON files), GIRAI choropleth, all forecast content (predictions/theses/migrations), `NodeCard`, `TrajectorySection`, `SectionAccordion`, `ExpanderRow`, theme toggle.

## Acceptance check
- Enter Forecast: globe stays full; ~9 countries amber; rest neutral; header at top with deadline stat; no covering sheet.
- Click a lit country → NodeCard with forecast block + migration before→after if present.
- "View all forecasts" opens drawer with three working sections; close returns to globe; xAI shows in the list.
- Brief pulse on the 6 migration countries on entry (skipped when reduced-motion).
- Borders visible in light mode between adjacent pale countries; same in dark and across all three modes.
- Overview and GIRAI behavior untouched; theme toggle works.