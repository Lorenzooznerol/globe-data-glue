
# Atlas v2 — Real Earth, plain-language first

This rebuilds the visualization layer on top of the existing CSV store. The data layer (`src/data/*`) and the 8 CSVs in `public/data/` stay as-is. The Three-fiber sphere/centroid system in `src/atlas/components/*` is retired in favor of `react-globe.gl` country polygons. The existing `Signature` glyph, `centroids.ts`, `RingLayer`, `VisionHalo`, `Globe`, `StateMarkers`, `CameraRig`, `NodePanel` are replaced.

## What ships

1. A real Earth where every country is its actual shape at the right size.
2. The ~26 governed states colored by morphology (desaturated palette); EU tints all 27 member states; RU/IR ghosted; everything else a quiet "no-data" charcoal.
3. Hover lifts a country off the sphere with a smooth altitude transition and shows a floating label with the country name + a one-sentence plain-language gloss (no codes).
4. Click eases the camera to the country and opens a card with a tab selector: **Analysis** (default) and **Documents**.
5. A collapsible left **Side Index** for Actors, Deployers, and Legitimacy/Vision nodes — same card, no geography.
6. Filters (plain morphology names, layer), legend, and a global search that flies to the match.
7. Dark, austere, serif + mono, calm motion, reduced-motion fallback.

Explicit non-goals (Prompt 2): predictions, markers, time scrubber, morphology-migration animation, sub-federal US-states overlay, prediction status on cards.

## Visual & interaction spec

- Background: deep near-black with a faint CSS radial vignette; subtle grain optional.
- Globe material: matte dark sphere (no texture, no bloom, no atmosphere glow).
- Countries: flat morphology color, opacity by `evidence_strength` (STRONG 1.0, WEAK 0.5, OPAQUE 0.25). No height/magnitude scaling — altitude is reserved for hover lift only.
- Hover: `polygonAltitude` eases 0.01 → 0.07, fill brightens ~8%, `polygonsTransitionDuration ≈ 250ms`. Floating HTML label above the lifted country: serif country name + the plain morphology sentence.
- Click: holds the country at altitude 0.05, camera eases (`pointOfView`, ~900ms `easeInOutCubic`) to center it, card opens.
- Auto-rotate: slow (~0.3), pauses on user interaction, off entirely when reduced-motion.
- Reduced-motion: snap transitions (0ms), no auto-rotate, no lift easing.

## Card (right-hand `Sheet`, ~480px)

Header: country name (serif), one-line plain summary beneath it, small morphology chip in the morphology hue.

**Tabs** (shadcn `Tabs`, default = Analysis):

- **Analysis**
    1. *What shape this takes* — plain morphology sentence + plain sub-mechanism gloss, rendered in the morphology hue.
    2. *On paper vs in practice* — two 5-step meters labeled with the plain band word (almost none / minimal / partial / substantial / comprehensive) + a one-line gap gloss derived from band delta (e.g. paper>reality → "ambitious on paper, still ramping in practice").
    3. *What to expect* — a short paragraph synthesized from `notes` + the most recent claim.
    4. *Key facts* — claims rendered as readable bullet rows (claim_text + as_of_date).
    5. *Technical detail* (collapsed `Collapsible`, monospace) — morphology code(s), paper/realization band codes, realization_mode, epistemic_level, reg_refs.
    6. For US: a "Sub-federal" subsection listing California (SB 53) and Colorado (SB 24-205) facts from `ST-US-CA` / `ST-US-CO`.
    7. For Vision/Legitimacy nodes (opened from side index): replace bands with plain prose for `source_of_authority`, `scope`, `mode_of_influence`, `dated_anchor`.

- **Documents** — deduped union of sources from this node's claims + morphology_timeindexed rows. Each row: title (anchor, `target=_blank rel=noreferrer`), publisher, year, small reliability + source_type tags. Sorted newest first. `url_status` ≠ verified → small quiet "unverified" marker.

## Side Index (left rail, collapsible)

Grouped sections: Actors, Deployers, Legitimacy (vision). Click → same card opens; the globe does not move. Hidden by default behind a discreet "Index" toggle. Quiet typographic list — no swatches dominating.

## Filters, legend, search

- Top-left floating cluster:
    - **Legend**: 7 swatches with plain morphology names (always visible).
    - **Morphology filter**: multi-select by plain name; non-matching countries dim to 0.15.
    - **Layer filter**: states / actors / deployers / legitimacy (affects which side-index sections show).
- Top-center: global **search** combobox over all node names. Selecting a country flies the globe to it and opens the card; selecting a non-state opens the card without moving the globe.

## Files to add

- `src/atlas/iso.ts` — `NODE_TO_ISO3` map + `EU_MEMBERS` array + `isoToNodeId` reverse lookup (EU members all map to `ST-EU`).
- `src/atlas/plainLanguage.ts` — verbatim `MORPH_PLAIN`, `SUBMECH_PLAIN`, `BAND_PLAIN`, `BAND_ORDER`, plus helpers `plainSummary(node)` and `gapGloss(paper, reality)`.
- `src/atlas/morphology.ts` — replace palette with the new desaturated hex values (M1 #5b7a99 … M7 #6b7385); keep `splitMorphology` for "M3+M4".
- `src/atlas/useCountries.ts` — fetches `public/data/countries-110m.geojson` once, memoizes features.
- `public/data/countries-110m.geojson` — copy of the Natural Earth 110m countries set with `ISO_A3` in properties (downloaded at build of this task; ~250KB acceptable for a one-time fetch with cache).
- `src/atlas/components/EarthGlobe.tsx` — `react-globe.gl` instance, polygon props, hover/click handlers, camera fly-to via ref, auto-rotate handling.
- `src/atlas/components/HoverLabel.tsx` — HTML label rendered through `htmlElementsData` or `labelsData` API.
- `src/atlas/panels/NodeCard.tsx` — replaces `NodePanel`; tabs + sections above.
- `src/atlas/panels/DocumentsTab.tsx`, `src/atlas/panels/AnalysisTab.tsx`, `src/atlas/panels/BandMeter.tsx`, `src/atlas/panels/TechnicalDetail.tsx`.
- `src/atlas/panels/SideIndex.tsx` — left rail.
- `src/atlas/panels/SearchCommand.tsx` — shadcn `Command` combobox.
- `src/atlas/store.ts` — extend with `hoveredNodeId`, `query`, `cameraTarget`, `layerFilter`, `morphologyFilter` (plain-name set), `reducedMotion`.
- `src/data/store.ts` — add `documentsForNode(nodeId)` helper that returns the deduped sources from claims + morphology_timeindexed for that node.

## Files to remove

`src/atlas/components/Atlas.tsx`, `Globe.tsx`, `StateMarkers.tsx`, `RingLayer.tsx`, `VisionHalo.tsx`, `CameraRig.tsx`, `centroids.ts`, `projection.ts`, `panels/NodePanel.tsx`, `panels/Legend.tsx`, `panels/FilterRail.tsx`. The `Signature` glyph and `LibraryView` are not used in this version (kept on disk for Prompt 2 only if useful; otherwise removed to keep the tree clean).

## Dependencies

Add: `react-globe.gl`. Remove from active import paths: `@react-three/fiber`, `@react-three/drei` are not needed by react-globe.gl directly (it wraps three internally) but are harmless if left installed; we will not uninstall to avoid churn. Existing `three`, `zustand`, `papaparse`, fonts stay.

## Routing & layout

`src/routes/index.tsx` becomes: full-viewport `<EarthGlobe />` + floating filter/legend cluster + search + side-index toggle + `<NodeCard />` sheet bound to `selectedNodeId`. Vignette via a fixed pointer-events-none overlay.

## Acceptance checklist (mapped to the brief)

- [ ] All countries rendered at real size from GeoJSON; 26 governed colored; EU tints 27 members; RU/IR ghosted.
- [ ] Hover lifts the country + plain one-line label, no codes.
- [ ] Click eases camera + opens card; tabs work; Analysis default.
- [ ] Documents tab lists deduped sources with working external links and reliability/source_type tags.
- [ ] Codes only appear inside the collapsed Technical detail.
- [ ] Side index opens same card for actors/deployers/legitimacy.
- [ ] Plain-name morphology filter dims non-matches; layer filter scopes side index; search flies-to + opens.
- [ ] Reduced-motion disables rotate/lift/tween.

## Open questions

None blocking — the brief is unusually complete. I will proceed on these defaults unless told otherwise:
- Card placement: right-hand `Sheet` (not centered dialog) so the globe stays visible.
- Side index: collapsed by default behind an "Index" button in the top-left.
- GeoJSON source: Natural Earth 110m via the world-atlas project, served from `public/data/countries-110m.geojson` so there is no runtime CDN dependency.
