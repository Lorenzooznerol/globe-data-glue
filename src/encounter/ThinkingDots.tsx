import { useAtlasStore } from "@/atlas/store";

/**
 * Three dots that pulse independently. Mount/unmount controlled by parent —
 * unmounting cleanly is the design: the next line fades in immediately so the
 * absence reads as the beat ending, not a bug.
 */
export function ThinkingDots() {
  const reduced = useAtlasStore((s) => s.reducedMotion);
  const dots = [0, 1, 2];
  return (
    <div
      className="flex items-center justify-center gap-3"
      aria-label="thinking"
      role="status"
    >
      {dots.map((i) => (
        <span
          key={i}
          aria-hidden
          style={{
            display: "inline-block",
            width: "6px",
            height: "6px",
            borderRadius: "9999px",
            background: "var(--encounter-ink-faint)",
            opacity: reduced ? 0.6 : 0.2,
            animation: reduced
              ? undefined
              : `encounter-dot-pulse 1400ms ease-in-out ${i * 250}ms infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes encounter-dot-pulse {
          0%, 100% { opacity: 0.18; }
          50% { opacity: 0.9; }
        }
      `}</style>
    </div>
  );
}
