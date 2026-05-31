import type { Family } from "@/atlas/families";

type Band = "low" | "mid" | "high";

function band(score: number): Band {
  if (score >= 60) return "high";
  if (score >= 30) return "mid";
  return "low";
}

export function morphologyVsScoreText(
  family: Family | null,
  index_score: number,
): string | null {
  if (family == null) return null;
  const b = band(index_score);
  if (family === "gap") {
    if (b === "high") return "Comprehensive on paper; the Atlas reads the gap between rules and practice as wide.";
    if (b === "mid") return "Mixed rulebook; the gap between paper and practice is visible.";
    return "Thin rulebook and a visible gap in what's enforced.";
  }
  if (family === "enforced") {
    if (b === "high") return "Comprehensive on paper, and the Atlas reads enforcement as real.";
    return "Enforcement is real where it lands, even if the broader rulebook is partial.";
  }
  // provisional
  if (b === "high") return "Scores high on paper; the Atlas reads its commitments as self-imposed and reversible.";
  return "Light or fragile commitments; little binding rule yet in place.";
}

export function MorphologyVsScoreLine({
  family,
  index_score,
}: {
  family: Family | null;
  index_score: number;
}) {
  const text = morphologyVsScoreText(family, index_score);
  if (!text) return null;
  return (
    <p className="font-serif text-[13px] italic leading-relaxed text-foreground/75">
      {text}
    </p>
  );
}
