import { useAtlasStore } from "@/atlas/store";
import { cn } from "@/lib/utils";
import type { Layer } from "@/atlas/morphology";

const LAYERS: { key: Layer; label: string }[] = [
  { key: "state", label: "States" },
  { key: "actor", label: "Actors" },
  { key: "deployer", label: "Deployers" },
  { key: "vision", label: "Vision" },
];

export function FilterRail() {
  const layers = useAtlasStore((s) => s.filters.layers);
  const rings = useAtlasStore((s) => s.rings);
  const toggleLayer = useAtlasStore((s) => s.toggleLayer);
  const toggleRing = useAtlasStore((s) => s.toggleRing);
  const openLibrary = useAtlasStore((s) => s.openLibrary);
  const reducedMotion = useAtlasStore((s) => s.reducedMotion);
  const setReducedMotion = useAtlasStore((s) => s.setReducedMotion);

  return (
    <aside className="pointer-events-auto flex w-[260px] flex-col gap-5 rounded-md border border-border/70 bg-card/80 p-4 backdrop-blur-md">
      <header>
        <h1 className="text-base font-medium tracking-tight">Atlas of AI governance</h1>
        <p className="mono mt-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          informational layer · v0.1
        </p>
      </header>

      <Section title="layers">
        <ul className="space-y-1.5">
          {LAYERS.map((l) => {
            const on = layers.has(l.key);
            return (
              <li key={l.key}>
                <button
                  onClick={() => toggleLayer(l.key)}
                  className={cn(
                    "group flex w-full items-center justify-between border-b border-border/40 pb-1 text-left transition-opacity",
                    on ? "opacity-100" : "opacity-40 hover:opacity-80",
                  )}
                >
                  <span className="text-[13px]">{l.label}</span>
                  <span className="mono text-[9px] uppercase tracking-wider text-muted-foreground">
                    {on ? "on" : "off"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section title="rings">
        {(
          [
            ["actors", "Actor ring"],
            ["deployers", "Deployer ring"],
            ["vision", "Vision halo"],
          ] as const
        ).map(([k, label]) => (
          <ToggleRow
            key={k}
            label={label}
            on={rings[k]}
            onToggle={() => toggleRing(k)}
          />
        ))}
      </Section>

      <Section title="library">
        <button
          onClick={() => openLibrary("sources")}
          className="mono w-full border border-border/60 px-3 py-2 text-left text-[11px] uppercase tracking-wider text-foreground/85 hover:bg-accent"
        >
          Open sources & claims →
        </button>
      </Section>

      <Section title="motion">
        <ToggleRow
          label="Reduce motion"
          on={reducedMotion}
          onToggle={() => setReducedMotion(!reducedMotion)}
        />
      </Section>
    </aside>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mono mb-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {title}
      </h2>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function ToggleRow({ label, on, onToggle }: { label: string; on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "flex w-full items-center justify-between border-b border-border/40 pb-1 text-left transition-opacity",
        on ? "opacity-100" : "opacity-40 hover:opacity-80",
      )}
    >
      <span className="text-[13px]">{label}</span>
      <span className="mono text-[9px] uppercase tracking-wider text-muted-foreground">
        {on ? "on" : "off"}
      </span>
    </button>
  );
}
