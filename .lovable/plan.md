# Per-country curated overlay (Italy first)

Adds a third data layer on top of `atlas.json` + `girai.json`: per-country overlay files under `/public/data/countries/`. Italy (`IT.json`) upgrades to a fully curated node with claims, sources, coordinates, independence flag, and a "to verify" list. Globe, both legends, GIRAI choropleth, and existing card grammar stay exactly as they are.

## Small cleanup (the "delete the input with that phrase" bit)

Interpreting this as: remove the italic line **"Not yet covered by the Atlas's morphological analysis."** from `GiraiOnlyCard`. Once a country has an overlay file it becomes curated, and for the rest the GIRAI snapshot speaks for itself — the apologetic line adds noise. (If you actually meant a different input field, tell me which one and I'll swap it in.)

## Data layer

**New files**

- `public/data/countries/index.json` — manifest, starts as `["IT"]`.
- `public/data/countries/IT.json` — the Italy payload you supplied, dropped in verbatim.

**Loader (`src/data/loader.ts`)**

- New `loadCountryOverlays()`: fetch `countries/index.json`, then `Promise.all` of `countries/{code}.json`. Failures on a single file are logged and skipped, never block boot.
- `loadAll()` returns `{ atlas, girai, overlays }`.

**Types (`src/data/types.ts`)**

- New `CountryOverlay` matching the schema: `meta`, `node`, `coordinates` (4 axes, each `{value, evidence_articles[], epistemic_level}`), `claims[]` (with `source_ids` semicolon-string + `reg_ref`), `sources[]` (`source_id`, `title`, `publisher`, `url`, `pub_date`, `source_type`, `reliability`), `readable` (`headline`, `summary`, `how_it_works`, `documents[]`, `technical_detail`), `to_verify[]`.
- Extend `AtlasNode` with optional `independence_flag?: boolean` (read from overlay; not required in atlas.json).

## Merge into the store (`src/data/store.ts`)

- New maps: `overlayByIso: Map<string, CountryOverlay>`, `overlayByNodeId`.
- For each overlay, **synthesise / upgrade an `AtlasNode`** keyed by `overlay.node.node_id` (e.g. `ST-IT`):
  - If an atlas node with that id already exists, shallow-merge overlay `node.*` over it.
  - Otherwise, push a new node into `nodesById` / `nodeByIso` with `layer: "state"`, `girai_has_data: true`, the overlay's morphology/bands, etc.
- Store keeps overlay alongside the node so the card can read `claims`, `sources`, `coordinates`, `readable`, `to_verify`, `independence_flag`.
- `nodeByIso` now resolves `"ITA" → ST-IT`, which means the existing globe click handler routes Italy through `NodeCard` instead of `GiraiOnlyCard` automatically — **no globe code changes**.

## Globe (`src/atlas/components/EarthGlobe.tsx`)

No changes. The click handler already does:

```
if (r.node) selectNode(r.node.node_id)   // → NodeCard
else if (r.iso && r.girai) selectIso(r.iso) // → GiraiOnlyCard
```

Once the overlay populates `nodeByIso["ITA"]`, Italy gets the family-coloured ring (via existing `colorForNode`) on top of the GIRAI glow — exactly what the brief asks for.

## Card additions (`src/atlas/panels/NodeCard.tsx`)

Reuse the existing 4-level tab structure and grammar. Only additions, no rewrites:

1. **In short** — if `overlay.readable.headline`/`summary` exist, prefer them over `node.headline`/`node.summary`. GIRAI snapshot stays exactly where it is, underneath, as substantiation.
2. **How it works** — if `overlay.readable.how_it_works` exists, render it inside the existing How section.
3. **Documents** — merge `overlay.readable.documents[]` (resolved via `source_id` → overlay `sources[]`) into the existing "Official & primary" group. Same `DocList` component, no new visual style.
4. **Technical detail** — append `overlay.readable.technical_detail` paragraph.

New blocks, all rendered below the existing level content (or as their own subtle sections within the relevant level):

- **`ClaimsProvenance`** (new file `src/atlas/panels/ClaimsProvenance.tsx`) — list of claims, each one line: `claim_text` + small **epistemic chip** (`VERIFIED` solid ink, `ATTESTED` outlined, `INFERRED` dashed/muted, `SPECULATED` faint, `OPAQUE` ghosted). Chip is a popover/expandable that resolves `source_ids` (split on `;`) against overlay `sources[]` and renders title + publisher + `target="_blank"` link. Chip styles come from new tokens (see Design) — same palette as the existing "How we know" glossary entry; legend text reuses that glossary copy via the existing `Term`/`NodeGlossary` mechanism, no new wording invented.
- **`CoordinatesReadout`** (new file `src/atlas/panels/CoordinatesReadout.tsx`) — 4-axis compact readout: `gaze`, `surveillance_breadth`, `institutional_transparency`, `reciprocity`. Whole block carries the dashed `INFERRED` treatment with a single header chip ("Reading, not fact — INFERRED"). Each axis shows value + small evidence article list (e.g. "Arts. 4, 11, 13, 14").
- **`IndependenceFlag`** (inline in NodeCard header area, under the country meta line) — when `overlay.node.independence_flag === true` OR any claim text contains `independence_flag=true`, render a quiet amber row: `⚠ Supervisors are government agencies, not independent authorities.` Uses a new `--epistemic-warn` token (warm amber, low chroma), single line, no icon animation.
- **`ToVerify`** (new file `src/atlas/panels/ToVerify.tsx`) — collapsed `Collapsible` titled "To verify ({n})"; expands to a plain list of `to_verify[]` strings. Lives at the bottom of the Technical detail level so it doesn't compete with the lead reading.

Card structure for curated overlay countries:

```text
Header (layer · region · name · independence flag if any)
Tabs: In short | How it works | Documents | Technical detail
  In short:
    headline (curated)
    morphology-vs-score line
    summary (curated)
    GIRAI snapshot
    Trajectory section
    Claims & provenance        ← new
    Coordinates (INFERRED)     ← new
  How it works:
    morph line, BandMeter pair, gap gloss
    how_it_works paragraph     ← new (if present)
  Documents:
    Official & primary (atlas + overlay.documents merged)
    Analysis & commentary
    More references
  Technical detail:
    existing dl
    technical_detail paragraph ← new
    To verify (collapsed)      ← new
```

## Design tokens (`src/styles.css`)

Add a small epistemic palette so chips and the independence flag are part of the design system, not local hex:

```css
--epistemic-verified: var(--foreground);
--epistemic-attested: var(--foreground);   /* used as outline */
--epistemic-inferred: var(--muted-foreground);
--epistemic-speculated: color-mix(in oklab, var(--muted-foreground) 55%, transparent);
--epistemic-opaque: color-mix(in oklab, var(--muted-foreground) 35%, transparent);
--epistemic-warn: oklch(0.78 0.12 75); /* quiet amber, both themes */
```

Chip variants (in a new `EpistemicChip` component) map to these tokens. Same type scale as existing mono micro-labels, hairline 1px borders, no shadows.

## Accessibility / motion

- All new collapsibles use existing Radix `Collapsible` → keyboard-operable.
- Chip → source popover uses Radix `Popover` (already in repo).
- No new motion: respect existing `reducedMotion` flag from the store; chips and the flag row are static.

## Files touched / created

**Created**

- `public/data/countries/index.json`
- `public/data/countries/IT.json` (the JSON you provided, verbatim)
- `src/atlas/panels/ClaimsProvenance.tsx`
- `src/atlas/panels/CoordinatesReadout.tsx`
- `src/atlas/panels/ToVerify.tsx`
- `src/atlas/panels/EpistemicChip.tsx`

**Edited**

- `src/data/types.ts` — add `CountryOverlay`, `independence_flag`.
- `src/data/loader.ts` — add `loadCountryOverlays`, extend `loadAll`.
- `src/data/store.ts` — index overlays, merge/synthesise nodes, expose `overlayByNodeId`.
- `src/atlas/panels/NodeCard.tsx` — read overlay, render new sections, slot in headline/summary/how/tech overrides, independence flag in header.
- `src/atlas/panels/GiraiOnlyCard.tsx` — remove the "Not yet covered…" italic line.
- `src/styles.css` — epistemic + warn tokens.

## Adding new countries

1. Drop `public/data/countries/XX.json` (same schema as `IT.json`).
2. Add `"XX"` to `public/data/countries/index.json`.

No code change required.

## Acceptance check

- Boot loads `atlas.json` + `girai.json` + every file in the manifest; no CSVs.
- Italy renders with GIRAI glow **and** family ring; clicking shows curated headline + summary + levels + claims-with-chips + 4 coordinates (dashed INFERRED) + amber independence flag + collapsed "to verify".
- Every other country behaves exactly as before.
