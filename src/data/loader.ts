import type { Atlas } from "./types";

const URL = "/data/atlas.json";

export async function loadAtlas(): Promise<Atlas> {
  const res = await fetch(URL);
  if (!res.ok) throw new Error(`Failed to fetch ${URL}: ${res.status}`);
  return (await res.json()) as Atlas;
}
