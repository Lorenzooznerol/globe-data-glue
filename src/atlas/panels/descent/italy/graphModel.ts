import type { Edge, Node } from "reactflow";
import type { CountryOverlay } from "@/data/types";

export type EntityKind =
  | "baseline"
  | "law"
  | "authority"
  | "criminal"
  | "sectors"
  | "programme"
  | "morphology";

export interface EntityData {
  kind: EntityKind;
  label: string;
  subLabel?: string;
  meta?: string;
  claimIds?: string[];
  independence?: boolean;
  dashed?: boolean;
  flagToVerify?: boolean;
  sectors?: string[];
  showRadar?: boolean;
}

// Vertical rhythm — generous, grid-aligned to 96px.
const ROW = { baseline: 0, law: 192, branch: 480, morph: 816 };

export function buildItalyGraph(overlay: CountryOverlay): {
  nodes: Node<EntityData>[];
  edges: Edge[];
} {
  const toVerifyCount = overlay.to_verify?.length ?? 0;

  const nodes: Node<EntityData>[] = [
    {
      id: "eu",
      type: "baseline",
      position: { x: 0, y: ROW.baseline },
      data: {
        kind: "baseline",
        label: "EU AI Act — Regulation 2024/1689",
        subLabel: "substrate · directly applicable",
        claimIds: ["C-IT-04"],
      },
      draggable: false,
      selectable: true,
    },
    {
      id: "law",
      type: "entity",
      position: { x: 510, y: ROW.law },
      data: {
        kind: "law",
        label: "Law 132/2025",
        subLabel: "in force 10 Oct 2025 · Italy",
        meta: "GIRAI 61.8 · rank 7 / 138",
        claimIds: ["C-IT-01", "C-IT-04", "C-IT-06", "C-IT-07"],
        flagToVerify: toVerifyCount > 0,
      },
    },
    {
      id: "authorities",
      type: "entity",
      position: { x: 24, y: ROW.branch },
      data: {
        kind: "authority",
        label: "AgID · ACN",
        subLabel: "notifying + market surveillance",
        meta: "designated Oct 2025",
        claimIds: ["C-IT-02", "C-IT-05"],
        independence: true,
      },
    },
    {
      id: "criminal",
      type: "entity",
      position: { x: 360, y: ROW.branch },
      data: {
        kind: "criminal",
        label: "Art. 612-quater +",
        subLabel: "deepfake offence · aggravating circumstances",
        meta: "1–5 yrs · in force 10 Oct 2025",
        claimIds: ["C-IT-03"],
      },
    },
    {
      id: "sectors",
      type: "entity",
      position: { x: 696, y: ROW.branch },
      data: {
        kind: "sectors",
        label: "Sectoral rules",
        subLabel: "ex-ante disclosure & duties",
        sectors: [
          "health",
          "work",
          "professions",
          "public admin",
          "judiciary",
          "copyright",
          "minors",
        ],
        claimIds: ["C-IT-04"],
      },
    },
    {
      id: "programme",
      type: "entity",
      position: { x: 1056, y: ROW.branch },
      data: {
        kind: "programme",
        label: "Programme & decrees",
        subLabel: "€1bn fund · delegated decrees",
        meta: "decrees due 10 Oct 2026",
        claimIds: ["C-IT-07"],
      },
    },
    {
      id: "morphology",
      type: "entity",
      position: { x: 510, y: ROW.morph },
      data: {
        kind: "morphology",
        label: "Coordinates — reading",
        subLabel: "gaze · breadth · transparency · reciprocity",
        meta: "inferred · not a verified fact",
        claimIds: ["C-IT-07"],
        dashed: true,
        showRadar: true,
      },
    },
  ];

  const e = (
    id: string,
    source: string,
    target: string,
    label?: string,
    dashed = false,
  ): Edge => ({
    id,
    source,
    target,
    label,
    type: "smoothstep",
    pathOptions: { borderRadius: 12, offset: 24 },
    className: dashed ? "is-inferred" : undefined,
    style: { strokeWidth: 1 },
    labelBgPadding: [6, 3],
    labelBgBorderRadius: 0,
    data: { dashed },
  });

  const edges: Edge[] = [
    e("e-eu-law", "eu", "law", "rests on"),
    e("e-law-auth", "law", "authorities", "designates"),
    e("e-law-crim", "law", "criminal", "inserts"),
    e("e-law-sect", "law", "sectors", "regulates"),
    e("e-law-prog", "law", "programme", "funds · delegates"),
    e("e-law-morph", "law", "morphology", "inferred from", true),
  ];

  return { nodes, edges };
}
