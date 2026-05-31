## Read of your snippet

Your reference does three things our current `EarthGlobe.tsx` doesn't:

1. Loads `world-atlas@2/countries-110m.json` (TopoJSON) and converts via `topojson.feature(...)`.
2. Pauses auto-rotate while hovering or while a country is selected (not only on user drag).
3. Centers the camera using `d3-geo`'s `geoCentroid(feature)` — works for every country, not just the 26 we hardcoded.

Items 1 (loader is already topojson-aware) and the panel/tab UI are already in place. The real upgrades are 2 and 3, plus aligning hover/click handlers to pass the underlying feature.

## Proposed changes

### `src/atlas/components/EarthGlobe.tsx`
- **Camera fly-to via geoCentroid.** Replace the `NODE_CENTROIDS` lookup in the selection effect with `geoCentroid(feature)` of the selected node's feature. Build a `nodeId → feature` index alongside `resolved` so the effect can find the right geometry. Falls back to the centroid table only if no feature matched (rare — e.g. `ST-EU` resolves across 27 members; for `ST-EU` keep the Brussels centroid as a special case).
- **Pause rotation on hover or selection.** Add an effect on `[hoveredNodeId, selectedNodeId, reducedMotion]` that sets `controls.autoRotate = !reducedMotion && !hoveredNodeId && !selectedNodeId`. Keep the existing "pause on user drag" listener.
- Leave hover/click handlers, label, polygon styling, and the Suspense lazy-load as-is.

### `src/atlas/iso.ts`
- Keep `NODE_CENTROIDS` only as the `ST-EU` fallback (or trim it entirely if we decide Brussels can be the hardcoded EU centroid inline). No other consumer changes.

### Nothing else touched
- `useCountries.ts`: already handles TopoJSON + GeoJSON.
- Panel, store, route, filters: unchanged.
- `d3-geo` is already installed.

## Acceptance

- Clicking any of the 26 governed countries flies the camera to its real geographic centroid (more accurate than the current hand-coded table).
- The globe auto-rotates only when nothing is hovered and nothing is selected; resumes when the card is closed and the cursor leaves a country.
- Reduced-motion still disables rotation entirely.
- No regression to hover lift, color, or the card.
