import { DirectionGlyph } from "./DirectionGlyph";
import { useAtlasStore } from "@/atlas/store";
import type { GlyphKind } from "@/atlas/trajectory";

const ROWS: { kind: GlyphKind; label: string; hint: string }[] = [
  { kind: "holds", label: "Holds", hint: "Steady under pressure" },
  { kind: "rising", label: "Rising", hint: "Moving into binding force" },
  { kind: "eroding", label: "Eroding", hint: "Promises fraying" },
];

export function TrajectoryLegend() {
  const reducedMotion = useAtlasStore((s) => s.reducedMotion);
  return (
    <div className="flex flex-col gap-3">
      <span className="mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        Direction
      </span>
      <ul className="flex flex-col gap-2.5">
        {ROWS.map((r) => (
          <li key={r.kind} className="grid grid-cols-[22px_1fr] items-center gap-x-3">
            <DirectionGlyph
              kind={r.kind}
              color="hsl(var(--foreground) / 0.85)"
              size={18}
              reducedMotion={reducedMotion}
            />
            <span className="flex flex-col leading-tight">
              <span className="font-serif text-[12.5px] text-foreground/90">{r.label}</span>
              <span className="font-serif text-[10.5px] italic text-muted-foreground">
                {r.hint}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
