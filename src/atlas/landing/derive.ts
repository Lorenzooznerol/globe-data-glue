// Pure selectors for the Language-Explorer landing.
// Aggregation rule for the country dot is COVERAGE (proportion), not worst-wins.

import type { AtlasNode } from "@/data/types";
import { splitMorphology, type Band, type Layer, type MorphCode } from "@/atlas/morphology";
import type { LandingFilters } from "./landingStore";

const BANDS_VALID: Band[] = ["CI", "IN", "AS", "S", "C"];
const EVIDENCE_VALID = new Set(["STRONG", "WEAK", "OPAQUE"]);

function evidenceUp(e: string | undefined): "STRONG" | "WEAK" | "OPAQUE" | null {
  const u = (e ?? "").toUpperCase();
  return EVIDENCE_VALID.has(u) ? (u as "STRONG" | "WEAK" | "OPAQUE") : null;
}

function bandUp(b: string | undefined): Band | null {
  const u = (b ?? "").trim().toUpperCase() as Band;
  return BANDS_VALID.includes(u) ? u : null;
}

function layerOf(node: AtlasNode): Layer {
  const l = (node.layer ?? "").toLowerCase();
  if (l === "actor") return "actor";
  if (l === "deployer") return "deployer";
  if (l === "vision") return "vision";
  return "state";
}

/** A node matches the landing filters when EVERY active facet matches.
 *  Empty facet = no constraint. */
export function nodeMatches(node: AtlasNode, f: LandingFilters): boolean {
  if (f.query.trim()) {
    const q = f.query.trim().toLowerCase();
    const hay = `${node.name ?? ""} ${node.headline ?? ""} ${node.summary ?? ""} ${node.iso3 ?? ""}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  if (f.jurisdiction.size > 0) {
    const iso = node.iso3 ?? node.part_of_iso3 ?? null;
    if (!iso || !f.jurisdiction.has(iso)) return false;
  }
  if (f.layer.size > 0 && !f.layer.has(layerOf(node))) return false;
  if (f.morphology.size > 0) {
    const { primary, secondary } = splitMorphology(node.morphology);
    const hits: MorphCode[] = [];
    if (primary) hits.push(primary);
    if (secondary) hits.push(secondary);
    if (!hits.some((h) => f.morphology.has(h))) return false;
  }
  if (f.paperBand.size > 0) {
    const b = bandUp(node.paper_band);
    if (!b || !f.paperBand.has(b)) return false;
  }
  if (f.realBand.size > 0) {
    const b = bandUp(node.realization_band);
    if (!b || !f.realBand.has(b)) return false;
  }
  if (f.evidence.size > 0) {
    const e = evidenceUp(node.evidence_strength);
    if (!e || !f.evidence.has(e)) return false;
  }
  return true;
}

/** Group nodes by best iso3 we can resolve (own iso3 or part_of_iso3). */
export function nodesByIso(nodes: AtlasNode[]): Map<string, AtlasNode[]> {
  const m = new Map<string, AtlasNode[]>();
  for (const n of nodes) {
    const iso = n.iso3 ?? n.part_of_iso3 ?? null;
    if (!iso) continue;
    const arr = m.get(iso) ?? [];
    arr.push(n);
    m.set(iso, arr);
  }
  return m;
}

/* ---------- Coverage (the corrected rule) ---------- */

export type CoverageBand = "high" | "mid" | "low" | "hollow";

export interface CountryCoverage {
  iso3: string;
  total: number;
  strong: number;
  weak: number;
  opaque: number;
  coverage: number; // (strong + .5*weak) / total
  band: CoverageBand; // see thresholds below
}

/** Thresholds — first cut, to be tuned against real distribution. */
const HIGH = 0.75;
const MID = 0.4;
const LOW = 0.1;

export function aggregateCountryCoverage(nodes: AtlasNode[]): CountryCoverage[] {
  const byIso = nodesByIso(nodes);
  const out: CountryCoverage[] = [];
  for (const [iso, list] of byIso) {
    let strong = 0;
    let weak = 0;
    let opaque = 0;
    for (const n of list) {
      const e = evidenceUp(n.evidence_strength);
      if (e === "STRONG") strong++;
      else if (e === "WEAK") weak++;
      else if (e === "OPAQUE") opaque++;
    }
    const total = list.length || 1;
    const coverage = (strong + 0.5 * weak) / total;
    let band: CoverageBand;
    if (strong === 0 && weak === 0) band = "hollow";
    else if (coverage < LOW) band = "hollow";
    else if (coverage < MID) band = "low";
    else if (coverage < HIGH) band = "mid";
    else band = "high";
    out.push({ iso3: iso, total: list.length, strong, weak, opaque, coverage, band });
  }
  return out;
}

export function coverageOpacity(band: CoverageBand): number {
  switch (band) {
    case "high":
      return 1.0;
    case "mid":
      return 0.65;
    case "low":
      return 0.4;
    case "hollow":
      return 0; // rendered as a hairline ring instead
  }
}
