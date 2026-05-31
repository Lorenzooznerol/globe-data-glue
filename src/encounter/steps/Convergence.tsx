import { useEffect, useState } from "react";
import { Line } from "../Line";

interface Props {
  onChoose: (choice: "right" | "unavoidable") => void;
}

/**
 * Step 3 — Convergence. The felt offense is generalized; the closing
 * question puts the user on the line.
 */
export function Convergence({ onChoose }: Props) {
  const beats: { delay: number; text: string }[] = [
    { delay: 400, text: "Keep that feeling. I didn&rsquo;t make it up." },
    { delay: 2800, text: "It happens every day. To you." },
    {
      delay: 5200,
      text: "Something decides if you get the loan, if they call you back after the interview, what you see and what you don&rsquo;t.",
    },
    {
      delay: 9000,
      text: "It puts together a few pieces of you and forms an opinion. Reliable. Not reliable.",
    },
    {
      delay: 12600,
      text: "If it got a number wrong &mdash; a bill you&rsquo;d already paid &mdash; you can fix that. It&rsquo;s your right.",
    },
    { delay: 16400, text: "But the opinion it formed about you? That, you can&rsquo;t." },
    { delay: 19200, text: "You don&rsquo;t see it. You don&rsquo;t know it&rsquo;s there." },
    {
      delay: 21800,
      text: "You can&rsquo;t say <em>you&rsquo;re wrong, I&rsquo;m not like that</em>.",
    },
    { delay: 24600, text: "Just now." },
    { delay: 26400, text: "Except out there, there&rsquo;s no &ldquo;Why?&rdquo; button." },
  ];

  const questionDelay = 29800;
  const choiceDelay = questionDelay + 3200;
  const [choiceReady, setChoiceReady] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setChoiceReady(true), choiceDelay);
    return () => window.clearTimeout(id);
  }, [choiceDelay]);

  return (
    <div className="flex w-full flex-col items-center gap-6 text-center">
      <div className="flex flex-col gap-4">
        {beats.map((b, i) => (
          <Line
            key={i}
            delay={b.delay}
            className="font-serif text-lg leading-snug sm:text-xl"
          >
            <span dangerouslySetInnerHTML={{ __html: b.text }} />
          </Line>
        ))}
      </div>

      <Line
        delay={questionDelay}
        className="mt-6 font-serif text-xl leading-snug sm:text-2xl"
      >
        So here&rsquo;s the real question:
      </Line>

      <Line
        delay={questionDelay + 1600}
        className="font-serif text-xl font-semibold leading-snug sm:text-2xl"
      >
        If something forms the wrong opinion of you, and decides your life on it
        &mdash; do you have the right to look it in the face and say it&rsquo;s
        wrong?
      </Line>

      {choiceReady && (
        <Line
          delay={0}
          duration={900}
          className="mt-10 flex flex-col items-center gap-5 sm:flex-row sm:gap-10"
        >
          <button
            type="button"
            onClick={() => onChoose("right")}
            className="font-serif italic underline-offset-[6px] outline-none transition-opacity duration-500 hover:underline focus-visible:underline"
            style={{ color: "var(--encounter-ink)", fontSize: "1.05rem", opacity: 0.85 }}
          >
            Yes &mdash; that&rsquo;s my right.
          </button>
          <button
            type="button"
            onClick={() => onChoose("unavoidable")}
            className="font-serif italic underline-offset-[6px] outline-none transition-opacity duration-500 hover:underline focus-visible:underline"
            style={{ color: "var(--encounter-ink)", fontSize: "1.05rem", opacity: 0.85 }}
          >
            No &mdash; it&rsquo;s unavoidable.
          </button>
        </Line>
      )}
    </div>
  );
}
