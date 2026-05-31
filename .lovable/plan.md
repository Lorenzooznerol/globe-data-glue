# Add Trajectory Mode

A third globe mode that surfaces the predictive layer already inside `atlas.json` (10 predictions across nodes, 4 markers/theses, 6 morphology timelines). No new data is loaded; no globe geometry, GIRAI choropleth, 3-family legend, or side index is touched.

## 1. State & data derivations

**`src/atlas/store.ts`** — add a persistent mode (preserves selection + scroll):
- `mode: "overview" | "girai" | "trajectory"` (default `"overview"`).
- `setMode(m)` action.
- `migrationToken: number` + `playMigrations()` action (drives the timeline animation in Trajectory mode).

**`src/data/store.ts`** — derive once in `buildStore`:
- `predictionsByNode: Map<string, AtlasPrediction[]>`
- `predictionsByMarker: Map<string, AtlasPrediction[]>` (key = `marker_id` like `M3`, `M7-DLT`)
- `allPredictions: AtlasPrediction[]` sorted ascending by `falsification_date`
- `markerById: Map<string, Marker>`
- Each prediction is decorated with its parent `node_id` and `node_name` for the register.

## 2. Mode switch (control panel)

**New `src/atlas/panels/ModeSwitch.tsx`** — quiet segmented control with 3 options: `Overview · GIRAI · Trajectory`. Mounted at the top of the left panel in `src/routes/index.tsx`, above the existing Legend.

Visibility rules inside the existing left-panel stack:
- Overview: SHAPE legend + SHOW toggles (current behavior, GIRAI legend hidden).
- GIRAI: SHAPE legend + SHOW toggles + GIRAI legend (current behavior).
- Trajectory: SHAPE legend (still anchors family colors) + new `TrajectoryLegend` (glyph key) + a small "Play migrations" button. GIRAI legend hidden.

## 3. Globe — Trajectory overlay

**`src/atlas/components/EarthGlobe.tsx`** — read `mode` from the store:
- When `mode === "trajectory"`: dim the GIRAI fill (multiply alpha ~0.25 in `polygonCapColor`), keep all geometry untouched.
- Add a new `customLayerData` (or `htmlElementsData`) layer that renders an SVG glyph at each node centroid (existing `NODE_CENTROIDS` / computed centroid) where `predictionsByNode.has(node_id)`. Glyph shape keyed to `prediction.direction`:
  - `stability` → horizontal bar / steady ring
  - contains `enactment` (e.g. `enactment+M1`) → upward chevron/arrow
  - `realization-lag` → half-filled forward chevron
  - `variable-durability` → dashed flickering ring (static dashed under reduced motion)
  - `refinement-test` → small hollow diamond
  Glyph stroke/fill uses `colorForNode(node)` (family color).
- Migration nodes (6): when `migrationToken` ticks or a node is hovered, interpolate that node's polygon `polygonCapColor` between `familyOf(timeline[0].morphology)` and `familyOf(timeline[last].morphology)` over ~1.2s. Under reduced motion: paint the polygon split into two adjacent hues with the dates labeled in the hover tooltip.
- Tooltip in Trajectory mode appends a one-line prediction trajectory if present.

## 4. Trajectory panel (right side)

**New `src/atlas/panels/TrajectoryPanel.tsx`** — collapsible bottom-sheet/right-side panel, mounted in `routes/index.tsx`, only when `mode === "trajectory"` and no node card is open (or docked to bottom regardless — design: bottom sheet, collapsed by default, dragging up reveals full height).

Two tabs:

### Tab 1 — **Prospective register** (default)
Header: *"Dated, falsifiable forecasts. Each one names in advance what would prove it wrong."*

Rows from `allPredictions` (sorted by `falsification_date`). Each row:
- Node name + plain-language line built from `predicted_trajectory` (already plain in data).
- Status pill — `OPEN` styled neutral; CSS variants for `HOLDING / FALSIFIED / RESOLVED` defined but unused.
- Live countdown `falsifies if not met by Mon YYYY · ~N months` computed from `new Date()` (recomputed each render; `useEffect` re-tick once per hour).
- `<details>` "what would prove this wrong" → `falsification_threshold` in prose.
- Confidence chip (high / med-high / med).
- "Thesis →" link scrolls to the Theses tab and highlights the matching marker row.

### Tab 2 — **Theses**
Renders the 4 entries of `atlas.markers`. For each:
- Title from a small lookup keyed by `marker_id`:
  - `M3` → "Cleared at the gate holds"
  - `M6` → "Self-imposed promises erode"
  - `M1` → "Capacity, not will, is the brake"
  - `M7-DLT` → "Deliberately light stays light"
- Causal chain: split `causal_chain` on `->`, render as a stepped flow (chevron-separated chips).
- `<details>` "How we tested it" → `discriminating_counterfactual`.
- "The tell to look for": `ex_ante_marker`.
- Predictions hanging off this thesis: list from `predictionsByMarker[marker_id]` with node name + falsification date.
- Confidence shown inline.
- `<details>` "Technical detail" → `marker_id`, `reg_ref`, `confound`, `verdict`.

All disclosures use the existing `Collapsible` primitive so they are keyboard-operable.

## 5. Card integration (all modes)

**`src/atlas/panels/NodeCard.tsx`** — when `predictionsByNode.has(node.node_id)` OR `morphology_timeline.length >= 2`, add a new `TrajectorySection` inside the "In short" level (under the GIRAI snapshot) and also at the top of "How it works":

- For each prediction: plain `predicted_trajectory`, falsification date + live countdown, confidence chip, "Thesis: <title>" link (switches mode to Trajectory + Theses tab on click).
- If the node has a `morphology_timeline` with ≥2 entries: a compact `MigrationStrip` showing `as_of[0] → as_of[last]` as two colored swatches (family colors) with dates and a one-line `note` from the last entry.

Applies equally to actor nodes (`AC-XAI`).

## 6. Small shared helpers (new files)

- `src/atlas/trajectory.ts`
  - `directionGlyph(direction): GlyphKind`
  - `markerTitle(marker_id): string` (lookup above)
  - `formatCountdown(isoDate, now): { line: string; months: number }`
  - `splitCausalChain(s): string[]` (split on `->`, trim)
- `src/atlas/panels/DirectionGlyph.tsx` — pure SVG component, accepts `kind`, `color`, `reducedMotion`.
- `src/atlas/panels/TrajectoryLegend.tsx` — glyph key for the control panel.
- `src/atlas/panels/MigrationStrip.tsx` — before→after swatch strip for the card.

## 7. Files

**Create**
- `src/atlas/trajectory.ts`
- `src/atlas/panels/ModeSwitch.tsx`
- `src/atlas/panels/TrajectoryPanel.tsx`
- `src/atlas/panels/TrajectoryLegend.tsx`
- `src/atlas/panels/DirectionGlyph.tsx`
- `src/atlas/panels/MigrationStrip.tsx`
- `src/atlas/panels/TrajectorySection.tsx` (used inside NodeCard)

**Edit**
- `src/atlas/store.ts` (add `mode`, `setMode`, `migrationToken`, `playMigrations`)
- `src/data/store.ts` + `DataStore` interface (add prediction/marker indexes)
- `src/atlas/components/EarthGlobe.tsx` (mode-aware fill dimming, glyph layer, migration interp)
- `src/atlas/panels/NodeCard.tsx` (mount `TrajectorySection`)
- `src/routes/index.tsx` (mount `ModeSwitch`, conditionally show GiraiLegend / TrajectoryLegend / TrajectoryPanel)

**Not touched**
- `public/data/*` (no new data)
- Globe geometry / projection / `useCountries`
- `families.ts`, `Legend.tsx`, `LayerFilter.tsx`
- GIRAI choropleth ramp, `GiraiSnapshot`, `GiraiOnlyCard`
- `SideIndex`, `SearchCommand`, `iso.ts`

## 8. CX details

- Mode switch persists across selection; switching does not clear `selectedNodeId` or scroll position (no store changes other than `mode`).
- Countdown is the only animated numeral; the rest of Trajectory mode stays austere.
- All animation paths (glyph flicker, migration tween) check `reducedMotion` and fall back to static states + dates.
- Codes (`M3`, `reg_ref`, `pred_id`) appear only in "Technical detail" disclosures.

## 9. Acceptance check

- Switch reveals 3 modes; Overview and GIRAI render identically to today.
- Trajectory mode: 10 predicted nodes show family-colored direction glyphs; 6 migration nodes animate or split-paint under reduced motion.
- Prospective register lists all 10 predictions sorted by falsification date with live countdown + plain trajectory + threshold disclosure + confidence + thesis link.
- Theses tab shows 4 markers as plain claims with chain, counterfactual, ex-ante tell, hanging predictions.
- Opening Vietnam / Korea / xAI shows Trajectory section in the card with prediction, countdown, and before→after migration where present.
- Globe geometry, 3-family legend, GIRAI choropleth, side index unchanged.
