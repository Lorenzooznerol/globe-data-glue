# Polish fixes — Country panel, Forecast, Thematic, Motion control, Index scroll

Five small, isolated changes. No restructuring of navigation, panels, or visuals.

## 1. Tab label & doc count — `src/atlas/panels/NodeCard.tsx`

- In the `LEVELS` tab nav, drop the all-caps mono treatment from the `tech` tab so all four tabs share the same `font-serif` style at the same weight.
  - Remove the `isTech ? "mono uppercase tracking-[0.14em]" : "font-serif"` branch; always use `font-serif`.
- For the `Documents` tab, render the count in parentheses inline with the label: `Documents (12)`. Keep the muted color, drop the separate mono span.

## 2. Forecast falsifier open by default — `src/atlas/panels/TrajectorySection.tsx`

- Pass `defaultOpen` to the `ExpanderRow` used for `What would prove this wrong`. The component already supports it.

## 3. Thematic detail — honest empty state — `src/atlas/panels/GiraiSnapshot.tsx`

- Detect whether any thematic score is non-null. Today every value is `null`, so we treat the section as "not loaded".
- When no scores are present:
  - Label the disclosure `Thematic detail — scores not yet loaded`.
  - Keep it collapsed by default (already is).
  - On expand, render: one quiet line `Per-area scores aren't loaded yet.` followed by a plain `<ul>` of the 19 area names — no progress bar column, no trailing dash/score column.
- When scores are present (future): keep the current behavior unchanged (label `Thematic detail`, bars + numbers).

## 4. Reduced motion — move + slow default

### Move toggle out of the legend — `src/routes/atlas.tsx`
- Remove the `Reduced motion` checkbox block from the top-left legend container.
- Add a new bottom-center floating control on the globe view, styled like a viewing control (same visual language as the bottom-right hint: small pill, `bg-background/85` + `border-border/50` + `backdrop-blur-md`), reading e.g. `Slow motion · On/Off`. Wire it to `reducedMotion` / `setReducedMotion` in the atlas store.
- The existing bottom-right "drag · scroll · hover" hint stays where it is; the new control sits centered above the bottom edge so they don't collide.

### Slow the default globe motion — `src/atlas/components/EarthGlobe.tsx`
- Lower `controls.autoRotateSpeed` from `0.3` to ~`0.12`.
- Lengthen `pointOfView` flight from `900ms` to ~`1600ms` (still skipped when `reducedMotion` is true).
- Lengthen `polygonsTransitionDuration` from `260` to ~`420` (still `0` under `reducedMotion`).
- `prefers-reduced-motion` continues to fully disable motion via the existing media-query effect — unchanged.

## 5. Index panel scroll fix — `src/atlas/panels/SideIndex.tsx`

The index sits inside the top-left container, which sets `flex-col gap-3` with no height bound, so the long list overflows the viewport.

- Switch the wrapper in `src/routes/atlas.tsx` (`left-4 top-4 ... w-[260px] flex-col gap-3`) to also bound its height (`max-h-[calc(100vh-2rem)]`) and let the `SideIndex` aside grow within it.
- In `SideIndex.tsx`, replace the fixed `max-h-[70vh]` with `flex-1 min-h-0` and keep `overflow-y-auto`, so the index expands to fill remaining vertical space under the legend block and scrolls all the way to the last item (`The three gravities`).

## Out of scope (explicit)
- No changes to colors, typography, globe visuals, card content/structure.
- No data file edits (thematic scores remain null).
- No changes to the legend keys themselves, search, mode switch, theme toggle, or forecasts header.
