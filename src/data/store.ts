import { loadAtlas } from "./loader";
import type {
  Atlas,
  AtlasClaim,
  AtlasDocumentGroups,
  AtlasMorphologyEntry,
  AtlasNode,
  AtlasPrediction,
  GlossaryTerm,
  LegitimacyEdge,
  Marker,
} from "./types";

const EMPTY_GROUPS: AtlasDocumentGroups = { primary: [], secondary: [], context: [] };

export interface DataStore {
  atlas: Atlas;
  nodesById: Map<string, AtlasNode>;
  edgesById: Map<string, LegitimacyEdge>;
  markersById: Map<string, Marker>;
  glossaryByTerm: Map<string, GlossaryTerm>; // lowercased key
  glossaryList: GlossaryTerm[]; // alphabetized

  getNode: (id: string) => AtlasNode | undefined;
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

export function buildStore(atlas: Atlas): DataStore {
  const nodesById = indexBy(atlas.nodes, (n) => n.node_id);
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
    nodesById,
    edgesById,
    markersById,
    glossaryByTerm,
    glossaryList,

    getNode: (id) => nodesById.get(id),
    documentGroupsForNode: (id) => nodesById.get(id)?.documents ?? EMPTY_GROUPS,
    claimsForNode: (id) => nodesById.get(id)?.claims ?? [],
    predictionsForNode: (id) => nodesById.get(id)?.predictions ?? [],
    morphologyHistory: (id) => nodesById.get(id)?.morphology_timeline ?? [],
    edgesFrom: (id) => (atlas.legitimacy_edges ?? []).filter((e) => e.from_node === id),
    edgesTo: (id) => (atlas.legitimacy_edges ?? []).filter((e) => e.to_node === id),
  };
}

export async function loadStore(): Promise<DataStore> {
  const atlas = await loadAtlas();
  return buildStore(atlas);
}
