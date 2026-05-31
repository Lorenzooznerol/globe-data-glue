// Types mirror /public/data/atlas.json. Everything is pre-joined.

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
  layer: string; // "state" | "actor" | "deployer" | "legitimacy"
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
}

export interface Atlas {
  meta: AtlasMeta;
  glossary: GlossaryTerm[];
  markers: Marker[];
  legitimacy_edges: LegitimacyEdge[];
  nodes: AtlasNode[];
  unassigned_documents?: AtlasDocument[];
}
