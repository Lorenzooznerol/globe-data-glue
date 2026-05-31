// Three-family display grouping. Node data keeps full morphology codes;
// the families are a presentation layer only.

import type { AtlasNode } from "@/data/types";

export type Family = "gap" | "enforced" | "provisional";

export const FAMILY_ORDER: Family[] = ["gap", "enforced", "provisional"];

export const FAMILY_LABEL: Record<Family, string> = {
  gap: "Gap",
  enforced: "Enforced",
  provisional: "Provisional",
};

export const FAMILY_GLOSS: Record<Family, string> = {
  gap: "Rules outrun practice.",
  enforced: "Control is real and applied.",
  provisional: "Light, fragile, or not built yet.",
};

export const FAMILY_COLOR: Record<Family, string> = {
  gap: "#6E8FB8",
  enforced: "#5C9E8F",
  provisional: "#C99A4E",
};

export const OPAQUE_GREY = "#7A828E";

/** Map a morphology string (possibly "M3+M4" or "M7-then-enacted") to a family via its primary code. */
export function familyOf(morphology: string | undefined | null): Family | null {
  if (!morphology) return null;
  const m = morphology.match(/M[1-7]/);
  if (!m) return null;
  switch (m[0]) {
    case "M1":
    case "M4":
      return "gap";
    case "M2":
    case "M3":
      return "enforced";
    case "M6":
    case "M7":
      return "provisional";
    case "M5":
      return null; // opacity — rendered grey
    default:
      return null;
  }
}

/** Display color for a node: family swatch, or neutral grey for OPAQUE / unmappable. */
export function colorForNode(node: Pick<AtlasNode, "morphology" | "evidence_strength"> | null | undefined): string {
  if (!node) return OPAQUE_GREY;
  if ((node.evidence_strength || "").toUpperCase() === "OPAQUE") return OPAQUE_GREY;
  const fam = familyOf(node.morphology);
  return fam ? FAMILY_COLOR[fam] : OPAQUE_GREY;
}
