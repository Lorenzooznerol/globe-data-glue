
# Layered Country Entry (Italy worked example)

When a user clicks a country that has an overlay file, replace the standard right-hand card with a **descent**: 5 stacked layers (Face → Law → Authorities → Triggers → Coordinates) that nest into each other. Globe recedes, vertical breadcrumb on the left, Escape returns to globe. Countries without an overlay keep the existing card.

## Scope

- Touches only **overlay countries** (currently ITA). Everything else — globe, both legends, GIRAI choropleth, GiraiOnlyCard, NodeCard for non-overlay nodes, all loaders — stays untouched.
- Uses the existing overlay schema verbatim. No new data fields. `TO_VERIFY` is accepted as an epistemic level alongside the existing `VERIFIED | ATTESTED | INFERRED | SPECULATED | OPAQUE`.

## Data wiring (tiny)

- `src/data/types.ts` — extend `EpistemicLevel` union with `"TO_VERIFY"`.
- No store changes. `NodeCard` already reads `store.overlayByNodeId`; the new component reads the same map.

## Routing the click

`src/atlas/panels/NodeCard.tsx` — at the top of the component, if `store.overlayByNodeId.has(selectedNodeId)`, render `<CountryDescent store node overlay />` and return; otherwise fall through to the existing card. Globe code unchanged.

## New component tree (under `src/atlas/panels/descent/`)

```text
CountryDescent.tsx        orchestrator: layer state, keyboard, reduced-motion, globe-recede class
LayerStack.tsx            renders layers 0..n with push/scale + opacity (cross-fade if reduced)
LayerBreadcrumb.tsx       persistent left nav, 5 dots + labels + "To verify" link
ClaimLine.tsx             one fact line: text + ProvenanceChip (uses overlay.sources to resolve)
ProvenanceChip.tsx        VERIFIED / ATTESTED / INFERRED / TO_VERIFY chip → Popover with sources
GoDeeper.tsx              the calm "Go inside ↓" / "Next: Authorities ↓" affordance
ToVerifyDrawer.tsx        sheet listing overlay.to_verify[], opened from breadcrumb
layers/
  Layer0Face.tsx          name · headline · "61.8 / 100 · 7th of 138" · 1-line summary · Go inside
  Layer1Law.tsx           how_it_works spine + C-IT-01, C-IT-02, C-IT-03 strata + readable.documents
  Layer2Authorities.tsx   AgID/ACN + preserved bodies from C-IT-03 + amber independence flag (C-IT-09)
  Layer3Triggers.tsx      C-IT-04, C-IT-05, C-IT-06, C-IT-07, C-IT-08, each its own opening stratum
  Layer4Coordinates.tsx   4-axis readout (dashed INFERRED), value + reading + evidence_articles
```

Claim → layer mapping is data-driven inside the layer files (an array of `claim_id`s per layer), so adding a country with the same schema works with no code change.

## Globe recession

`CountryDescent` toggles a class on `<body>` (e.g. `data-descent="on"`). `src/routes/atlas.tsx` adds a wrapper style on the globe container reacting to that attribute: `scale(0.92)` + `opacity 0.55` + slight blur. Reduced-motion → opacity only, no transform. Pure CSS, no globe code change.

## Motion & interaction

- 200ms ease-out per layer. Push-in = current layer goes to `scale(0.96) opacity-60`, next layer enters from `translateY(8px) opacity-0`.
- `prefers-reduced-motion` OR store `reducedMotion` → cross-fade (no transform).
- Keyboard: `↓` / `Enter` on "Go inside" descends; `↑` / `Esc` ascends; `Esc` from Layer 0 closes to globe (calls `selectNode(null)`).
- Focus trap inside the active layer (Radix Dialog primitives already in repo); breadcrumb is a real `<nav><ol>` with `aria-current`.
- Each `ProvenanceChip` is a `<button>` opening a Radix Popover listing every resolved source (title · publisher · external link).

## Provenance vocabulary

Reuse the glossary's "How we know" definitions — `NodeGlossary`/`Term` already expose them. The chip popover header reads the existing glossary entry for the level (no new copy). Add `TO_VERIFY` styling to the existing `EpistemicChip` component (faint chip + small dot).

## Tokens

`src/styles.css` — add only what's missing:
- `--epistemic-to-verify` (very muted foreground)
- `--descent-dim` (overlay tone behind layers) — optional, can use existing `--background/85`.

## Files

**Created**
- `src/atlas/panels/descent/CountryDescent.tsx`
- `src/atlas/panels/descent/LayerStack.tsx`
- `src/atlas/panels/descent/LayerBreadcrumb.tsx`
- `src/atlas/panels/descent/ClaimLine.tsx`
- `src/atlas/panels/descent/ProvenanceChip.tsx`
- `src/atlas/panels/descent/GoDeeper.tsx`
- `src/atlas/panels/descent/ToVerifyDrawer.tsx`
- `src/atlas/panels/descent/layers/Layer0Face.tsx`
- `src/atlas/panels/descent/layers/Layer1Law.tsx`
- `src/atlas/panels/descent/layers/Layer2Authorities.tsx`
- `src/atlas/panels/descent/layers/Layer3Triggers.tsx`
- `src/atlas/panels/descent/layers/Layer4Coordinates.tsx`

**Edited**
- `src/atlas/panels/NodeCard.tsx` — early return into `CountryDescent` when overlay exists.
- `src/data/types.ts` — add `TO_VERIFY` to `EpistemicLevel`.
- `src/atlas/panels/EpistemicChip.tsx` — handle `TO_VERIFY` variant.
- `src/styles.css` — add `--epistemic-to-verify`.
- `src/routes/atlas.tsx` — `data-descent` class hook on globe wrapper (CSS only).

**Not touched**
- Globe, both legends, GIRAI choropleth, loaders, GiraiOnlyCard, store.

## Acceptance

- Click Italy → globe recedes, Layer 0 appears with name, headline, "61.8 / 100 · 7th of 138", 1-line summary, "Go inside ↓".
- Descending walks Law → Authorities → Triggers → Coordinates; each nests into the previous.
- Left breadcrumb shows all 5 layers + "To verify (4)" link; clicking jumps; Escape returns to globe.
- Every fact line shows a chip; VERIFIED chips open real sources from `sources[]`; Coordinates layer is visibly dashed/INFERRED; amber independence line appears in Authorities.
- Adding `FR.json` + `"FR"` in the manifest gets the same descent automatically.
