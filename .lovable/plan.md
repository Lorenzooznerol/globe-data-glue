# Italy Object-Graph (Palantir/Gotham style)

Replace the current `ItalyView` for ISO `ITA` with a top-down entity-relationship graph driven by `reactflow`. Verified facts above, inferred morphology below (dashed). Text appears only in a right-hand inspector on selection.

## Scope

- Affects only the Italy branch in `NodeCard.tsx` (other countries unchanged).
- One new dependency: `reactflow`. No other libs.
- Data: `/public/data/countries/IT.json` (already loaded via `store.overlayByNodeId`).

## Files

- **Add** `src/atlas/panels/descent/italy/ItalyGraph.tsx` — main view (graph + inspector layout, keyboard, selection state).
- **Add** `src/atlas/panels/descent/italy/graphModel.ts` — pure builder: overlay → `nodes[]`, `edges[]` with fixed coords + per-node metadata (entity type, claim_ids, dashed flag, flags like `independence`).
- **Add** `src/atlas/panels/descent/italy/nodes/` — custom node components:
  - `EntityNode.tsx` (generic: law, authority, criminal, sector group, programme, morphology)
  - `BaselineNode.tsx` (the EU bar across row 0)
  - `SectorPill.tsx` (sub-pills inside SECTORS)
- **Add** `src/atlas/panels/descent/italy/Inspector.tsx` — right-side panel: entity title, one-line claims with `ProvenanceChip`, to_verify list (only when Law selected).
- **Add** `src/atlas/panels/descent/italy/MiniRadar.tsx` — inline SVG 4-axis radar for the morphology node inspector.
- **Add** `src/atlas/panels/descent/italy/italy-graph.css` — hairline borders, monospace data type, dashed-edge variants, dim/focus classes.
- **Edit** `src/atlas/panels/NodeCard.tsx` — swap `ItalyView` import for `ItalyGraph` in the ITA branch.
- **Keep but unused**: leave `ItalyView.tsx` in place (no other refs); can be removed later.

## Graph structure (precomputed coords, no force sim)

```text
ROW 0  [============ EU AI Act — Regulation 2024/1689 ============]   baseline bar (full width)
                                 │ "rests on"
ROW 1                  ┌──────── Law 132/2025 ────────┐               in force 10 Oct 2025 · GIRAI 61.8 · 7/138
                       │       │       │       │
ROW 2          AUTHORITIES  CRIMINAL  SECTORS  PROGRAMME & DECREES
                 │   │                  │  │  │ …
               AgID  ACN▪              health work prof PA judiciary copyright minors
                       (amber independence square)
                       │
ROW 3                                    ┌─── MORPHOLOGY — coordinates ───┐   (dashed node + dashed edges)
                                         (inferred: gaze / breadth / transparency / reciprocity)
```

Edge labels: `rests on`, `designates`, `inserts`, `regulates`, `funds & delegates`, `inferred from`.

## Interaction

- Default: nodes + labels only, no prose.
- Click node → set `selectedId`, highlight node + incident edges, dim others (CSS class on container toggling opacity for non-neighbors). Inspector slides in from right.
- Inspector shows claim_text lines filtered by `claim_ids` mapped per node in `graphModel.ts` (e.g. Law node → C-IT-01, C-IT-04, C-IT-07; Authorities → C-IT-02, C-IT-05; Criminal → C-IT-03; GIRAI cue → C-IT-06; Morphology → C-IT-07 + coordinates).
- Each claim line uses existing `ProvenanceChip` (resolves `source_ids` → `sources[]`, opens primary URLs in new tab).
- Law node carries a small dot indicating `to_verify[]` items; expanding it in the inspector lists them (not on the canvas).
- Morphology node + its edges rendered dashed; inspector shows inline `MiniRadar` from `overlay.coordinates`.
- `Escape` or click on empty pane → clear selection, restore full graph, close inspector.
- `prefers-reduced-motion`: skip the inspector slide transition.

## Visual language

- Background: existing `--background`; ink: `--foreground`; muted: `--muted-foreground`.
- 1px hairline borders only; no shadows, no gradients, no rounded "cards" (≤2px radius).
- Entity-type accent (thin 2px left border on node):
  - law → neutral ink
  - authority → cool blue token
  - criminal → warm red token
  - sectors group → green token (sub-pills neutral)
  - programme → amber token
  - morphology → muted, dashed everywhere
- Provenance: reuse existing `EpistemicChip` / `ProvenanceChip` tokens unchanged.
- Independence flag: 8px amber square inside ACN node.
- Monospace for IDs/dates/scores; serif/sans only for entity titles.

## Technical notes

- Install: `bun add reactflow`. Import its stylesheet once inside `ItalyGraph.tsx` (`import "reactflow/dist/style.css"`) and override in `italy-graph.css`.
- Use `<ReactFlow>` with `nodesDraggable={false}`, `nodesConnectable={false}`, `panOnDrag`, `zoomOnScroll`, `fitView` on mount, `proOptions={{ hideAttribution: true }}`.
- Custom `nodeTypes` map for `baseline | entity | sector`. Positions hard-coded in `graphModel.ts` (e.g. ROW 0 y=0, ROW 1 y=140, ROW 2 y=300, ROW 3 y=520) for a deterministic layout — no dagre/elkjs.
- Edge style toggled by `data.dashed` → `strokeDasharray: "4 3"`.
- Focus+context implemented by setting `data-focus` on container and `data-dim` on non-neighbor nodes/edges via `nodes`/`edges` state derived from `selectedId`.
- Inspector is a sibling `<aside>` in flex layout, not a portal — keeps a11y and ESC handling simple.

## Acceptance check (manual)

1. Open Italy → top-down graph renders with EU baseline, Law, 4 children, dashed morphology at bottom; no prose visible.
2. Click `Law 132/2025` → inspector shows C-IT-01/04/07 lines with chips; clicking VERIFIED chip opens Normattiva URL.
3. Click `ACN` → amber square visible; inspector shows C-IT-02 + C-IT-05 (ATTESTED outlined).
4. Click `MORPHOLOGY` → node + edges dashed; inspector shows inline radar + INFERRED chip.
5. `Esc` clears selection and inspector; full graph returns; reduced-motion disables transitions.
