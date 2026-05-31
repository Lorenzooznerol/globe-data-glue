import { useEffect, useState } from "react";
import { Line } from "../Line";

interface Props {
  onContinue: () => void;
  onStay: () => void;
}

/**
 * "Fine, I'll leave" branch.
 *  - First tap on the leave button did nothing (handled by parent).
 *  - We now reveal the callback. After all lines settle, the user must tap
 *    the other button. We expose that affordance via `onStay` (which the
 *    parent wires to a button that re-enters the Why branch / converges).
 */
export function LeaveBranch({ onContinue, onStay }: Props) {
  const [stayReady, setStayReady] = useState(false);

  const beats = [
    { delay: 1000, text: "See that?" },
    { delay: 2800, text: "You were about to walk away without even asking why." },
    { delay: 5400, text: "Stay. Tap the other one." },
  ];

  const lastDelay = beats[beats.length - 1].delay;

  useEffect(() => {
    const id = window.setTimeout(() => setStayReady(true), lastDelay + 1400);
    return () => window.clearTimeout(id);
  }, [lastDelay]);

  return (
    <div className="flex w-full flex-col items-center gap-8 text-center">
      <div className="flex flex-col gap-5">
        {beats.map((b, i) => (
          <Line
            key={i}
            delay={b.delay}
            className="font-serif text-lg leading-snug sm:text-xl"
          >
            {b.text}
          </Line>
        ))}
      </div>

      {stayReady && (
        <Line delay={0} duration={900}>
          <button
            type="button"
            onClick={() => {
              onStay();
              onContinue();
            }}
            className="font-serif italic underline-offset-[6px] outline-none transition-opacity duration-500 hover:underline focus-visible:underline"
            style={{ color: "var(--encounter-ink)", fontSize: "1.05rem", opacity: 0.85 }}
          >
            Why?
          </button>
        </Line>
      )}
    </div>
  );
}
