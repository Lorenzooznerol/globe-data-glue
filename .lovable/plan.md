
## Scope

Two changes only. The globe geometry, NodeCard internals, side index, and search command stay as-is — they just read from a new store shape and a new family-color helper.

---

## Change 1 — Single data source: `/public/data/atlas.json`

### Wiring

- Copy the uploaded `atlas.json` to `public/data/atlas.json`.
- Delete the 12 CSV fetches and all per-table cross-joining. Remove the four "readable" CSVs added earlier plus the original 8 CSVs from `public/data/` (atlas.json is the only source now).
- Rewrite `src/data/loader.ts` to a single `fetch('/data/atlas.json').then(r => r.json())` returning the parsed `Atlas` object.
- Rewrite `src/data/types.ts` to mirror the JSON shape:
  - `AtlasMeta`, `GlossaryTerm`, `Marker`, `LegitimacyEdge` (unchanged fields).
  - `AtlasNode` with everything pre-joined: `node_id, name, layer, headline, summary, morphology_plain, paper_plain, reality_plain, morphology, sub_mechanism, paper_band, realization_band, realization_mode, epistemic_level, evidence_strength, region, notes, claims[]` (each with inline `sources[]`), `documents: { primary[], secondary[], context[] }`, `morphology_timeline[]`, `predictions[]`, and optional `vision: { source_of_authority, scope, mode_of_influence, dated_anchor, notes }` for `VN-*` nodes.
  - `AtlasSource` / `AtlasDocument` shapes derived from the JSON.
- Rewrite `src/data/store.ts`:
  - `buildStore(atlas)` indexes `nodesById: Map<string, AtlasNode>`, `glossaryByTerm`, `glossaryList`, `edgesById`, `markersById`.
  - Provide read-only convenience getters used by existing UI: `getNode(id)`, `documentGroupsForNode(id) → node.documents`, `claimsForNode(id) → node.claims`, `morphologyHistory(id) → node.morphology_timeline`, `edgesFrom/To`. All are O(1) map lookups; no joining.
  - Remove `sourcesById`, `sourcesV2ById`, `nodesBandedById`, `nodesVisionById`, `readableById` and any "two-namespace" code. Callers below are updated to use `nodesById` + the layer/vision discriminator on the node itself.
- Update `src/data/useDataStore.ts` query to the new loader.

### Call-site updates (read-only refactor, no UX change)

- `NodeCard.tsx`: replace `nodesBandedById.get` / `nodesVisionById.get` / `readableById.get` with one `store.nodesById.get(id)`. `headline/summary/morphology_plain/paper_plain/reality_plain` come straight off the node; `isVision = node.layer === 'vision'` (or `node.node_id.startsWith('VN-')`); vision fields come from `node.vision`. Documents come from `node.documents`. Claims/predictions from `node.claims` / `node.predictions`.
- `EarthGlobe.tsx`: same — one map lookup; `headline` is `node.headline`.
- `SideIndex.tsx`: derive rows from `Array.from(store.nodesById.values())` filtered by `layer`.
- `Legend.tsx` / `LayerFilter.tsx`: see Change 2 (rebuilt anyway).
- `SearchCommand.tsx`, `AnalysisTab.tsx`, `DocumentsTab.tsx`, `ClaimItem.tsx`, `GlossaryPanel.tsx`, `Term.tsx`, `plainLanguage.ts`: swept for the old map names; same logic, new lookups.

---

## Change 2 — Rebuild the left control panel

### A) "SHAPE OF GOVERNANCE" — 3 family rows + grey footnote

Add a new module `src/atlas/families.ts`:

```text
Family       Swatch     Covers (morphology codes)        One-line gloss
Gap          #6E8FB8    M1, M4                            Rules outrun practice.
Enforced     #5C9E8F    M3, M2                            Control is real and applied.
Provisional  #C99A4E    M6, M7                            Light, fragile, or not built yet.
```

- `familyOf(morphology: string): 'gap' | 'enforced' | 'provisional' | null` — splits the raw morphology string (handles `M3+M4`, `M7-then-enacted`) and maps the primary code via the table above.
- `FAMILY_COLOR`, `FAMILY_LABEL`, `FAMILY_GLOSS` constants.
- `colorForNode(node): string` — returns the family swatch, or neutral grey `#7A828E` when `evidence_strength === 'OPAQUE'` or no family match.

Rewrite `src/atlas/panels/Legend.tsx`:
- Header `SHAPE OF GOVERNANCE` (existing mono caps style).
- Three rows, each: swatch (10×10) · family name (serif) · gloss (smaller, muted). Same alignment grid for all three.
- Click toggles `families` filter in the store (replaces `morphologies`). Clear button when any filter active.
- Single quiet footnote below: serif italic, muted: "Grey = not assessable from outside."
- Opacity is NOT a row. No 7-item list.

### B) "SHOW" — 3 toggles, no truncation

Rewrite `src/atlas/panels/LayerFilter.tsx`:
- Three toggles only: **States · Actors · Legitimacy**. Drop the Deployers toggle entirely (deployer nodes still load and still render in cards; they are simply not a filter).
- Layout: full-width vertical stack, one toggle per row, full panel width, no flex wrap, no truncation. Equal height, left-aligned labels.
- Keep the "Reduced motion" checkbox under it, exactly as-is.

### C) Store + globe coloring

- `src/atlas/store.ts`: replace `morphologies: Set<MorphCode>` with `families: Set<Family>` and matching toggle/clear actions. Remove `state.layers` for `deployer` (default set becomes `['state','actor','vision']`).
- `EarthGlobe.tsx` polygon colors: switch from `colorFor(node.morphology)` to `colorForNode(node)` so the globe uses the 3 family swatches (and grey for OPAQUE). The dim-on-filter logic now keys on `familyOf(node.morphology) ∈ state.families`. This replaces the 7-hue scheme globe-wide for consistency, as the spec allows.
- `SideIndex.tsx` row dots: also use `colorForNode`.
- `NodeCard.tsx` accent hue: also use `colorForNode` (header rule + Level-1 headline).

### D) Spacing & consistency in the panel container

- Single panel `<aside>` wrapping both sections with one consistent vertical rhythm (`gap-5`), one swatch size, one type scale, left-aligned content.
- Hairline `border-t border-border/40` divider between SHAPE and SHOW.
- Generous padding; no element overlaps at the current panel width (verified at 1062 CSS px viewport).
- The existing "INDEX" footer button stays exactly as-is.

---

## Files touched

- **Add**: `public/data/atlas.json`, `src/atlas/families.ts`.
- **Rewrite**: `src/data/loader.ts`, `src/data/types.ts`, `src/data/store.ts`, `src/atlas/store.ts`, `src/atlas/panels/Legend.tsx`, `src/atlas/panels/LayerFilter.tsx`.
- **Touch (lookup-only)**: `src/atlas/panels/NodeCard.tsx`, `src/atlas/panels/SideIndex.tsx`, `src/atlas/panels/SearchCommand.tsx`, `src/atlas/panels/AnalysisTab.tsx`, `src/atlas/panels/DocumentsTab.tsx`, `src/atlas/panels/ClaimItem.tsx`, `src/atlas/panels/GlossaryPanel.tsx`, `src/atlas/panels/Term.tsx`, `src/atlas/components/EarthGlobe.tsx`, `src/data/useDataStore.ts`.
- **Delete**: all 12 CSVs in `public/data/`.

## Acceptance check

- Boot: a single network request for `/data/atlas.json`, no CSV calls.
- NodeCard still renders: headline + summary, On paper / In practice meters with gap gloss, documents grouped Primary / Secondary / Context, Technical detail collapsible with raw codes.
- Left panel shows exactly 3 family rows + grey footnote and exactly 3 layer toggles with full labels at 1062 px viewport, no truncation.
- Globe uses the 3 family swatches; OPAQUE nodes render grey.
- No overlap or clipping in the panel column.
