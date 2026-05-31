## GIRAI base layer + merged country card

Add a worldwide GIRAI data layer beneath the existing 26 curated atlas nodes, joined by ISO3. Keep globe interaction, the 3-family SHAPE legend, side index, and Atlas card structure untouched.

### 1. Data

- Replace `public/data/atlas.json` with the new uploaded `atlas-2.json` (carries iso3 / part_of_iso3 / subnational / supranational / girai_has_data fields on state nodes).
- Add `public/data/girai.json` from the upload.
- Extend `src/data/types.ts`: add `GiraiCountry`, `GiraiData`, and optional `iso3`, `part_of_iso3`, `subnational`, `supranational`, `girai_has_data` on `AtlasNode`.
- `src/data/loader.ts`: fetch both files in parallel.
- `src/data/store.ts`: build `giraiByIso: Map<string, GiraiCountry>` and `nodeByIso: Map<string, AtlasNode>` (state nodes with iso3 only). Expose `getGirai(iso3)` and `getNodeByIso(iso3)`.

### 2. Globe base layer (choropleth)

In `EarthGlobe.tsx`:
- For every polygon, look up `giraiByIso.get(iso)`. If present, fill with a sequential ramp from `#2A3340` (score 0) → `#BFE9E4` (score 100), interpolated in OKLCH. Apply ramp as `polygonCapColor`.
- Polygons with no GIRAI entry keep the current inert neutral fill.
- The 26 curated nodes (already resolved via `isoToNodeId`) get a **family-coloured overlay ring**: render a second polygons layer (or use `polygonStrokeColor` + raised `polygonAltitude` + thicker side colour in family hue) so the ring sits visibly on top of the GIRAI glow. EU members all ring in ST-EU's family colour. Selection / hover behaviour unchanged.
- Hover label: if curated → existing headline; else if GIRAI-only → country name + `index_score / 100 · rank N of 138`; else → country name only.
- Click: dispatch by iso → merged / GIRAI-only / Atlas-only / unmeasured (ignore).

### 3. Left panel: add GIRAI ramp legend

New `GiraiLegend.tsx` rendered under the existing SHAPE legend with the same hairline-divider rhythm:
- Title `MOVEMENT (GIRAI INDEX)` in the same mono caps style.
- A thin horizontal gradient bar (same ramp) with end labels `barely moving` ↔ `comprehensive`.
- One-line italic footnote: *138 countries scored on responsible-AI governance. Grey = not measured. Data: GIRAI 2024 (2023 data), CC BY-NC-SA.*

SHAPE legend and SHOW toggles are not touched.

### 4. Country card routing

The current selection model is keyed on `node_id`. Extend the atlas store to also accept an `iso3` selection for GIRAI-only countries:
- `selectByIso(iso3)`: if a curated node exists for that iso, select its node_id (existing flow); else set a new `selectedIso` state and open a `GiraiOnlyCard`.
- `EarthGlobe` click handler calls `selectByIso(iso)` for any polygon with GIRAI data; for unmeasured + non-curated polygons, no-op.

New components in `src/atlas/panels/`:
- `GiraiSnapshot.tsx` — compact block: `index_score / 100 · rank N of 138`, then three slim horizontal bars (Human Rights / Governance / Capacities) in neutral ink, with a `<details>`-style disclosure "Thematic detail" that reveals a small 19-area radar (SVG, reduced-motion safe, keyboard focusable). Values come from `dimensions` and `thematic_areas`; null thematic values are rendered as muted dashes.
- `GiraiOnlyCard.tsx` — country name, region, GiraiSnapshot, and a quiet note: *Not yet covered by the Atlas's morphological analysis.*
- `MorphologyVsScoreLine.tsx` — pure function `(family, index_score) => string` rendered as a single italic line near the headline in merged cards. Example mapping (computed, no per-country hardcoding):
  - `Gap` + high (≥60) → "Comprehensive on paper; the Atlas reads the gap between rules and practice as wide."
  - `Gap` + mid (30–60) → "Mixed rulebook; gap between paper and practice is visible."
  - `Gap` + low (<30) → "Thin rulebook and a visible gap in what's enforced."
  - `Enforced` + high → "Comprehensive on paper, and the Atlas reads enforcement as real."
  - `Enforced` + mid/low → "Enforcement is real where it lands, even if the broader rulebook is partial."
  - `Provisional` + high → "Scores high on paper; the Atlas reads its commitments as self-imposed and reversible."
  - `Provisional` + mid/low → "Light or fragile commitments; little binding rule yet in place."
  - OPAQUE / no family → no line.

`NodeCard.tsx` changes (minimal, additive):
- When the selected node has `iso3` and a matching GIRAI entry → render `MorphologyVsScoreLine` under the headline and `GiraiSnapshot` between summary and the existing "How it works / Documents / Technical detail" sections.
- When the selected node has `iso3` but no GIRAI entry (ISR, TUR, RUS, IRN) → show a single quiet line: *Not scored by GIRAI.*
- Subnational nodes (ST-US-CA, ST-US-CO): use `part_of_iso3` to fetch USA's GIRAI score and render the snapshot labelled `national (USA) — GIRAI does not score sub-nationally.`
- ST-EU (supranational): no GIRAI snapshot (GIRAI scores member states individually); render the existing card unchanged.

The Atlas headline and existing levels remain the lead; GIRAI block uses muted/neutral ink so it substantiates rather than outshouts.

### 5. Acceptance verification

After build, manually check via preview at 1062px:
- All 138 GIRAI countries show graded fill; unmeasured stay grey; near-zero scorers visible at the dark end.
- 26 curated nodes show family-coloured rings over GIRAI fill.
- Click VNM / KOR / BRA → merged card with snapshot + computed interpretive line.
- Click Ghana / Peru → GIRAI-only card with "not yet covered" note.
- Click ISR / TUR / RUS / IRN → Atlas card with "Not scored by GIRAI."
- Two stacked legends, same type scale, hairline divider; existing SHOW toggles and side index untouched.

### Files

- **Add**: `public/data/girai.json`, `src/atlas/giraiRamp.ts`, `src/atlas/panels/GiraiLegend.tsx`, `src/atlas/panels/GiraiSnapshot.tsx`, `src/atlas/panels/GiraiOnlyCard.tsx`, `src/atlas/panels/MorphologyVsScoreLine.tsx`.
- **Replace**: `public/data/atlas.json` (new upload).
- **Edit**: `src/data/types.ts`, `src/data/loader.ts`, `src/data/store.ts`, `src/atlas/store.ts` (add selectedIso + selectByIso), `src/atlas/components/EarthGlobe.tsx` (ramp fill + overlay rings + iso click dispatch), `src/atlas/panels/NodeCard.tsx` (snapshot + interpretive line + subnational/unscored cases), `src/routes/index.tsx` (mount GiraiLegend and GiraiOnlyCard in the existing panel slots).
- **Not touched**: globe geometry, SHAPE legend, SHOW toggles, side index, families.ts, iso.ts mappings.
