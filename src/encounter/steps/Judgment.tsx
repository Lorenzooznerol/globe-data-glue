import { useEffect, useState } from "react";
import { Line } from "../Line";

interface Props {
  name: string;
  onWhy: () => void;
  onLeave: () => void;
}

/**
 * Step 2 — Judgment. Two lines reveal, then two buttons.
 * Name stays pinned at the top (handled by the Encounter shell).
 */
export function Judgment({ name, onWhy, onLeave }: Props) {
  const [buttonsReady, setButtonsReady] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setButtonsReady(true), 3600);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <div className="flex w-full flex-col items-center gap-10 text-center">
      <div className="flex flex-col gap-6">
        <Line delay={400} className="font-serif text-2xl leading-snug sm:text-3xl">
          Hi {name}. I&rsquo;ve formed an opinion of you.
        </Line>
        <Line delay={2000} className="font-serif text-2xl leading-snug sm:text-3xl">
          I&rsquo;m not letting you in.
        </Line>
      </div>

      {buttonsReady && (
        <Line delay={0} duration={900} className="flex flex-col items-center gap-5 sm:flex-row sm:gap-10">
          <EncounterButton onClick={onWhy}>Why?</EncounterButton>
          <EncounterButton onClick={onLeave}>Fine, I&rsquo;ll leave.</EncounterButton>
        </Line>
      )}
    </div>
  );
}

function EncounterButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="font-serif italic underline-offset-[6px] outline-none transition-opacity duration-500 hover:underline focus-visible:underline disabled:cursor-default"
      style={{
        color: "var(--encounter-ink)",
        fontSize: "1.05rem",
        opacity: disabled ? 0.35 : 0.85,
      }}
    >
      {children}
    </button>
  );
}
