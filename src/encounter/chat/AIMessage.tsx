import { type ReactNode, useEffect, useState } from "react";
import { useAtlasStore } from "@/atlas/store";

interface Props {
  children: ReactNode;
  emphasis?: boolean;
  multiplied?: boolean;
  pulse?: boolean;
  onClick?: () => void;
}

/**
 * Left-aligned AI message. Plain row (no bubble) to feel like ChatGPT/Claude
 * assistant turns. Optional one-shot "multiplication" ghost effect and a
 * gentle pulse for the final tappable affordance.
 */
export function AIMessage({
  children,
  emphasis,
  multiplied,
  pulse,
  onClick,
}: Props) {
  const reduced = useAtlasStore((s) => s.reducedMotion);
  const [ghost, setGhost] = useState(false);

  useEffect(() => {
    if (!multiplied || reduced) return;
    const t1 = window.setTimeout(() => setGhost(true), 250);
    const t2 = window.setTimeout(() => setGhost(false), 1050);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [multiplied, reduced]);

  const base: React.CSSProperties = {
    color: "var(--encounter-ink)",
    opacity: 0,
    animation: reduced
      ? "encounter-fade-in 1ms linear forwards"
      : "encounter-fade-in 500ms ease-out forwards",
  };

  const className = [
    "font-serif leading-snug",
    emphasis ? "text-xl sm:text-2xl font-semibold" : "text-lg sm:text-xl",
    onClick ? "cursor-pointer hover:underline underline-offset-[6px]" : "",
    pulse && !reduced ? "encounter-pulse" : "",
  ].join(" ");

  const inner = (
    <span style={{ position: "relative", display: "inline-block" }}>
      {multiplied && !reduced && (
        <>
          <span
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              transform: "translate(-3px, -2px)",
              opacity: ghost ? 0.28 : 0,
              transition: "opacity 420ms ease-out",
              pointerEvents: "none",
            }}
          >
            {children}
          </span>
          <span
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              transform: "translate(3px, 2px)",
              opacity: ghost ? 0.28 : 0,
              transition: "opacity 420ms ease-out",
              pointerEvents: "none",
            }}
          >
            {children}
          </span>
        </>
      )}
      <span style={{ position: "relative" }}>{children}</span>
    </span>
  );

  return (
    <div className="flex w-full justify-start">
      {onClick ? (
        <button
          type="button"
          onClick={onClick}
          className={className}
          style={base}
        >
          {inner}
        </button>
      ) : (
        <p className={className} style={base}>
          {inner}
        </p>
      )}
    </div>
  );
}
