import { useAtlasStore } from "@/atlas/store";
import type { Layer } from "@/atlas/morphology";

const LAYERS: { key: Layer; label: string }[] = [
  { key: "state", label: "States" },
  { key: "actor", label: "Actors" },
  { key: "deployer", label: "Deployers" },
  { key: "vision", label: "Legitimacy" },
];

export function LayerFilter() {
  const layers = useAtlasStore((s) => s.layers);
  const toggle = useAtlasStore((s) => s.toggleLayer);
  const reducedMotion = useAtlasStore((s) => s.reducedMotion);
  const setReducedMotion = useAtlasStore((s) => s.setReducedMotion);

  return (
    <div className="pointer-events-auto flex flex-col gap-2 rounded-md border border-border/50 bg-background/85 p-3 backdrop-blur-md">
      <span className="mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        Show
      </span>
      <ul className="flex flex-wrap gap-1.5">
        {LAYERS.map((l) => {
          const on = layers.has(l.key);
          return (
            <li key={l.key}>
              <button
                onClick={() => toggle(l.key)}
                className="mono border px-2 py-1 text-[10px] uppercase tracking-[0.15em]"
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
      <label className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
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
