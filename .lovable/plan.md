# Atlas — Index/Forecast tabs, contextual glossary, thematic network

Four structural changes on top of the live atlas. One shared tab grammar everywhere; thematic data is now real and navigable across countries.

## 0. Data refresh

Replace `public/data/girai.json` with the uploaded `girai-2.json` (138 countries, real `thematic_areas` 0–100). No schema change — `GiraiCountry.thematic_areas` already typed as `Record<string, number | null>`. Loader unchanged.

## A. Index — split into 3 tabs

Refactor `src/atlas/panels/SideIndex.tsx`:

- Extract the existing `<nav role="tablist">` shape from `NodeCard.tsx` (lines 80–110) into a small shared component `src/atlas/panels/SegmentedTabs.tsx` (props: `tabs: {key,label,count?}[]`, `value`, `onChange`). Same styling, same `font-serif text-[11px]`, rounded border + secondary bg.
- `SideIndex` becomes: header tabs (`Actors` / `Deployers` / `Legitimacy`) above a single scroll region. Counts shown in parens like the Documents tab.
- Tab content = the rows currently produced by `SECTIONS` for that one layer; the other two are unmounted (so each tab scrolls independently from the top).
- Container: keep `min-h-0 flex-1 overflow-y-auto` so the active tab scrolls fully to its last entry (fixes the cutoff). Inner list keeps the colour dot via `colorForNode`.

## B. Forecast — same tab grammar

Refactor `src/atlas/panels/TrajectoryPanel.tsx` to use the same `SegmentedTabs`:

- Replace the three `SectionAccordion` blocks with three tabs: `What we predict` / `Why we think so` / `What's already moved` (counts in parens).
- Drop the accordion open/close state; keep one active tab. Each tab's body uses the same scroll container as today.
- Keep `RegisterList` / `ThesesList` / `MigrationsList` and the `scrollToForecast` jump (auto-switch to the predict tab when invoked from a thesis).
- Remove `SectionAccordion` usages here; leave the file in place for any other caller.

## C. Glossary — per-country contextual

Move from global sheet to inline disclosure under the country name.

- In `NodeCard.tsx` header: remove the `<GlossaryPanel />` from the top-right metadata row. Under the `<h2>` title, render a quiet button `Glossary (n)` (mono, muted, same scale as the layer/region line). Clicking expands an inline panel (Collapsible) below the title; no Sheet.
- New `src/atlas/panels/NodeGlossary.tsx`: receives the node + store; computes the set of glossary terms that actually appear in this node's readable text by scanning `headline`, `summary`, `notes`, `morphology_plain`, `paper_plain`, `reality_plain`, `vision.*` (and the four band labels), using the same word-boundary regex strategy as `Term.tsx`. Renders a simple list: term + `plain_definition`. `n = 0` → hide the affordance entirely.
- Country-specific nuance: extend `GlossaryTerm` with optional `country_nuance?: Record<string, string>` (ISO3-keyed); when a nuance is present for this country's iso3 (or parent iso3), render it after the general definition with label `In this country`. No nuance data is fabricated — schema-ready and empty until provided.

## D. Thematic detail — real scores + clickable theme network

### D1 — Populate scores
In `GiraiSnapshot.tsx`:
- Remove the "scores not yet loaded" branch. `ThematicDisclosure` always renders `ThematicList`, which already handles `v == null` with an em-dash and an empty bar — keep that as the per-value fallback.
- Label becomes simply `Thematic detail` (collapsed by default, like today).

### D2 — Clickable cross-country view
Each of the 19 area rows in `ThematicList` becomes a button (badge-styled, same grid). Clicking opens a new `ThemeCrossCountryPanel` (right-side `Sheet`, narrower than NodeCard, ~420px) that shows a ranked list across **all** scored countries for that one area.

- New file `src/atlas/panels/ThemeCrossCountryPanel.tsx`:
  - Inputs: `area: string`, `iso3OfCurrent: string | null`, `store`, `open`, `onClose`.
  - Computes `store.girai.countries.map(c => ({iso3, name, score: c.thematic_areas[area]})).filter(score != null).sort(desc)`.
  - Header: area name + small provenance line `GIRAI 2023 data · n countries scored`.
  - Body: list of `rank · country · score · thin bar` (mono numbers, font-serif name, same bar style as existing dimension meters). Current country row highlighted (`bg-foreground/5` + bold weight) and scrolled into view on open.
  - Footer hint: `Tap a country to focus it on the globe` — clicking a row calls `selectIso(iso3)` and closes the sheet.
- State: open/close handled locally in `GiraiSnapshot` (`useState<string | null>` for selected area). No global store change.
- Reduced-motion: respect `useAtlasStore(s => s.reducedMotion)` to skip the fade-in animation, matching existing pattern in `NodeCard`.

## Out of scope

- No changes to globe rendering, colour ramps, families, search, ModeSwitch, ThemeToggle, route, or data loader (beyond the json swap).
- No new data fields beyond the optional `country_nuance` placeholder on glossary terms.
- Existing `GlossaryPanel.tsx` stays in the repo unused (can be deleted in a follow-up); no other call sites.

## Files touched

- `public/data/girai.json` — replaced
- `src/atlas/panels/SegmentedTabs.tsx` — new (shared)
- `src/atlas/panels/SideIndex.tsx` — refactored to tabs
- `src/atlas/panels/TrajectoryPanel.tsx` — accordions → tabs
- `src/atlas/panels/NodeCard.tsx` — remove top-right Glossary, add inline `Glossary (n)`
- `src/atlas/panels/NodeGlossary.tsx` — new
- `src/atlas/panels/GiraiSnapshot.tsx` — drop "not loaded" branch; rows become buttons; manage cross-country sheet
- `src/atlas/panels/ThemeCrossCountryPanel.tsx` — new
- `src/data/types.ts` — optional `country_nuance` on `GlossaryTerm`
