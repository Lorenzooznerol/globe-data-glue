import type { Atlas, CountryOverlay, Girai } from "./types";

const ATLAS_URL = "/data/atlas.json";
const GIRAI_URL = "/data/girai.json";
const COUNTRIES_INDEX_URL = "/data/countries/index.json";

export async function loadAtlas(): Promise<Atlas> {
  const res = await fetch(ATLAS_URL);
  if (!res.ok) throw new Error(`Failed to fetch ${ATLAS_URL}: ${res.status}`);
  return (await res.json()) as Atlas;
}

export async function loadGirai(): Promise<Girai> {
  const res = await fetch(GIRAI_URL);
  if (!res.ok) throw new Error(`Failed to fetch ${GIRAI_URL}: ${res.status}`);
  return (await res.json()) as Girai;
}

export async function loadCountryOverlays(): Promise<CountryOverlay[]> {
  let codes: string[] = [];
  try {
    const res = await fetch(COUNTRIES_INDEX_URL);
    if (!res.ok) return [];
    codes = (await res.json()) as string[];
  } catch {
    return [];
  }
  const results = await Promise.all(
    codes.map(async (code) => {
      try {
        const res = await fetch(`/data/countries/${code}.json`);
        if (!res.ok) return null;
        return (await res.json()) as CountryOverlay;
      } catch (e) {
        console.warn(`[overlay] failed to load ${code}.json`, e);
        return null;
      }
    }),
  );
  return results.filter((x: CountryOverlay | null): x is CountryOverlay => !!x);
}

export async function loadAll(): Promise<{
  atlas: Atlas;
  girai: Girai;
  overlays: CountryOverlay[];
}> {
  const [atlas, girai, overlays] = await Promise.all([
    loadAtlas(),
    loadGirai(),
    loadCountryOverlays(),
  ]);
  return { atlas, girai, overlays };
}
