import { loadAll, type RawTables } from "./loader";
import type {
  Claim,
  GlossaryTerm,
  LegitimacyEdge,
  Marker,
  MorphologyTimeIndexed,
  NodeBanded,
  NodeDocumentGroups,
  NodeReadable,
  NodeVision,
  Prediction,
  Source,
  SourceV2,
} from "./types";

export interface DataStore {
  raw: RawTables;
  nodesBandedById: Map<string, NodeBanded>;
  nodesVisionById: Map<string, NodeVision>;
  edgesById: Map<string, LegitimacyEdge>;
  markersById: Map<string, Marker>;
  markersByMorphology: Map<string, Marker>;
  predictionsById: Map<string, Prediction>;
  claimsById: Map<string, Claim>;
  sourcesById: Map<string, Source>;

  // Readable layer
  readableById: Map<string, NodeReadable>;
  glossaryByTerm: Map<string, GlossaryTerm>; // lowercased key
  glossaryList: GlossaryTerm[]; // alphabetized
  sourcesV2ById: Map<string, SourceV2>;

  getNode: (id: string) => NodeBanded | NodeVision | undefined;
  getSources: (ids: string[]) => Source[];
  claimsForNode: (id: string) => Claim[];
  predictionsForNode: (id: string) => Prediction[];
  edgesFrom: (id: string) => LegitimacyEdge[];
  edgesTo: (id: string) => LegitimacyEdge[];
  morphologyHistory: (nodeId: string) => MorphologyTimeIndexed[];
  markerFor: (morphologyCode: string) => Marker | undefined;
  documentsForNode: (nodeId: string) => Source[];
  /** New: node_sources joined to sources_v2, grouped by tier, sorted by pub_date desc. */
  documentGroupsForNode: (nodeId: string) => NodeDocumentGroups;

  warnings: string[];
}

function indexBy<T>(rows: T[], key: (r: T) => string): Map<string, T> {
  const m = new Map<string, T>();
  for (const r of rows) {
    const k = key(r);
    if (k) m.set(k, r);
  }
  return m;
}

export function buildStore(raw: RawTables): DataStore {
  const nodesBandedById = indexBy(raw.nodesBanded, (r) => r.node_id);
  const nodesVisionById = indexBy(raw.nodesVision, (r) => r.node_id);
  const edgesById = indexBy(raw.edges, (r) => r.edge_id);
  const markersById = indexBy(raw.markers, (r) => r.marker_id);
  const markersByMorphology = indexBy(raw.markers, (r) => r.morphology);
  const predictionsById = indexBy(raw.predictions, (r) => r.pred_id);
  const claimsById = indexBy(raw.claims, (r) => r.claim_id);
  const sourcesById = indexBy(raw.sources, (r) => r.source_id);

  const readableById = indexBy(raw.nodesReadable, (r) => r.node_id);
  const sourcesV2ById = indexBy(raw.sourcesV2, (r) => r.source_id);
  const glossaryByTerm = new Map<string, GlossaryTerm>();
  for (const g of raw.glossary) {
    if (g.term) glossaryByTerm.set(g.term.toLowerCase(), g);
  }
  const glossaryList = [...raw.glossary]
    .filter((g) => g.term)
    .sort((a, b) => a.term.localeCompare(b.term));

  const knownNodeIds = new Set<string>([...nodesBandedById.keys(), ...nodesVisionById.keys()]);
  const knownSourceIds = new Set<string>(sourcesById.keys());

  const warnings: string[] = [];
  const warn = (msg: string) => {
    warnings.push(msg);
    if (warnings.length <= 20) console.warn("[store]", msg);
  };

  for (const e of raw.edges) {
    if (!knownNodeIds.has(e.from_node)) warn(`edge ${e.edge_id}: unknown from_node ${e.from_node}`);
    if (!knownNodeIds.has(e.to_node)) warn(`edge ${e.edge_id}: unknown to_node ${e.to_node}`);
  }
  for (const p of raw.predictions) {
    if (!knownNodeIds.has(p.node_id)) warn(`prediction ${p.pred_id}: unknown node_id ${p.node_id}`);
    for (const sid of p.source_ids) {
      if (!knownSourceIds.has(sid)) warn(`prediction ${p.pred_id}: unknown source_id ${sid}`);
    }
  }
  for (const c of raw.claims) {
    if (!knownNodeIds.has(c.node_id)) warn(`claim ${c.claim_id}: unknown node_id ${c.node_id}`);
    for (const sid of c.source_ids) {
      if (!knownSourceIds.has(sid)) warn(`claim ${c.claim_id}: unknown source_id ${sid}`);
    }
  }
  for (const m of raw.morphology) {
    if (!knownNodeIds.has(m.node_id)) warn(`morphology row: unknown node_id ${m.node_id}`);
    if (m.source_id && !knownSourceIds.has(m.source_id)) {
      warn(`morphology(${m.node_id}@${m.as_of}): unknown source_id ${m.source_id}`);
    }
  }

  const documentsForNode = (nodeId: string): Source[] => {
    const ids = new Set<string>();
    for (const c of raw.claims) {
      if (c.node_id !== nodeId) continue;
      for (const sid of c.source_ids) ids.add(sid);
    }
    for (const m of raw.morphology) {
      if (m.node_id !== nodeId) continue;
      if (m.source_id) ids.add(m.source_id);
    }
    const out: Source[] = [];
    for (const id of ids) {
      const s = sourcesById.get(id);
      if (s) out.push(s);
    }
    out.sort((a, b) => (b.pub_date ?? "").localeCompare(a.pub_date ?? ""));
    return out;
  };

  const documentGroupsForNode = (nodeId: string): NodeDocumentGroups => {
    const seen = new Set<string>();
    const buckets: NodeDocumentGroups = { primary: [], secondary: [], context: [] };
    for (const link of raw.nodeSources) {
      if (link.node_id !== nodeId) continue;
      if (seen.has(link.source_id)) continue;
      const src = sourcesV2ById.get(link.source_id);
      if (!src) continue;
      seen.add(link.source_id);
      const tier = (src.tier || "context").toLowerCase();
      if (tier === "primary") buckets.primary.push(src);
      else if (tier === "secondary") buckets.secondary.push(src);
      else buckets.context.push(src);
    }
    const byDateDesc = (a: SourceV2, b: SourceV2) => {
      const ad = a.pub_date || "";
      const bd = b.pub_date || "";
      if (!ad && !bd) return 0;
      if (!ad) return 1; // empty last
      if (!bd) return -1;
      return bd.localeCompare(ad);
    };
    buckets.primary.sort(byDateDesc);
    buckets.secondary.sort(byDateDesc);
    buckets.context.sort(byDateDesc);
    return buckets;
  };

  return {
    raw,
    nodesBandedById,
    nodesVisionById,
    edgesById,
    markersById,
    markersByMorphology,
    predictionsById,
    claimsById,
    sourcesById,
    readableById,
    glossaryByTerm,
    glossaryList,
    sourcesV2ById,
    getNode: (id) => nodesBandedById.get(id) ?? nodesVisionById.get(id),
    getSources: (ids) => ids.map((i) => sourcesById.get(i)).filter((s): s is Source => !!s),
    claimsForNode: (id) =>
      raw.claims
        .filter((c) => c.node_id === id)
        .slice()
        .sort((a, b) => (b.as_of_date ?? "").localeCompare(a.as_of_date ?? "")),
    predictionsForNode: (id) => raw.predictions.filter((p) => p.node_id === id),
    edgesFrom: (id) => raw.edges.filter((e) => e.from_node === id),
    edgesTo: (id) => raw.edges.filter((e) => e.to_node === id),
    morphologyHistory: (nodeId) =>
      raw.morphology
        .filter((m) => m.node_id === nodeId)
        .slice()
        .sort((a, b) => a.as_of.localeCompare(b.as_of)),
    markerFor: (code) => markersByMorphology.get(code),
    documentsForNode,
    documentGroupsForNode,
    warnings,
  };
}

export async function loadStore(): Promise<DataStore> {
  const raw = await loadAll();
  return buildStore(raw);
}
