## Scope

Build the world model + full informational layer on top of the existing `src/data` store. No predictions/markers/timeline views (Prompt 2). Everything below either renders or wires interaction; nothing is stubbed.

## Dependencies

- `three`, `@react-three/fiber`, `@react-three/drei`, `zustand`
- Fonts via `@fontsource/fraunces` (serif titles) + `@fontsource/jetbrains-mono` (data/labels). No Inter/Roboto.

## Design tokens (`src/styles.css`)

Replace the default token palette with an austere instrument-grade dark theme. All values in `oklch`.
- `--background` near-black, `--foreground` warm off-white, `--muted` and `--border` hairline grays, `--card` one step above bg.
- Add the 7 morphology hues as raw CSS vars (`--morph-m1` … `--morph-m7`) converted from the supplied hex to `oklch`. Morphology is the **only** categorical color — never themed via primary/accent.
- Register morphology tokens in `@theme inline` so utilities like `text-[var(--morph-m3)]` and CSS reads work.
- Add font-family vars: `--font-serif: "Fraunces", serif`, `--font-mono: "JetBrains Mono", monospace`. Apply serif to `h1–h3`, mono to `code`/`.label`. Body stays a quiet sans fallback (`ui-sans-serif`) used sparingly.
- Force light theme off — globe is always dark.

## Folder layout

```
src/
  atlas/
    centroids.ts            // node_id -> [lat, lng] map (29 states, embedded)
    morphology.ts           // palette + helpers (color, opacity from evidence_strength, "M3+M4" split)
    projection.ts           // latLngToVec3, slerp tween helpers
    store.ts                // zustand: selectedNodeId, filters {layer[], morphology[]}, ringToggles, libraryOpen, reducedMotion
    components/
      Atlas.tsx             // Canvas root: lights, controls, scene composition
      Globe.tsx             // dark sphere + faint graticule (procedural lines, no texture)
      StateMarkers.tsx      // 29 state markers from nodes_banded + centroids
      ActorRing.tsx         // AC-* on concentric ring r=1.25
      DeployerRing.tsx      // DP-* on concentric ring r=1.45
      VisionHalo.tsx        // VN-* outermost faint labels + included/excluded arcs
      CameraRig.tsx         // OrbitControls + auto-rotate + ease-to-node tween
      Marker.tsx            // shared instanced/single marker primitive (uniform size, opacity by evidence)
      Label.tsx             // drei <Html> hover label, mono font
    panels/
      NodePanel.tsx         // right-hand sheet: header, bands, Signature, claims->sources, notes
      ClaimItem.tsx         // expandable; renders linked Source rows
      SourceRow.tsx
      FilterRail.tsx        // left rail: layer + morphology filters + ring toggles + library button
      Legend.tsx            // always-visible hue->morphology key
      LibraryView.tsx       // full-screen overlay: sources+claims table, filter by source_type/reliability/topic
    signature/
      Signature.tsx         // reusable ~132x96 inline SVG glyph
  routes/
    index.tsx               // Atlas page (replaces current smoke route; keep counts behind a debug flag)
    library.tsx             // optional dedicated route, also reachable via overlay
```

## World model rendering

- **Canvas**: `<Canvas dpr={[1,2]} camera={{ position:[0,0,3.2], fov:38 }}>`, near-black `<color attach="background">`, vignette via post-processing OR a simple radial-gradient CSS overlay (cheaper, no bloom).
- **Globe**: `<Sphere args={[1, 64, 64]}>` with `MeshStandardMaterial` (very low specular, near-black, subtle emissive). Graticule = procedural `LineSegments` of lat/lng circles every 30° in a desaturated foreground hue at low opacity. Land outlines: ship a tiny pre-baked GeoJSON (Natural Earth 110m land) as `public/geo/land.json`, drawn as `LineSegments` (no fills). If GeoJSON adds weight, fall back to graticule-only — both read as "instrument-grade."
- **Lights**: one `ambientLight` + one soft directional; no environment map.
- **State markers**: small `SphereGeometry(r=0.012)` placed via `latLngToVec3(lat,lng, 1.005)`. Color from morphology. Opacity from `evidence_strength`: STRONG=1, WEAK=0.5, OPAQUE=0.22. OPAQUE markers also get a thin dashed ring so they read as "ghosted, present, no band." Size is uniform — verified by code: no scale derived from any band.
- **Actor/Deployer rings**: nodes distributed evenly around a circle in the equatorial plane at r=1.25 / r=1.45 (tilted ~15°). Same marker primitive, same uniform size.
- **Vision halo**: VN-* placed on an outer ring r=1.75, rendered as small open glyphs + `<Html>` labels at low opacity. `legitimacy_edges` with `included=yes` drawn as thin `QuadraticBezierLine` arcs from attractor to target node position; `included=no` drawn dashed at ~30% opacity (never omitted).
- **Auto-rotate**: 0.05 rad/s; pauses on pointer-down/hover; resumes after 4s idle. Disabled when `prefers-reduced-motion`.

## Camera ease

`CameraRig` exposes `flyTo(targetVec3)`. On node click: compute the marker's world position, target a camera position along that vector at radius 2.4, slerp current → target over 900ms with `easeInOutCubic`. Also tween the OrbitControls target to the marker. Reduced-motion: snap.

## Signature glyph

`<Signature node>` — pure SVG, no three.
- Viewbox 132×96. 5 horizontal gridlines for bands CI > IN > AS > S > C (top to bottom, low→high realization). Faint mono labels on the left axis.
- Three columns: intent (paper_band), instrument (mid), reality (realization_band). Y = ordinal map.
- Polyline colored by morphology hue; stroke-opacity from evidence_strength. M6 → `stroke-dasharray="3 3"`.
- Instrument marker: M3 small open square; M1 downward chevron set below mid; M6/M7 small dot. M3+M4 → primary morphology drives the polyline, secondary morphology renders a small open diamond next to the reality node.
- Intent = filled dot; Reality = hollow ring (left empty — Prompt 2 will encode prediction status here).
- Column labels: `int / inst / real` in mono at the bottom.

## Informational panel

`NodePanel` opens as a right-hand `Sheet` (shadcn) at ~420px:
1. Header: serif name + monospace `node_id` + small layer tag (`STATE` / `ACTOR` / `DEPLOYER` / `VISION`).
2. Morphology chip in its hue, with `sub_mechanism` in mono underneath.
3. Bands row: `paper_band → realization_band` rendered as two small band ticks with the mono ordinal labels.
4. The `Signature` glyph, centered.
5. Claims section: list of `claimsForNode(id)`. Each `ClaimItem` shows the epistemic tag (VERIFIED/ATTESTED/INFERRED) as a 1px-border pill, `as_of_date` in mono, claim_text in serif. Expand → list of resolved `Source` rows via `store.getSources(claim.source_ids)`: title, publisher (mono), `source_type · reliability · url_status`, outbound link (opens in new tab).
6. Notes block (italic, muted) at the bottom.
7. For VN-* (no claims/bands): render `source_of_authority`, `scope`, `mode_of_influence`, `dated_anchor`, `notes` — same chrome, no Signature.
8. Staggered reveal of sections (translate-y 8→0, opacity 0→1, 60ms stagger). Reduced-motion: appear instantly.

## Filter rail + legend

`FilterRail` (left, ~280px, collapsible):
- Layer multi-select: state / actor / deployer / vision (default all on).
- Morphology multi-select with hue swatches; selecting any morphology dims all non-matching markers on the globe to 0.15 opacity.
- Ring toggles: Actors / Deployers / Vision halo (independent).
- "Open library" button.
- Reduced-motion toggle (manual override).

`Legend` (bottom-left, always visible): seven hue swatches → morphology codes + short names, in mono.

## Library view

`LibraryView` — full-screen overlay (or `/library` route, both wired):
- Two tabs: **Sources** and **Claims**.
- Sources tab: searchable table; filters for `source_type`, `reliability`, `topic`. Rows show title, publisher, date, reliability, url_status, outbound link. Clicking a row reveals which claims cite it (reverse join computed once).
- Claims tab: filter by `epistemic_level` and by node layer. Clicking a claim row jumps back to the globe and opens that node's panel.

## Store (zustand)

```
{
  selectedNodeId: string | null
  filters: { layers: Set<Layer>; morphologies: Set<string> }
  rings: { actors: boolean; deployers: boolean; vision: boolean }
  library: { open: boolean; tab: 'sources'|'claims' }
  reducedMotion: boolean
  selectNode(id), clearSelection(), toggleLayer, toggleMorphology, toggleRing, openLibrary, ...
}
```
Data store stays unchanged — `useDataStore()` feeds the atlas; this zustand only holds UI state.

## Accessibility & motion

- `prefers-reduced-motion` detected once, mirrored into the store, used by `CameraRig` (no auto-rotate, snap tweens) and panel reveals.
- Markers are focusable via a parallel hidden keyboard list (anchored to filter rail): Tab through visible nodes, Enter selects (same flyTo + panel).
- Hover labels via drei `<Html>` with `pointerEvents=none`.

## Technical notes

- Land outlines GeoJSON kept under 30KB (Natural Earth 110m, simplified). If we can't get it under budget, ship graticule only — explicitly allowed by spec ("optionally a faint emissive land outline").
- Marker uniform-size invariant enforced by a single `MARKER_RADIUS` constant; no code path multiplies it by band.
- `nodes_vision.csv` lacks `layer`; treat any `VN-` prefix as vision. ID-prefix dispatch (`ST-`/`AC-`/`DP-`/`VN-`) lives in `morphology.ts` as `layerOf(id)`.
- Existing smoke-test counts move behind a `?debug=1` query flag on `/`.
- No backend, no Lovable Cloud in this step.

## Out of scope (Prompt 2)

- Predictions rendering, markers visualization, time scrubber, morphology-migration animation, prediction-status encoding on the Signature's reality ring.
- Any size/magnitude/height encoding, choropleth, photoreal earth, bloom.
