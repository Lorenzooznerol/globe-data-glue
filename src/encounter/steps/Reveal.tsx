import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Line } from "../Line";

interface Props {
  choice: "right" | "unavoidable";
  onEnter: () => void;
}

/**
 * Step 4 — Reveal. Three jurisdictions, then the mirror.
 * The "96%" figure is a static placeholder.
 */
export function Reveal({ choice, onEnter }: Props) {
  const beats: { delay: number; text: string }[] = [
    { delay: 400, text: "Three places, three answers." },
    { delay: 2400, text: "Europe got closest." },
    {
      delay: 4400,
      text: "By law you can correct wrong facts about you, and a decision made by a machine on something that matters must offer you an explanation and a human to turn to.",
    },
    {
      delay: 9000,
      text: "(GDPR, and a recent EU Court ruling &mdash; the SCHUFA case.)",
    },
    {
      delay: 12000,
      text: "But the right to challenge the opinion itself is still a contested line, even there.",
    },
    {
      delay: 15600,
      text: "America tells you the reasons if you&rsquo;re denied credit &mdash; but arguing with the verdict is left to the market.",
    },
    {
      delay: 19600,
      text: "China lets you switch off and refuse the processing &mdash; but the State sets the frame, not you.",
    },
    {
      delay: 23600,
      text: "No one yet says: the opinion a system forms of you is yours, and you can prove it wrong.",
    },
  ];

  const mirrorStart = 27800;
  const linkDelay = mirrorStart + 9000;

  // TODO: real aggregate, not invented. Placeholder until backed by data.
  const AGGREGATE_PERCENT = 96;

  const chosePositive = choice === "right";
  const choiceLine = chosePositive
    ? "You chose: that&rsquo;s my right."
    : "You chose: it&rsquo;s unavoidable.";
  const mirrorLine = chosePositive
    ? `${AGGREGATE_PERCENT}% chose the same.`
    : `${AGGREGATE_PERCENT}% chose the opposite.`;

  // Persist nickname at this point — the user has reached the end.
  const [linkReady, setLinkReady] = useState(false);
  useEffect(() => {
    onEnter();
    const id = window.setTimeout(() => setLinkReady(true), linkDelay);
    return () => window.clearTimeout(id);
  }, [onEnter, linkDelay]);

  return (
    <div className="flex w-full flex-col items-center gap-5 text-center">
      {beats.map((b, i) => (
        <Line
          key={i}
          delay={b.delay}
          className="font-serif text-lg leading-snug sm:text-xl"
        >
          <span dangerouslySetInnerHTML={{ __html: b.text }} />
        </Line>
      ))}

      <Line
        delay={mirrorStart}
        className="mt-10 font-serif text-lg italic leading-snug sm:text-xl"
      >
        <span dangerouslySetInnerHTML={{ __html: choiceLine }} />
      </Line>
      <Line
        delay={mirrorStart + 1800}
        className="font-serif text-lg leading-snug sm:text-xl"
      >
        {mirrorLine}
      </Line>
      <Line
        delay={mirrorStart + 3800}
        className="font-serif text-lg leading-snug sm:text-xl"
      >
        {chosePositive
          ? "This time it’s not “the world is split.”"
          : "Most disagree — but the question stands."}
      </Line>
      <Line
        delay={mirrorStart + 5400}
        className="font-serif text-lg leading-snug sm:text-xl"
      >
        It’s that almost everyone wants the same thing — and no one has it yet.
      </Line>
      <Line
        delay={mirrorStart + 7000}
        className="font-serif text-lg italic leading-snug sm:text-xl"
      >
        The question was never technical. It’s the oldest one there is: the
        right to face your accuser. Only now the accuser is a machine — and it
        won’t even let you read the accusation.
      </Line>

      {linkReady && (
        <Line
          delay={0}
          duration={1200}
          className="mt-16 font-serif text-sm"
        >
          <Link
            to="/atlas"
            className="italic underline-offset-[6px] transition-opacity duration-500 hover:underline"
            style={{ color: "var(--encounter-ink-faint)" }}
          >
            continue
          </Link>
        </Line>
      )}
    </div>
  );
}
