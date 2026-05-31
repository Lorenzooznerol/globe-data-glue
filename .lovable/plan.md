
## Trajectory Mode — UX/UI rewrite

No data-loading changes. No globe geometry changes. Other modes untouched.

---

### 1. Lead with the point — new header block

New component `src/atlas/panels/TrajectoryHeader.tsx`, rendered at the **top** of the Trajectory bottom-sheet (above the three sections):

- Title (serif, large): "Where AI governance is heading"
- Subtitle (smaller, italic muted): "Dated forecasts, each with a deadline by which it can be proven wrong."
- One headline stat (mono, accent-colored): `"{N} open forecasts · next deadline in ~{M} months"`
  - `N` = `store.allPredictions.length`
  - `M` = months until the soonest `falsification_date` (computed via existing `formatCountdown`)
  - If the soonest is overdue, render "next deadline overdue by ~N months"
- Generous padding, one accent color (`--primary`/`--foreground` ink + a single hue), no codes, no "morphology" wording.

### 2. Hide GIRAI completely in Trajectory mode

`src/atlas/components/EarthGlobe.tsx`:
- In `polygonCapColor`, when `mode === "trajectory"`: return a single flat neutral (`NEUTRAL_FILL`) for every polygon. Do NOT call `giraiRampColor` at all in this mode. Selection ring/altitude logic stays.
- Drop the `migrationT` color tween on country caps (migrations now live only in Section C, not on the globe — simpler, less visual load).

`src/routes/index.tsx`:
- The `mode === "girai"` GiraiLegend block already only shows in GIRAI mode — leave it. Verify TrajectoryLegend only shows in Trajectory mode (already the case).

### 3. Fix disclosures — real controlled state, no `<details>`, no anchor links

Replace every `Collapsible`/`CollapsibleTrigger`/`CollapsibleContent` use in Trajectory UI with a plain `useState<boolean>` per item, keyed by `pred_id` / `marker_id`. Pattern used everywhere:

```text
<button type="button" aria-expanded={open} onClick={() => setOpen(v => !v)}>
  <span>What would prove this wrong</span>
  <ChevronDown className={open ? "rotate-180" : ""} />
</button>
{open && <div>...panel...</div>}
```

- No `href="#"` anywhere.
- "Open" is a **non-interactive** `<span>` pill (StatusPill stays purely presentational; remove any click target on it).
- Expand affordance is a separate full-width `<button>` row with a chevron.
- Each expander has `focus-visible` ring and is keyboard-operable by default (it's a real button).

Applies to: register cards ("what would prove this wrong"), thesis cards ("how we tested this", "technical note"), and section headers (A/B/C accordion).

### 4. Restructure the panel — three calm sections

Rewrite `src/atlas/panels/TrajectoryPanel.tsx`. Remove the two-tab UI. New shape:

```text
TrajectoryHeader
SectionAccordion "What we predict"   (open by default)
  → RegisterList
SectionAccordion "Why we think so"   (collapsed)
  → ThesesList
SectionAccordion "What's already moved" (collapsed)
  → MigrationsList
```

`SectionAccordion` = simple controlled `useState`, large tap target (≥44px), serif question-style title, chevron on right.

**Section A — Register (default open):**
- Sort by `falsification_date` ascending (already done in store).
- Each card top-down:
  1. Plain prediction line (serif, ~17px). Author from `predicted_trajectory` via a new `plainPrediction(pred)` helper in `src/atlas/trajectory.ts` that produces readable sentences for the 10 known `pred_id`s; falls back to the raw field for any unknown.
  2. Quiet meta-row (mono/small): `{node_name} · [Open pill] · check by {Mon YYYY}` (friendly date from `falsification_date`; no countdown line here — that lives in the header).
  3. Tappable row "What would prove this wrong →" (chevron) → expands to plain `falsification_threshold`.
- No codes, no thesis link in the card (theses linked the other way, from Section B).
- One accent hue; rely on type size/weight, not borders around each card. Single hairline separator between items.

**Section B — Theses (collapsed):**
- 4 items. Each: plain title (`markerTitle`), one-sentence plain explanation (derive from `ex_ante_marker` or a new short gloss map keyed by `marker_id`).
- Tappable row "How we tested this →" expands the plain `discriminating_counterfactual`.
- Below: "Forecasts resting on this:" — list each related prediction as a small `<button>` that calls `scrollToForecast(pred_id)` which opens Section A (if collapsed), then `scrollIntoView` on `#forecast-{pred_id}` and briefly highlights it (existing pattern from `ThesisCard`). No `href`s.
- Codes (`marker_id`, `reg_ref`, `morphology`) live only inside an inner "Technical note" expander.

**Section C — Migrations (collapsed):**
- Loop nodes with `morphology_timeline.length >= 2` (6 nodes).
- Each row: `{node_name} — {firstYear} {familyLabel(first)} → {lastYear} {familyLabel(last)}` rendered as before/after pill pair (reuse the `Cell` look from `MigrationStrip` but inline). One italic line of context: `timeline[last].note` if present.

### Globe glyphs — reduce to three monochrome types

`src/atlas/trajectory.ts`:
- Collapse `GlyphKind` to `"holds" | "rising" | "eroding"`. Mapping:
  - stability → holds
  - enactment, realization-lag (formerly lag) → rising
  - variable-durability → eroding
  - refinement-test → holds (small dot variant inside)

`src/atlas/panels/DirectionGlyph.tsx`:
- Three SVGs only: short bar/dot (holds), up arrow (rising), dashed hollow ring (eroding).
- Monochrome in Trajectory mode: caller passes one ink color (`hsl(var(--foreground)/0.9)`); drop family hue. Min size 22px for tap target.

`EarthGlobe.tsx`:
- Pass the monochrome ink to `DirectionGlyph` when `mode === "trajectory"`. Glyph data list unchanged.

`TrajectoryLegend.tsx`:
- Three rows only (Holds / Rising / Eroding). Remove the morphology-color footnote. "Play migrations" button removed (migrations now shown statically in Section C; globe animation dropped per above).

### Card integration

`src/atlas/panels/TrajectorySection.tsx` (used inside `NodeCard` Short level):
- Rebuild as a compact "Forecast" block when `mode === "trajectory"` OR when predictions exist:
  - Title: "Forecast" (mono small caps)
  - Plain prediction line (via `plainPrediction`)
  - Meta-row: `[Open pill] · check by {Mon YYYY}`
  - Controlled "What would prove this wrong →" expander (same component as register)
  - If `morphology_timeline.length >= 2`: existing `MigrationStrip` (before → after pair). Otherwise omit.
- Remove the "register →" jump link and the thesis link from the card; keep it focused.

### Files

**Edit**
- `src/atlas/components/EarthGlobe.tsx` — flat neutral cap in trajectory mode; drop `migrationT`; pass mono ink to glyphs.
- `src/atlas/panels/TrajectoryPanel.tsx` — full rewrite: header + 3-section accordion, controlled state, no Collapsible.
- `src/atlas/panels/TrajectoryLegend.tsx` — 3-row legend, remove Play button.
- `src/atlas/panels/DirectionGlyph.tsx` — 3 glyph kinds, monochrome path.
- `src/atlas/trajectory.ts` — narrow `GlyphKind` to 3; new `directionGlyph` mapping; new `plainPrediction(pred)` + `friendlyMonth(iso)` helpers.
- `src/atlas/panels/TrajectorySection.tsx` — compact card "Forecast" block with controlled expander.
- `src/atlas/store.ts` — remove unused `migrationToken`/`playMigrations` (legend no longer triggers it). If risk, leave the state and just stop using it; cleaner to remove.

**Create**
- `src/atlas/panels/TrajectoryHeader.tsx`
- `src/atlas/panels/SectionAccordion.tsx` (controlled, real button, aria-expanded)
- `src/atlas/panels/ExpanderRow.tsx` (reusable controlled disclosure: label + chevron → conditional children)

**Untouched**
- Globe geometry, data loaders, `families.ts`, GIRAI components/legend (still used in GIRAI mode), Overview Legend, SideIndex, SearchCommand, NodeCard structure (only TrajectorySection inner content changes).

### Acceptance checks

- Mode switch to Trajectory → header reads "Where AI governance is heading" + live "{N} open forecasts · next deadline in ~M months".
- Globe shows flat neutral countries (no GIRAI wash, no dim wash) + monochrome glyphs only.
- Each "What would prove this wrong" / "How we tested this" / section header click toggles inline content (verified by click; aria-expanded flips).
- "Open" tag is non-interactive (no cursor pointer, no focus ring).
- Register sorted soonest-first; no `M3`/`reg_ref`/etc. visible outside the technical-note expander in Section B.
- Sections B and C start collapsed; opening them does not navigate or scroll the page unexpectedly.
- Switching back to Overview/GIRAI restores GIRAI choropleth and removes glyphs.
