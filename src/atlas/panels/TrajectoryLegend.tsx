import { DirectionGlyph } from "./DirectionGlyph";
import { useAtlasStore } from "@/atlas/store";
import type { GlyphKind } from "@/atlas/trajectory";

const ROWS: { kind: GlyphKind; label: string }[] = [
  { kind: "stability", label: "Holds" },
  { kind: "enactment", label: "Moving to binding law" },
  { kind: "lag", label: "In force, lagging" },
  { kind: "durability", label: "Erodes" },
  { kind: "refinement", label: "Tests the framework" },
];

export function TrajectoryLegend() {
  const reducedMotion = useAtlasStore((s) => s.reducedMotion);
  const playMigrations = useAtlasStore((s) => s.playMigrations);
  return (
    <div className="flex flex-col gap-3">
      <span className="mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        Trajectory
      </span>
      <ul className="flex flex-col gap-2">
        {ROWS.map((r) => (
          <li key={r.kind} className="grid grid-cols-[20px_1fr] items-center gap-x-3">
            <DirectionGlyph kind={r.kind} color="hsl(var(--foreground) / 0.75)" size={16} reducedMotion={reducedMotion} />
            <span className="font-serif text-[12px] text-foreground/85">{r.label}</span>
          </li>
        ))}
      </ul>
      <button
        onClick={playMigrations}
        className="mono mt-1 self-start border border-border/60 px-2 py-1 text-[9px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
      >
        Play migrations
      </button>
      <p className="font-serif text-[11px] italic leading-snug text-muted-foreground/80">
        Glyph color follows the morphology family.
      </p>
    </div>
  );
}
