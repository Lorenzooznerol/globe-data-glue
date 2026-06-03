import type { EpistemicLevel } from "@/data/types";

type Level = EpistemicLevel | string;

interface Props {
  level: Level;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Tiny mono tag that visually encodes how a claim is grounded.
 * VERIFIED  → solid ink
 * ATTESTED  → outlined
 * INFERRED  → dashed border, muted
 * SPECULATED → faint dashed, very muted
 * OPAQUE    → ghosted
 */
export function EpistemicChip({ level, children, className }: Props) {
  const lvl = (level || "").toUpperCase();
  const label = children ?? lvl;

  const style = (() => {
    switch (lvl) {
      case "VERIFIED":
        return {
          backgroundColor: "var(--epistemic-verified)",
          color: "var(--background)",
          border: "1px solid var(--epistemic-verified)",
        };
      case "ATTESTED":
        return {
          backgroundColor: "transparent",
          color: "var(--epistemic-attested)",
          border: "1px solid var(--epistemic-attested)",
        };
      case "INFERRED":
        return {
          backgroundColor: "transparent",
          color: "var(--epistemic-inferred)",
          border: "1px dashed var(--epistemic-inferred)",
        };
      case "SPECULATED":
        return {
          backgroundColor: "transparent",
          color: "var(--epistemic-speculated)",
          border: "1px dashed var(--epistemic-speculated)",
        };
      case "OPAQUE":
      default:
        return {
          backgroundColor: "transparent",
          color: "var(--epistemic-opaque)",
          border: "1px dotted var(--epistemic-opaque)",
        };
    }
  })();

  return (
    <span
      className={
        "mono inline-flex items-center px-1.5 py-[1px] text-[9px] uppercase tracking-[0.18em] " +
        (className ?? "")
      }
      style={style}
    >
      {label}
    </span>
  );
}
