import { useAtlasStore } from "@/atlas/store";
import type { Layer } from "@/atlas/morphology";

const LAYERS: { key: Layer; label: string }[] = [
  { key: "state", label: "States" },
  { key: "actor", label: "Actors" },
  { key: "vision", label: "Legitimacy" },
];

export function LayerFilter() {
  const layers = useAtlasStore((s) => s.layers);
  const toggle = useAtlasStore((s) => s.toggleLayer);
  const reducedMotion = useAtlasStore((s) => s.reducedMotion);
  const setReducedMotion = useAtlasStore((s) => s.setReducedMotion);

  return (
    <div className="flex flex-col gap-3">
      <span className="mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        Show
      </span>
      <ul className="flex flex-col gap-1.5">
        {LAYERS.map((l) => {
          const on = layers.has(l.key);
          return (
            <li key={l.key}>
              <button
                onClick={() => toggle(l.key)}
                className="mono w-full whitespace-nowrap border px-3 py-1.5 text-left text-[10.5px] uppercase tracking-[0.18em]"
                style={{
                  borderColor: on ? "rgba(180,190,210,0.4)" : "rgba(120,130,150,0.18)",
                  color: on ? "var(--foreground)" : "var(--muted-foreground)",
                  background: on ? "rgba(40,46,56,0.5)" : "transparent",
                }}
              >
                {l.label}
              </button>
            </li>
          );
        })}
      </ul>
      <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <input
          type="checkbox"
          checked={reducedMotion}
          onChange={(e) => setReducedMotion(e.target.checked)}
          className="h-3 w-3 accent-foreground"
        />
        <span className="font-serif italic">Reduced motion</span>
      </label>
    </div>
  );
}
