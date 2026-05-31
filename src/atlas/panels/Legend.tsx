import { useAtlasStore } from "@/atlas/store";
import {
  FAMILY_COLOR,
  FAMILY_GLOSS,
  FAMILY_LABEL,
  FAMILY_ORDER,
  type Family,
} from "@/atlas/families";

export function Legend() {
  const families = useAtlasStore((s) => s.families);
  const toggle = useAtlasStore((s) => s.toggleFamily);
  const clear = useAtlasStore((s) => s.clearFamilies);
  const active = families.size > 0;

  return (
    <div className="flex flex-col gap-3">
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
      <ul className="flex flex-col gap-2.5">
        {FAMILY_ORDER.map((f: Family) => {
          const on = families.has(f);
          const dimmed = active && !on;
          return (
            <li key={f}>
              <button
                onClick={() => toggle(f)}
                className="grid w-full grid-cols-[10px_1fr] items-baseline gap-x-3 text-left"
                style={{ opacity: dimmed ? 0.35 : 1 }}
              >
                <span
                  className="mt-[5px] block h-2.5 w-2.5 rounded-[1px]"
                  style={{ background: FAMILY_COLOR[f] }}
                />
                <span className="flex flex-col leading-tight">
                  <span className="font-serif text-[13px] text-foreground/95">
                    {FAMILY_LABEL[f]}
                  </span>
                  <span className="font-serif text-[11.5px] italic text-muted-foreground">
                    {FAMILY_GLOSS[f]}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="pl-[22px] font-serif text-[11px] italic text-muted-foreground/80">
        Grey = not assessable from outside.
      </p>
    </div>
  );
}
