import { MORPH_COLOR, MORPH_LABEL, MORPH_ORDER, type MorphCode } from "@/atlas/morphology";
import { useAtlasStore } from "@/atlas/store";
import { cn } from "@/lib/utils";

export function Legend() {
  const morphFilter = useAtlasStore((s) => s.filters.morphologies);
  const toggle = useAtlasStore((s) => s.toggleMorphology);
  const clear = useAtlasStore((s) => s.clearMorphologyFilter);

  return (
    <div className="pointer-events-auto rounded-md border border-border/70 bg-card/80 px-3 py-2 backdrop-blur-md">
      <div className="mb-2 flex items-center justify-between gap-4">
        <span className="mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          morphology
        </span>
        {morphFilter.size > 0 && (
          <button
            onClick={clear}
            className="mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            clear
          </button>
        )}
      </div>
      <ul className="grid grid-cols-1 gap-1">
        {MORPH_ORDER.map((m) => {
          const active = morphFilter.size === 0 || morphFilter.has(m);
          return (
            <li key={m}>
              <button
                onClick={() => toggle(m as MorphCode)}
                className={cn(
                  "group flex w-full items-center gap-2 text-left transition-opacity",
                  active ? "opacity-100" : "opacity-40 hover:opacity-80",
                )}
              >
                <span
                  className="h-2.5 w-2.5 rounded-[1px]"
                  style={{ background: MORPH_COLOR[m] }}
                  aria-hidden
                />
                <span className="mono text-[10px] uppercase tracking-wider text-foreground/85">
                  {m}
                </span>
                <span className="text-[11px] text-muted-foreground">{MORPH_LABEL[m]}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
