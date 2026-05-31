import { useEffect, useState } from "react";
import { Line } from "../Line";
import { MultipliedLine } from "../MultipliedLine";

interface Props {
  onChoose: (choice: "right" | "unavoidable") => void;
}

/**
 * Step 4 — The turn. One line briefly multiplies into many; then the question.
 */
export function Turn({ onChoose }: Props) {
  const [showQuestion, setShowQuestion] = useState(false);
  const [showChoice, setShowChoice] = useState(false);

  // Timings (ms from mount).
  const LINE1 = 400;
  const LINE2 = 2800;
  const QUESTION = 5800;
  const CHOICE = QUESTION + 2200;

  useEffect(() => {
    const t1 = window.setTimeout(() => setShowQuestion(true), QUESTION);
    const t2 = window.setTimeout(() => setShowChoice(true), CHOICE);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [QUESTION, CHOICE]);

  return (
    <div className="flex w-full flex-col items-center gap-7 text-center">
      <Line delay={LINE1} className="font-serif text-lg leading-snug sm:text-xl">
        <MultipliedLine startDelay={700}>
          AI does this too. It forms an opinion of you.
        </MultipliedLine>
      </Line>

      <Line delay={LINE2} className="font-serif text-lg leading-snug sm:text-xl">
        The opinion it formed of you? You can&rsquo;t see it. Can&rsquo;t correct it.
      </Line>

      {showQuestion && (
        <Line
          delay={0}
          className="mt-6 font-serif text-xl font-semibold leading-snug sm:text-2xl"
        >
          It made up its mind about you. Do you get a say?
        </Line>
      )}

      {showChoice && (
        <Line
          delay={0}
          duration={900}
          className="mt-8 flex flex-col items-center gap-5 sm:flex-row sm:gap-10"
        >
          <button
            type="button"
            onClick={() => onChoose("right")}
            className="font-serif italic underline-offset-[6px] outline-none transition-opacity duration-500 hover:underline focus-visible:underline"
            style={{ color: "var(--encounter-ink)", fontSize: "1.05rem", opacity: 0.85 }}
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => onChoose("unavoidable")}
            className="font-serif italic underline-offset-[6px] outline-none transition-opacity duration-500 hover:underline focus-visible:underline"
            style={{ color: "var(--encounter-ink)", fontSize: "1.05rem", opacity: 0.85 }}
          >
            No
          </button>
        </Line>
      )}
    </div>
  );
}
