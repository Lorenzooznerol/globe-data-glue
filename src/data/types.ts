// Types mirror /public/data/atlas.json and /public/data/girai.json. Everything is pre-joined.

export interface AtlasMeta {
  title: string;
  generated: string;
  reference_date: string;
  namespaces_resolved?: boolean;
  note?: string;
  counts?: Record<string, number>;
  node_count?: number;
  unassigned_document_count?: number;
}

export interface GlossaryTerm {
  term: string;
  plain_definition: string;
  /** Optional ISO3-keyed nuance shown only when reading that country's panel. */
  country_nuance?: Record<string, string>;
}

export interface Marker {
  marker_id: string;
  morphology: string;
  causal_chain: string;
  confound: string;
  discriminating_counterfactual: string;
  verdict: string;
  ex_ante_marker: string;
  confidence: string;
  reg_ref: string;
}

export interface LegitimacyEdge {
  edge_id: string;
  edge_type: string;
  from_node: string;
  to_node: string;
  layer_target: string;
  justification: string;
  included: string;
}

export interface AtlasSource {
  source_id: string;
  title: string;
  publisher?: string;
  url?: string;
  pub_date?: string;
  source_type?: string;
}

export interface AtlasDocument {
  source_id: string;
  title: string;
  publisher?: string;
  url?: string;
  pub_date?: string;
  date_status?: string;
  source_type?: string;
  tier?: string;
  origin?: string;
}

export interface AtlasClaim {
  claim_id: string;
  claim_text: string;
  as_of_date: string;
  epistemic_level: string;
  reg_ref?: string;
  sources: AtlasSource[];
}

export interface AtlasMorphologyEntry {
  as_of: string;
  morphology: string;
  sub_mechanism?: string;
  source_id?: string;
  note?: string;
}

export interface AtlasPrediction {
  pred_id: string;
  marker?: string;
  direction?: string;
  as_of_snapshot?: string;
  marker_evidence?: string;
  predicted_trajectory?: string;
  falsification_threshold?: string;
  falsification_date?: string;
  confidence?: string;
  status?: string;
  sources?: AtlasSource[];
}

export interface AtlasVision {
  source_of_authority?: string;
  scope?: string;
  mode_of_influence?: string;
  dated_anchor?: string;
  notes?: string;
}

export interface AtlasDocumentGroups {
  primary: AtlasDocument[];
  secondary: AtlasDocument[];
  context: AtlasDocument[];
}

export interface AtlasNode {
  node_id: string;
  name: string;
  layer: string;
  headline?: string;
  summary?: string;
  morphology_plain?: string;
  paper_plain?: string;
  reality_plain?: string;
  morphology?: string;
  sub_mechanism?: string;
  paper_band?: string;
  realization_band?: string;
  realization_mode?: string;
  epistemic_level?: string;
  evidence_strength?: string;
  region?: string;
  notes?: string;
  claims?: AtlasClaim[];
  documents?: AtlasDocumentGroups;
  morphology_timeline?: AtlasMorphologyEntry[];
  predictions?: AtlasPrediction[];
  vision?: AtlasVision;
  // GIRAI join keys (state nodes only)
  iso3?: string | null;
  part_of_iso3?: string | null;
  subnational?: boolean;
  supranational?: boolean;
  girai_has_data?: boolean;
  independence_flag?: boolean;
}

/* ---------- Country Overlay (per-country curated upgrade) ---------- */

export type EpistemicLevel =
  | "VERIFIED"
  | "ATTESTED"
  | "INFERRED"
  | "SPECULATED"
  | "OPAQUE";

export interface OverlayMeta {
  iso3: string;
  country: string;
  schema: string;
  compiled?: string;
  note?: string;
}

export interface OverlayNode {
  node_id: string;
  iso3: string;
  layer: string;
  name: string;
  region?: string;
  morphology: string;
  sub_mechanism?: string;
  paper_band?: string;
  realization_band?: string;
  realization_mode?: string;
  epistemic_level?: string;
  evidence_strength?: string;
  girai_has_data?: boolean;
  independence_flag?: boolean;
  notes?: string;
}

export interface OverlayCoordinate {
  value: string;
  evidence_articles: string[];
  epistemic_level: EpistemicLevel | string;
}

export interface OverlayCoordinates {
  gaze: OverlayCoordinate;
  surveillance_breadth: OverlayCoordinate;
  institutional_transparency: OverlayCoordinate;
  reciprocity: OverlayCoordinate;
}

export interface OverlayClaim {
  claim_id: string;
  claim_text: string;
  as_of_date: string;
  epistemic_level: EpistemicLevel | string;
  /** Semicolon-joined source ids, e.g. "S069;S070". */
  source_ids: string;
  reg_ref?: string;
}

export interface OverlaySource {
  source_id: string;
  title: string;
  publisher?: string;
  url?: string;
  pub_date?: string;
  source_type?: string;
  reliability?: string;
}

export interface OverlayDocument {
  label: string;
  source_id: string;
}

export interface OverlayReadable {
  headline?: string;
  summary?: string;
  how_it_works?: string;
  documents?: OverlayDocument[];
  technical_detail?: string;
}

export interface CountryOverlay {
  meta: OverlayMeta;
  node: OverlayNode;
  coordinates: OverlayCoordinates;
  claims: OverlayClaim[];
  sources: OverlaySource[];
  readable: OverlayReadable;
  to_verify: string[];
}

export interface Atlas {
  meta: AtlasMeta;
  glossary: GlossaryTerm[];
  markers: Marker[];
  legitimacy_edges: LegitimacyEdge[];
  nodes: AtlasNode[];
  unassigned_documents?: AtlasDocument[];
}

/* ---------- GIRAI ---------- */

export interface GiraiPillars {
  government_frameworks: number;
  government_actions: number;
  non_state_actors: number;
}

export interface GiraiDimensions {
  human_rights: number;
  governance: number;
  capacities: number;
}

export interface GiraiCountry {
  iso3: string;
  country: string;
  ranking: number;
  region?: string;
  un_region?: string;
  un_subregion?: string;
  index_score: number;
  pillars: GiraiPillars;
  dimensions: GiraiDimensions;
  thematic_areas: Record<string, number | null>;
}

export interface GiraiMeta {
  source: string;
  publisher: string;
  license: string;
  data_year: number;
  edition: string;
  country_count: number;
  note?: string;
  scale?: Record<string, string>;
}

export interface Girai {
  meta: GiraiMeta;
  countries: GiraiCountry[];
}
