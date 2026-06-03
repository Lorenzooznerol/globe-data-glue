import { loadAll } from "./loader";
import { ISO3_TO_NODE } from "@/atlas/iso";
import type {
  Atlas,
  AtlasClaim,
  AtlasDocumentGroups,
  AtlasMorphologyEntry,
  AtlasNode,
  AtlasPrediction,
  CountryOverlay,
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
  /** Curated per-country overlays, indexed by ISO3 and by node_id. */
  overlayByIso: Map<string, CountryOverlay>;
  overlayByNodeId: Map<string, CountryOverlay>;

  getNode: (id: string) => AtlasNode | undefined;
  getNodeByIso: (iso: string) => AtlasNode | undefined;
  getGirai: (iso: string) => GiraiCountry | undefined;
  getOverlay: (nodeId: string) => CountryOverlay | undefined;
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

/** Map semantic morphology labels (open-gap, hidden-gap, …) to canonical M-codes
 * so the families.ts regex matcher (/M[1-7]/) picks up overlay countries. */
function morphologyToCode(m: string | undefined): string | undefined {
  if (!m) return m;
  if (/M[1-7]/.test(m)) return m;
  switch (m.toLowerCase()) {
    case "open-gap":
      return "M1";
    case "hidden-gap":
      return "M4";
    case "enforced-ex-ante":
    case "ex-ante":
      return "M3";
    case "enforced":
    case "enforced-ex-post":
      return "M2";
    case "opaque":
      return "M5";
    case "provisional":
    case "soft":
      return "M6";
    case "absent":
    case "unbuilt":
      return "M7";
    default:
      return m;
  }
}

const PAPER_PLAIN: Record<string, string> = {
  S: "comprehensive",
  M: "partial",
  L: "minimal",
  IN: "partial",
};
const REALITY_PLAIN: Record<string, string> = {
  S: "substantial",
  M: "partial",
  L: "minimal",
  IN: "partial",
};

function plainGapBlurb(morph: string): string {
  const code = morphologyToCode(morph) ?? "";
  if (code.includes("M1")) return "Open gap — ambitious on paper, lagging in practice.";
  if (code.includes("M4")) return "Hidden gap — conforming on the surface, divergent below.";
  if (code.includes("M2")) return "Enforced ex-post — accountability after the fact.";
  if (code.includes("M3")) return "Controlled upfront — systems cleared before launch.";
  if (code.includes("M6")) return "Soft and self-imposed — promises that can be dropped.";
  if (code.includes("M7")) return "Light by design, or not built yet — little binding rule in place.";
  return "";
}

/** Build a synthetic AtlasNode from a country overlay, merging over any existing
 *  atlas node with the same id (overlay wins on conflicts). */
function nodeFromOverlay(
  overlay: CountryOverlay,
  existing: AtlasNode | undefined,
): AtlasNode {
  const n = overlay.node;
  const r = overlay.readable;
  const morphology = morphologyToCode(n.morphology) ?? n.morphology;
  const paper_plain = n.paper_band ? PAPER_PLAIN[n.paper_band] : undefined;
  const reality_plain = n.realization_band ? REALITY_PLAIN[n.realization_band] : undefined;
  return {
    ...(existing ?? {}),
    node_id: n.node_id,
    name: n.name,
    layer: n.layer,
    region: n.region,
    morphology,
    sub_mechanism: n.sub_mechanism,
    paper_band: n.paper_band,
    realization_band: n.realization_band,
    realization_mode: n.realization_mode,
    epistemic_level: n.epistemic_level,
    evidence_strength: n.evidence_strength,
    iso3: n.iso3,
    girai_has_data: n.girai_has_data ?? true,
    independence_flag: n.independence_flag,
    notes: n.notes,
    headline: r.headline ?? existing?.headline,
    summary: r.summary ?? existing?.summary,
    morphology_plain: plainGapBlurb(n.morphology) || existing?.morphology_plain,
    paper_plain: paper_plain ?? existing?.paper_plain,
    reality_plain: reality_plain ?? existing?.reality_plain,
    // Preserve any existing structured data from atlas.json
    claims: existing?.claims,
    documents: existing?.documents,
    morphology_timeline: existing?.morphology_timeline,
    predictions: existing?.predictions,
    vision: existing?.vision,
  };
}

export function buildStore(atlas: Atlas, girai: Girai, overlays: CountryOverlay[] = []): DataStore {
  // 1. Synthesize / merge overlay nodes into the atlas node list.
  const overlayByIso = new Map<string, CountryOverlay>();
  const overlayByNodeId = new Map<string, CountryOverlay>();
  const existingById = new Map(atlas.nodes.map((n) => [n.node_id, n] as const));
  const mergedNodes: AtlasNode[] = [...atlas.nodes];

  for (const ov of overlays) {
    const synthesized = nodeFromOverlay(ov, existingById.get(ov.node.node_id));
    overlayByIso.set(ov.node.iso3, ov);
    overlayByNodeId.set(ov.node.node_id, ov);
    if (existingById.has(ov.node.node_id)) {
      const idx = mergedNodes.findIndex((n) => n.node_id === ov.node.node_id);
      if (idx >= 0) mergedNodes[idx] = synthesized;
    } else {
      mergedNodes.push(synthesized);
    }
    // Route this ISO3 to the curated node, overriding the EU bucket mapping.
    if (ov.node.iso3) ISO3_TO_NODE[ov.node.iso3] = ov.node.node_id;
  }

  const nodesById = indexBy(mergedNodes, (n) => n.node_id);

  const nodeByIso = new Map<string, AtlasNode>();
  for (const n of mergedNodes) {
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
  for (const n of mergedNodes) {
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

  const mergedAtlas: Atlas = { ...atlas, nodes: mergedNodes };

  return {
    atlas: mergedAtlas,
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
    overlayByIso,
    overlayByNodeId,

    getNode: (id) => nodesById.get(id),
    getNodeByIso: (iso) => nodeByIso.get(iso),
    getGirai: (iso) => giraiByIso.get(iso),
    getOverlay: (nodeId) => overlayByNodeId.get(nodeId),
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
  const { atlas, girai, overlays } = await loadAll();
  return buildStore(atlas, girai, overlays);
}
