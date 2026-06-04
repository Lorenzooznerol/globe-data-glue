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
  /** For morphology node — show inline radar in inspector */
  showRadar?: boolean;
}

const ROW = { baseline: 0, law: 140, branch: 320, leaf: 460, morph: 620 };

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
      position: { x: 480, y: ROW.law },
      data: {
        kind: "law",
        label: "Law 132/2025",
        subLabel: "in force 10 Oct 2025",
        meta: "GIRAI 61.8 · 7/138",
        claimIds: ["C-IT-01", "C-IT-04", "C-IT-06", "C-IT-07"],
        flagToVerify: toVerifyCount > 0,
      },
    },
    {
      id: "authorities",
      type: "entity",
      position: { x: 80, y: ROW.branch },
      data: {
        kind: "authority",
        label: "AUTHORITIES",
        subLabel: "AgID · ACN",
        claimIds: ["C-IT-02", "C-IT-05"],
        independence: true,
      },
    },
    {
      id: "criminal",
      type: "entity",
      position: { x: 380, y: ROW.branch },
      data: {
        kind: "criminal",
        label: "CRIMINAL",
        subLabel: "Art. 612-quater +",
        claimIds: ["C-IT-03"],
      },
    },
    {
      id: "sectors",
      type: "entity",
      position: { x: 640, y: ROW.branch },
      data: {
        kind: "sectors",
        label: "SECTORS",
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
      position: { x: 940, y: ROW.branch },
      data: {
        kind: "programme",
        label: "PROGRAMME & DECREES",
        subLabel: "€1bn fund · decrees due 10 Oct 2026",
        claimIds: ["C-IT-07"],
      },
    },
    {
      id: "morphology",
      type: "entity",
      position: { x: 480, y: ROW.morph },
      data: {
        kind: "morphology",
        label: "MORPHOLOGY — coordinates",
        subLabel: "inferred · gaze / breadth / transparency / reciprocity",
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
    type: "straight",
    style: {
      stroke: "var(--border)",
      strokeWidth: 1,
      ...(dashed ? { strokeDasharray: "4 3" } : {}),
    },
    labelStyle: {
      fill: "var(--muted-foreground)",
      fontSize: 9,
      letterSpacing: "0.12em",
      textTransform: "uppercase",
    },
    labelBgStyle: { fill: "var(--background)" },
    labelBgPadding: [4, 2],
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
