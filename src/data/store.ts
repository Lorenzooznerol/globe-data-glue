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

export async function loadStore(): Promise<DataStore> {
  const { atlas, girai } = await loadAll();
  return buildStore(atlas, girai);
}
