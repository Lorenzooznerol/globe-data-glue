import type { Atlas, Girai } from "./types";

const ATLAS_URL = "/data/atlas.json";
const GIRAI_URL = "/data/girai.json";

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

export async function loadAll(): Promise<{ atlas: Atlas; girai: Girai }> {
  const [atlas, girai] = await Promise.all([loadAtlas(), loadGirai()]);
  return { atlas, girai };
}
