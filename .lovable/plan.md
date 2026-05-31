## Goal

Install `react-globe.gl`, `topojson-client`, and `d3-geo`, then fix the two runtime errors blocking the globe:

1. `window is not defined` — `react-globe.gl` touches `window` at import time, so it crashes during SSR/prerender of `/`.
2. `undefined is not an object (evaluating 'geoJson.type')` — `public/data/countries-110m.geojson` is actually a TopoJSON file (the world-atlas `countries-110m.json` format), not GeoJSON. `react-globe.gl` expects GeoJSON Features, so we need to convert via `topojson-client`.

## Changes

### 1. Dependencies
- `bun add react-globe.gl topojson-client d3-geo`
- `bun add -d @types/topojson-client @types/d3-geo` (types)

### 2. SSR-safe globe component (`src/atlas/components/EarthGlobe.tsx`)
- Convert to a default export and load `react-globe.gl` lazily so it never runs on the server:
  ```ts
  const Globe = lazy(() => import("react-globe.gl"));
  ```
- Wrap render in `<Suspense fallback={null}>` and guard with `typeof window !== "undefined"` before rendering.
- Keep all current props/handlers unchanged.

### 3. Lazy-load the consumer (`src/routes/index.tsx`)
- Import `EarthGlobe` via `React.lazy` + `Suspense`, rendered only client-side (e.g. `const [mounted, setMounted] = useState(false)` + `useEffect`), so the route's SSR pass never pulls `react-globe.gl` into the server bundle.

### 4. TopoJSON → GeoJSON in `src/atlas/useCountries.ts`
- Detect payload shape: if `data.type === "Topology"`, use `topojson-client`'s `feature(topology, topology.objects.countries)` and take `.features`; otherwise assume it's already a `FeatureCollection` and read `.features`.
- Normalize properties so `ADM0_A3` is always populated. The world-atlas 110m file uses numeric `id` (ISO 3166-1 numeric) and a `name` property — map numeric id → ISO_A3 via a small lookup (use `d3-geo`'s data isn't enough; ship a tiny `numericToIso3.ts` map covering all ~250 codes, or inline it in `useCountries.ts`).
- Cache the resulting `CountryFeature[]` as today.

### 5. No changes to data layer, panels, store, or routing beyond the lazy wrapper.

## Acceptance

- Preview `/` renders the globe with no SSR error and no `geoJson.type` error.
- Hover/click/fly-to and morphology coloring all still work because the resolved `nodeId` path is unchanged.
- Build (`build:dev`) succeeds.
