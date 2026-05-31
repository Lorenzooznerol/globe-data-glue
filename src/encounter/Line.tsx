import { type ReactNode, useEffect, useState } from "react";
import { useAtlasStore } from "@/atlas/store";

interface LineProps {
  delay?: number;
  duration?: number;
  className?: string;
  children: ReactNode;
  as?: "p" | "div" | "span" | "h1" | "h2";
}

/**
 * A single fade-in line. Mounts hidden, fades to opacity 1 after `delay`.
 * Reduced-motion: snap to visible, but keep the same `delay` so pacing is
 * preserved (silence carries the emotion).
 */
export function Line({
  delay = 0,
  duration = 900,
  className = "",
  children,
  as: Tag = "p",
}: LineProps) {
  const reduced = useAtlasStore((s) => s.reducedMotion);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setVisible(true), delay);
    return () => window.clearTimeout(id);
  }, [delay]);

  return (
    <Tag
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transition: reduced ? "none" : `opacity ${duration}ms ease-out`,
        willChange: "opacity",
      }}
    >
      {children}
    </Tag>
  );
}
