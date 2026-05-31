import { useEffect, useState } from "react";

export interface CountryFeature {
  type: "Feature";
  properties: { NAME: string; ISO_A3: string; ADM0_A3: string };
  geometry: unknown;
}

let cache: CountryFeature[] | null = null;
let pending: Promise<CountryFeature[]> | null = null;

async function loadFeatures(): Promise<CountryFeature[]> {
  if (cache) return cache;
  if (pending) return pending;
  pending = fetch("/data/countries-110m.geojson")
    .then((r) => {
      if (!r.ok) throw new Error("failed to load countries");
      return r.json();
    })
    .then((g: { features: CountryFeature[] }) => {
      cache = g.features;
      return cache;
    });
  return pending;
}

export function useCountries(): CountryFeature[] {
  const [features, setFeatures] = useState<CountryFeature[]>(cache ?? []);
  useEffect(() => {
    let alive = true;
    loadFeatures().then((f) => {
      if (alive) setFeatures(f);
    });
    return () => {
      alive = false;
    };
  }, []);
  return features;
}
