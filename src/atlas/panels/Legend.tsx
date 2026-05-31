import { useAtlasStore } from "@/atlas/store";
import { MORPH_COLOR, MORPH_ORDER, MORPH_LABEL, type MorphCode } from "@/atlas/morphology";
import { MORPH_HEADLINE } from "@/atlas/plainLanguage";

export function Legend() {
  const morphologies = useAtlasStore((s) => s.morphologies);
  const toggle = useAtlasStore((s) => s.toggleMorphology);
  const clear = useAtlasStore((s) => s.clearMorphologies);
  const active = morphologies.size > 0;

  return (
    <div className="pointer-events-auto flex flex-col gap-2.5 rounded-md border border-border/50 bg-background/85 p-3.5 backdrop-blur-md">
      <div className="flex items-center justify-between">
        <span className="mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Shape of governance
        </span>
        {active && (
          <button
            onClick={clear}
            className="mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
          >
            clear
          </button>
        )}
      </div>
      <ul className="flex flex-col gap-1.5">
        {MORPH_ORDER.map((m: MorphCode) => {
          const on = morphologies.has(m);
          const dimmed = active && !on;
          return (
            <li key={m}>
              <button
                onClick={() => toggle(m)}
                title={MORPH_HEADLINE[m]}
                className="flex w-full items-center gap-2.5 text-left"
                style={{ opacity: dimmed ? 0.35 : 1 }}
              >
                <span
                  className="h-2.5 w-2.5 rounded-[1px]"
                  style={{ background: MORPH_COLOR[m] }}
                />
                <span className="font-serif text-[12px] leading-tight text-foreground/90">
                  {MORPH_LABEL[m]}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
