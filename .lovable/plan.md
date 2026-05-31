## Scope

Ship the read-path data layer only. No views, no globe yet. After this step the app can `import { useStore } from "@/data/store"` and get fully typed, FK-joined records in memory.

## Steps

1. **Drop CSVs into `public/data/`** (unchanged, verbatim):
   - `nodes_banded.csv`, `nodes_vision.csv`, `morphology_timeindexed.csv`
   - `legitimacy_edges.csv`, `markers.csv`, `predictions.csv`
   - `claims.csv`, `sources.csv`

2. **Add dependency**: `papaparse` + `@types/papaparse`.

3. **Types** — `src/data/types.ts`: one interface per CSV mirroring column names 1:1 (`NodeBanded`, `NodeVision`, `MorphologyTimeIndexed`, `LegitimacyEdge`, `Marker`, `Prediction`, `Claim`, `Source`). Semicolon-delimited fields (`source_ids`) typed as `string[]` post-parse. Layer/morphology/band fields kept as string unions where the CSV vocabulary is closed.

4. **Loader** — `src/data/loader.ts`: `loadAll()` fetches all 8 CSVs from `/data/*.csv` in parallel, runs papaparse with `header: true, dynamicTyping: true, skipEmptyLines: true`, then post-processes:
   - split `source_ids` on `;`
   - coerce `as_of` / `pub_date` / `falsification_date` to ISO strings (kept as strings, not Date, to stay serializable)
   - trim whitespace

5. **Indexed store + FK joins** — `src/data/store.ts`:
   - `Map<string, T>` by primary key for each table (`node_id`, `edge_id`, `marker_id`, `pred_id`, `claim_id`, `source_id`).
   - Resolver helpers: `getNode(id)`, `getSources(ids)`, `claimsForNode(id)`, `predictionsForNode(id)`, `edgesFrom(id)`, `edgesTo(id)`, `morphologyHistory(nodeId)`, `markerFor(morphologyCode)`.
   - Validation pass logs (console.warn) any dangling FK (`from_node`, `to_node`, `source_ids`, `node_id` references) without throwing — data quality signal, not a hard fail.

6. **React hook** — `src/data/useDataStore.ts`: TanStack Query `useQuery({ queryKey: ['store'], queryFn: loadAll, staleTime: Infinity })` returning the built store. One fetch per session.

7. **Smoke route** — replace the placeholder in `src/routes/index.tsx` with a minimal status panel: row counts per table + first 3 dangling-FK warnings (if any). Confirms the pipeline end-to-end without committing to any visual design.

## Technical notes

- CSVs served from `/public/` are static — no bundler transform, swap-friendly with the Supabase select later.
- The store interface is the swap seam: `loadAll()` is the only function that changes when moving to Supabase; `store.ts` and all consumers stay identical.
- Centroids for the globe are deliberately out of scope here — they'll be a separate `src/data/centroids.ts` constant when the globe view lands.
- No backend / no Lovable Cloud enablement in this step.

## Out of scope (explicitly deferred)

- Any visualization (globe, graph, tables-as-UI).
- Supabase enablement and seeding.
- Centroid constants.
- Design direction / theming work.
