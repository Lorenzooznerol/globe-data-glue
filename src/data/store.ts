import { loadAll } from "./loader";
import type {
  Atlas,
  AtlasClaim,
  AtlasDocumentGroups,
  AtlasMorphologyEntry,
  AtlasNode,
  AtlasPrediction,
  Girai,
  GiraiCountry,
  GlossaryTerm,
  LegitimacyEdge,
  Marker,
} from "./types";

const EMPTY_GROUPS: AtlasDocumentGroups = { primary: [], secondary: [], context: [] };

/** A prediction decorated with its parent node id + name, for use in the register. */
export type DecoratedPrediction = AtlasPrediction & {
  node_id: string;
  node_name: string;
};

export interface DataStore {
  atlas: Atlas;
  girai: Girai;
  nodesById: Map<string, AtlasNode>;
  nodeByIso: Map<string, AtlasNode>;
  giraiByIso: Map<string, GiraiCountry>;
  edgesById: Map<string, LegitimacyEdge>;
  markersById: Map<string, Marker>;
  glossaryByTerm: Map<string, GlossaryTerm>;
  glossaryList: GlossaryTerm[];
  predictionsByNode: Map<string, DecoratedPrediction[]>;
  predictionsByMarker: Map<string, DecoratedPrediction[]>;
  allPredictions: DecoratedPrediction[];

  getNode: (id: string) => AtlasNode | undefined;
  getNodeByIso: (iso: string) => AtlasNode | undefined;
  getGirai: (iso: string) => GiraiCountry | undefined;
  documentGroupsForNode: (id: string) => AtlasDocumentGroups;
  claimsForNode: (id: string) => AtlasClaim[];
  predictionsForNode: (id: string) => AtlasPrediction[];
  morphologyHistory: (id: string) => AtlasMorphologyEntry[];
  edgesFrom: (id: string) => LegitimacyEdge[];
  edgesTo: (id: string) => LegitimacyEdge[];
}

function indexBy<T>(rows: T[], key: (r: T) => string): Map<string, T> {
  const m = new Map<string, T>();
  for (const r of rows) {
    const k = key(r);
    if (k) m.set(k, r);
  }
  return m;
}

export function buildStore(atlas: Atlas, girai: Girai): DataStore {
  const nodesById = indexBy(atlas.nodes, (n) => n.node_id);

  const nodeByIso = new Map<string, AtlasNode>();
  for (const n of atlas.nodes) {
    if (n.iso3) nodeByIso.set(n.iso3, n);
  }

  const giraiByIso = indexBy(girai.countries, (c) => c.iso3);

  const edgesById = indexBy(atlas.legitimacy_edges ?? [], (e) => e.edge_id);
  const markersById = indexBy(atlas.markers ?? [], (m) => m.marker_id);

  const glossaryByTerm = new Map<string, GlossaryTerm>();
  for (const g of atlas.glossary ?? []) {
    if (g.term) glossaryByTerm.set(g.term.toLowerCase(), g);
  }
  const glossaryList = [...(atlas.glossary ?? [])]
    .filter((g) => g.term)
    .sort((a, b) => a.term.localeCompare(b.term));

  const markerIds = (atlas.markers ?? []).map((m) => m.marker_id);
  const predictionsByNode = new Map<string, DecoratedPrediction[]>();
  const predictionsByMarker = new Map<string, DecoratedPrediction[]>();
  const allPredictions: DecoratedPrediction[] = [];
  for (const n of atlas.nodes) {
    const list = n.predictions ?? [];
    if (!list.length) continue;
    const decorated: DecoratedPrediction[] = list.map((p) => ({
      ...p,
      node_id: n.node_id,
      node_name: n.name,
    }));
    predictionsByNode.set(n.node_id, decorated);
    for (const dp of decorated) {
      allPredictions.push(dp);
      const mid = resolvePredictionMarker(dp.marker, markerIds);
      if (mid) {
        const arr = predictionsByMarker.get(mid) ?? [];
        arr.push(dp);
        predictionsByMarker.set(mid, arr);
      }
    }
  }
  allPredictions.sort((a, b) => {
    const da = a.falsification_date ?? "";
    const db = b.falsification_date ?? "";
    return da.localeCompare(db);
  });

  return {
    atlas,
    girai,
    nodesById,
    nodeByIso,
    giraiByIso,
    edgesById,
    markersById,
    glossaryByTerm,
    glossaryList,
    predictionsByNode,
    predictionsByMarker,
    allPredictions,

    getNode: (id) => nodesById.get(id),
    getNodeByIso: (iso) => nodeByIso.get(iso),
    getGirai: (iso) => giraiByIso.get(iso),
    documentGroupsForNode: (id) => nodesById.get(id)?.documents ?? EMPTY_GROUPS,
    claimsForNode: (id) => nodesById.get(id)?.claims ?? [],
    predictionsForNode: (id) => nodesById.get(id)?.predictions ?? [],
    morphologyHistory: (id) => nodesById.get(id)?.morphology_timeline ?? [],
    edgesFrom: (id) => (atlas.legitimacy_edges ?? []).filter((e) => e.from_node === id),
    edgesTo: (id) => (atlas.legitimacy_edges ?? []).filter((e) => e.to_node === id),
  };
}

function resolvePredictionMarker(marker: string | undefined, ids: string[]): string | null {
  if (!marker) return null;
  if (ids.includes(marker)) return marker;
  const matches = ids.filter((id) => marker.startsWith(id)).sort((a, b) => b.length - a.length);
  return matches[0] ?? null;
}

export async function loadStore(): Promise<DataStore> {
  const { atlas, girai } = await loadAll();
  return buildStore(atlas, girai);
}
