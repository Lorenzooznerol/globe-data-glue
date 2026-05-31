import { type ReactNode, useEffect, useState } from "react";
import { useAtlasStore } from "@/atlas/store";

interface Props {
  children: ReactNode;
  className?: string;
  /** Delay before the multiplication begins (after the line itself is visible). */
  startDelay?: number;
}

/**
 * Renders a line, then briefly multiplies it: two faint, slightly-offset
 * copies fade in behind the text and fade back out. Pure opacity. The one
 * voice becomes many, then settles back into one.
 */
export function MultipliedLine({
  children,
  className = "",
  startDelay = 300,
}: Props) {
  const reduced = useAtlasStore((s) => s.reducedMotion);
  const [phase, setPhase] = useState<"idle" | "in" | "out">("idle");

  useEffect(() => {
    if (reduced) return;
    const t1 = window.setTimeout(() => setPhase("in"), startDelay);
    const t2 = window.setTimeout(() => setPhase("out"), startDelay + 700);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [reduced, startDelay]);

  const ghostOpacity = phase === "in" ? 0.28 : 0;
  const ghostStyle = (dx: number, dy: number): React.CSSProperties => ({
    position: "absolute",
    inset: 0,
    transform: `translate(${dx}px, ${dy}px)`,
    opacity: reduced ? 0 : ghostOpacity,
    transition: "opacity 420ms ease-out",
    color: "var(--encounter-ink)",
    pointerEvents: "none",
  });

  return (
    <div className={`relative ${className}`}>
      <span aria-hidden style={ghostStyle(-3, -2)}>
        {children}
      </span>
      <span aria-hidden style={ghostStyle(3, 2)}>
        {children}
      </span>
      <span style={{ position: "relative" }}>{children}</span>
    </div>
  );
}
