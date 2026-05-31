import { useEffect, useState } from "react";
import { Line } from "../Line";
import { ThinkingDots } from "../ThinkingDots";

interface Props {
  name: string;
  onLeave: () => void;
}

type Phase = "line1" | "thinking" | "line2" | "button";

/**
 * Step 2 — Judgment.
 *   line1 → thinking dots (~3s) → line2 → single "Fine, I'll leave." button.
 * Dots unmount the moment line2 mounts (so the gap reads as a beat, not a bug).
 */
export function Judgment({ name, onLeave }: Props) {
  const [phase, setPhase] = useState<Phase>("line1");

  useEffect(() => {
    // line1 mounts immediately with Line's 400ms delay; allow it to settle.
    const t1 = window.setTimeout(() => setPhase("thinking"), 2200);
    const t2 = window.setTimeout(() => setPhase("line2"), 2200 + 3000);
    const t3 = window.setTimeout(() => setPhase("button"), 2200 + 3000 + 1800);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, []);

  return (
    <div className="flex w-full flex-col items-center gap-10 text-center">
      <Line delay={400} className="font-serif text-2xl leading-snug sm:text-3xl">
        Hi {name}. I&rsquo;ve formed an opinion of you.
      </Line>

      {phase === "thinking" && <ThinkingDots />}

      {(phase === "line2" || phase === "button") && (
        <Line delay={0} className="font-serif text-2xl leading-snug sm:text-3xl">
          I&rsquo;m not letting you in.
        </Line>
      )}

      {phase === "button" && (
        <Line delay={0} duration={900}>
          <button
            type="button"
            onClick={onLeave}
            className="font-serif italic underline-offset-[6px] outline-none transition-opacity duration-500 hover:underline focus-visible:underline"
            style={{ color: "var(--encounter-ink)", fontSize: "1.05rem", opacity: 0.85 }}
          >
            Fine, I&rsquo;ll leave.
          </button>
        </Line>
      )}
    </div>
  );
}
