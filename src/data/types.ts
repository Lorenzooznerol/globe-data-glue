// Types mirror CSV columns 1:1. Semicolon-delimited fields become string[].

export interface NodeBanded {
  node_id: string;
  layer: string;
  name: string;
  region: string;
  morphology: string;
  sub_mechanism: string;
  paper_band: string;
  realization_band: string;
  realization_mode: string;
  epistemic_level: string;
  evidence_strength: string;
  notes: string;
}

export interface NodeVision {
  node_id: string;
  name: string;
  source_of_authority: string;
  scope: string;
  mode_of_influence: string;
  dated_anchor: string;
  notes: string;
}

export interface MorphologyTimeIndexed {
  node_id: string;
  as_of: string;
  morphology: string;
  sub_mechanism: string;
  source_id: string;
  note: string;
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

export interface Prediction {
  pred_id: string;
  node_id: string;
  marker: string;
  direction: string;
  as_of_snapshot: string;
  marker_evidence: string;
  predicted_trajectory: string;
  falsification_threshold: string;
  falsification_date: string;
  confidence: string;
  status: string;
  source_ids: string[];
}

export interface Claim {
  claim_id: string;
  node_id: string;
  claim_text: string;
  as_of_date: string;
  epistemic_level: string;
  source_ids: string[];
  reg_ref: string;
}

export interface Source {
  source_id: string;
  title: string;
  publisher: string;
  url: string;
  pub_date: string;
  source_type: string;
  topic: string;
  reliability: string;
  url_status: string;
  date_status: string;
}
