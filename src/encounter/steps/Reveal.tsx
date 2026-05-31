import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Line } from "../Line";

interface Props {
  choice: "right" | "unavoidable";
  onEnter: () => void;
}

/**
 * Step 5 — Mirror & the three answers. Short, quiet, then a single
 * low-contrast affordance into the atlas.
 */
export function Reveal({ choice, onEnter }: Props) {
  // TODO: real aggregate, not invented.
  const AGGREGATE_PERCENT = 96;

  const chosePositive = choice === "right";
  const choiceLine = chosePositive
    ? "You chose: yes."
    : "You chose: no.";
  const mirrorLine = chosePositive
    ? `${AGGREGATE_PERCENT}% chose the same.`
    : `${AGGREGATE_PERCENT}% chose the opposite.`;

  const LINK_DELAY = 11800;
  const [linkReady, setLinkReady] = useState(false);

  useEffect(() => {
    onEnter();
    const id = window.setTimeout(() => setLinkReady(true), LINK_DELAY);
    return () => window.clearTimeout(id);
  }, [onEnter]);

  return (
    <div className="flex w-full flex-col items-center gap-5 text-center">
      <Line delay={400} className="font-serif text-lg leading-snug sm:text-xl">
        {choiceLine}
      </Line>
      <Line delay={2000} className="font-serif text-lg leading-snug sm:text-xl">
        {mirrorLine}
      </Line>
      <Line delay={3800} className="font-serif text-lg leading-snug sm:text-xl">
        Almost everyone wants this &mdash; and no one has it yet.
      </Line>

      <Line
        delay={6200}
        className="mt-8 max-w-[36rem] font-serif text-sm leading-relaxed sm:text-base"
      >
        <span style={{ color: "var(--encounter-ink-faint)" }}>
          Europe comes closest &mdash; correct what&rsquo;s wrong, get a reason
          from a machine (GDPR; SCHUFA). The opinion itself: still contested.
        </span>
      </Line>
      <Line
        delay={8400}
        className="max-w-[36rem] font-serif text-sm leading-relaxed sm:text-base"
      >
        <span style={{ color: "var(--encounter-ink-faint)" }}>
          America tells you why you were refused; the rest is the market. China
          lets you switch it off; the State sets the rules.
        </span>
      </Line>

      {linkReady && (
        <Line delay={0} duration={1200} className="mt-16 font-serif text-sm">
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
