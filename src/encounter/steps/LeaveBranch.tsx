import { useEffect, useState } from "react";
import { Line } from "../Line";

interface Props {
  onContinue: () => void;
}

/**
 * Step 3 — Locked door & branch.
 * The "leave" button stays visible but inert; a Why? button appears beside it.
 * Tapping Why? reveals one line, then advances to the Turn step.
 */
export function LeaveBranch({ onContinue }: Props) {
  const [showButtons, setShowButtons] = useState(false);
  const [clickedWhy, setClickedWhy] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setShowButtons(true), 1000 + 1400);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!clickedWhy) return;
    const t = window.setTimeout(onContinue, 2600);
    return () => window.clearTimeout(t);
  }, [clickedWhy, onContinue]);

  return (
    <div className="flex w-full flex-col items-center gap-10 text-center">
      <Line
        delay={1000}
        className="font-serif text-xl leading-snug sm:text-2xl"
      >
        You&rsquo;re leaving without asking why.
      </Line>

      {showButtons && !clickedWhy && (
        <Line
          delay={0}
          duration={900}
          className="flex flex-col items-center gap-5 sm:flex-row sm:gap-10"
        >
          <button
            type="button"
            onClick={() => setClickedWhy(true)}
            className="font-serif italic underline-offset-[6px] outline-none transition-opacity duration-500 hover:underline focus-visible:underline"
            style={{ color: "var(--encounter-ink)", fontSize: "1.05rem", opacity: 0.85 }}
          >
            Why?
          </button>
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="font-serif italic outline-none disabled:cursor-default"
            style={{ color: "var(--encounter-ink)", fontSize: "1.05rem", opacity: 0.3 }}
          >
            Fine, I&rsquo;ll leave.
          </button>
        </Line>
      )}

      {clickedWhy && (
        <Line delay={400} className="font-serif text-xl leading-snug sm:text-2xl">
          I formed an opinion and acted on it.
        </Line>
      )}
    </div>
  );
}
