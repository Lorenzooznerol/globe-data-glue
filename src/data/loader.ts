import Papa from "papaparse";
import type {
  Claim,
  LegitimacyEdge,
  Marker,
  MorphologyTimeIndexed,
  NodeBanded,
  NodeVision,
  Prediction,
  Source,
} from "./types";

const FILES = {
  nodesBanded: "/data/nodes_banded.csv",
  nodesVision: "/data/nodes_vision.csv",
  morphology: "/data/morphology_timeindexed.csv",
  edges: "/data/legitimacy_edges.csv",
  markers: "/data/markers.csv",
  predictions: "/data/predictions.csv",
  claims: "/data/claims.csv",
  sources: "/data/sources.csv",
} as const;

async function fetchCsv<T>(url: string): Promise<T[]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const text = await res.text();
  const parsed = Papa.parse<T>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
    transform: (v) => (typeof v === "string" ? v.trim() : v),
  });
  if (parsed.errors.length) {
    console.warn(`[csv:${url}] parse warnings`, parsed.errors.slice(0, 3));
  }
  return parsed.data.filter((r) => Object.keys(r).length > 0);
}

const splitIds = (v: unknown): string[] =>
  typeof v === "string" && v.length > 0 ? v.split(";").map((s) => s.trim()).filter(Boolean) : [];

export interface RawTables {
  nodesBanded: NodeBanded[];
  nodesVision: NodeVision[];
  morphology: MorphologyTimeIndexed[];
  edges: LegitimacyEdge[];
  markers: Marker[];
  predictions: Prediction[];
  claims: Claim[];
  sources: Source[];
}

export async function loadAll(): Promise<RawTables> {
  const [
    nodesBanded,
    nodesVision,
    morphology,
    edges,
    markers,
    predictionsRaw,
    claimsRaw,
    sources,
  ] = await Promise.all([
    fetchCsv<NodeBanded>(FILES.nodesBanded),
    fetchCsv<NodeVision>(FILES.nodesVision),
    fetchCsv<MorphologyTimeIndexed>(FILES.morphology),
    fetchCsv<LegitimacyEdge>(FILES.edges),
    fetchCsv<Marker>(FILES.markers),
    fetchCsv<Record<string, unknown>>(FILES.predictions),
    fetchCsv<Record<string, unknown>>(FILES.claims),
    fetchCsv<Source>(FILES.sources),
  ]);

  const predictions: Prediction[] = predictionsRaw.map((r) => ({
    ...(r as unknown as Prediction),
    source_ids: splitIds(r.source_ids),
  }));

  const claims: Claim[] = claimsRaw.map((r) => ({
    ...(r as unknown as Claim),
    source_ids: splitIds(r.source_ids),
  }));

  return { nodesBanded, nodesVision, morphology, edges, markers, predictions, claims, sources };
}
