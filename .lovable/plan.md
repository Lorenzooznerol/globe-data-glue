## What changes

A new readable content layer is added on top of the existing banded/morphology data. The node card is rebuilt to lead with plain prose; codes are demoted to a closed accordion. A small glossary safety-net wraps any jargon in dotted-underline popovers. The globe and side index are otherwise untouched.

## Data (1) — drop CSVs into `/public/data`

Copy the 4 uploads in as-is:
- `nodes_readable.csv`
- `glossary.csv`
- `sources_v2.csv`
- `node_sources.csv`

## Data (2) — extend the store

`src/data/types.ts`: add `NodeReadable`, `GlossaryTerm`, `SourceV2`, `NodeSourceLink`, `NodeDocumentGroup` types.

`src/data/loader.ts`: add four `fetchCsv` calls (papaparse, same pattern as today).

`src/data/store.ts`: extend `DataStore` with
- `readableById: Map<string, NodeReadable>`
- `glossaryByTerm: Map<string, GlossaryTerm>` (lowercased keys; also keep an ordered list for the Glossary panel)
- `sourcesV2ById: Map<string, SourceV2>`
- `documentGroupsForNode(nodeId): { primary, secondary, context }`
  - join `node_sources` → `sources_v2`
  - bucket by `tier`
  - sort each bucket by `pub_date` desc; empty/unknown dates sort last
  - dedupe by `source_id`

Leave the legacy `documentsForNode` in place — the new card consumes `documentGroupsForNode`; nothing else has to change.

## UI (1) — rebuild `NodeCard`

`src/atlas/panels/NodeCard.tsx` becomes a segmented-control progressive disclosure. Default level = 1. Selecting a new node resets to level 1; switching levels animates (opacity + 4px translate, ~140ms; skipped under `prefers-reduced-motion`).

Header (unchanged structure): layer chip · region · serif name. The italic morphology headline under the name is removed — the new Level 1 carries that role.

Segmented control (shadcn `Tabs` styled as a 4-segment pill, or a custom radiogroup): `In short` · `How it works` · `Documents` · `Technical detail`.

### Level 1 — In short (default)
- Large serif `headline` from `nodes_readable`.
- Body paragraph `summary`.
- No codes, no meters, no chips beyond `<Term>` highlights.

### Level 2 — How it works
- One line of `morphology_plain` in the morphology hue (`colorFor(node.morphology)`).
- Two labeled plain meters: "On paper" = `paper_plain`, "In practice" = `reality_plain`. Reuse `BandMeter` but extend it to accept a plain word (`almost none|minimal|partial|substantial|comprehensive`) and map to 1–5 segments. Labels stay as words; codes never appear here.
- One-line gap gloss derived from headline/summary contrast (simple rule: if both plain words equal → "Roughly aligned"; if `paper > reality` → "Rules outrun practice"; reverse → "Practice outruns rules"; missing → blank).
- **Opaque variant**: if both `paper_plain` and `reality_plain` are empty, hide meters and render `Closed — cannot be assessed from outside.` in muted serif.
- **Legitimacy (VN-\*) variant**: replace this whole panel with `source_of_authority` / `scope` / `mode_of_influence` / `dated_anchor` from `nodes_vision`, each as a short prose paragraph (no labels stacked like a form — labels are small mono caps above each prose block).

### Level 3 — Documents
- Render `documentGroupsForNode(nodeId)` in this fixed order:
  1. **Official & primary** (tier=primary) — always visible if non-empty.
  2. **Analysis & commentary** (tier=secondary) — visible if non-empty.
  3. **More references** (tier=context) — collapsed by default behind a quiet toggle showing the count.
- Row: title (linked to `url`, opens new tab, `rel="noopener"`), then a thin meta line: publisher · year (omitted if `date_status === 'unknown'` or `pub_date` empty) · small uppercase mono `source_type` tag.
- `origin === 'curated'` gets a 4px hue-tinted dot before the title.
- Visual hierarchy: primary rows use slightly larger serif and full opacity; secondary one notch down; context collapsed and muted — context can never visually dominate primary.
- Tab label shows total count (sum of three groups) — replaces the existing `documents.length`.

### Level 4 — Technical detail
- Single closed `Collapsible` (already in shadcn/ui). When open:
  - `morphology` codes (M1..M7, including secondary)
  - `paper_band` / `realization_band` (CI/IN/AS/S/C)
  - `realization_mode`, `epistemic_level`, `evidence_strength`
  - `reg_refs` if present
- Mono font, two-column `dt/dd` grid like today's `TechnicalDetail`. This is the ONLY place codes appear in the card.

## UI (2) — Inline glossary

New `src/atlas/panels/Term.tsx`:
- `<TermScope>{children}</TermScope>` — wraps a card section; tracks already-highlighted terms within the section (max 3) so the same term is only chipped once per section.
- Internally walks text children, matches against `store.glossaryByTerm` (whole-word, case-insensitive, longest-match-first), wraps hits in `<span>` with dotted underline + cursor-help. Hover/focus opens shadcn `HoverCard`/`Popover` showing the plain definition.
- Scanned sections: Level 1 headline+summary, Level 2 `morphology_plain` line + the two meter labels ("On paper", "In practice"). Level 4 is NOT scanned (codes section stays mono and untouched).

New `src/atlas/panels/GlossaryPanel.tsx`:
- Small "Glossary" link in the card header (next to close), opens a shadcn `Sheet` from the right with the full term list (term · definition), alphabetical, search filter input.

## UI (3) — Globe hover label

`src/atlas/components/EarthGlobe.tsx`: in the `polygonLabel` HTML, replace the current morphology line with `headline` from `readableById.get(nodeId)`. Falls back to the existing text if no readable row exists. Never shows a code.

## Files touched

Created:
- `public/data/nodes_readable.csv`, `glossary.csv`, `sources_v2.csv`, `node_sources.csv`
- `src/atlas/panels/Term.tsx`
- `src/atlas/panels/GlossaryPanel.tsx`

Edited:
- `src/data/types.ts`, `src/data/loader.ts`, `src/data/store.ts`
- `src/atlas/panels/NodeCard.tsx` (rebuilt)
- `src/atlas/panels/BandMeter.tsx` (accept plain words)
- `src/atlas/panels/DocumentsTab.tsx` (replaced by inline Level-3 renderer inside NodeCard; file can be removed or repurposed)
- `src/atlas/panels/AnalysisTab.tsx` (removed from the card flow; kept on disk only if you want — otherwise deleted)
- `src/atlas/components/EarthGlobe.tsx` (hover label)
- `src/atlas/plainLanguage.ts` (small `plainWordToBand` helper + gap-gloss rule)

## Acceptance check (manual)

- Click EU → Level 1 shows the EU headline + summary, no codes visible. Switch to "How it works" → see plain meters with words. Switch to "Documents" → primary EU sources first (e.g. SRC-015 group), context group collapsed. Open "Technical detail" → codes appear.
- Click a VN-\* node → Level 2 shows the legitimacy prose variant.
- Hover any country on the globe → tooltip shows the plain headline, not "M3 · …".
- Hover "Open gap" in the EU summary → dotted underline + popover with the glossary definition.
- A document row with `date_status='unknown'` shows publisher · type, no year.
