import { useState } from "react";
import type { DataStore } from "@/data/store";
import { useAtlasStore } from "@/atlas/store";
import { colorFor } from "@/atlas/morphology";

interface Props {
  store: DataStore;
}

const SECTIONS = [
  { layer: "actor" as const, label: "Actors (companies)" },
  { layer: "deployer" as const, label: "Deployers (archetypes)" },
  { layer: "vision" as const, label: "Legitimacy" },
];

export function SideIndex({ store }: Props) {
  const open = useAtlasStore((s) => s.sideIndexOpen);
  const layers = useAtlasStore((s) => s.layers);
  const toggle = useAtlasStore((s) => s.toggleSideIndex);
  const selectNode = useAtlasStore((s) => s.selectNode);

  return (
    <>
      <button
        onClick={toggle}
        className="pointer-events-auto mono rounded-md border border-border/50 bg-background/85 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-foreground/80 backdrop-blur-md hover:text-foreground"
      >
        {open ? "× Index" : "Index"}
      </button>
      {open && (
        <aside className="pointer-events-auto mt-2 max-h-[70vh] w-72 overflow-y-auto rounded-md border border-border/50 bg-background/90 p-4 backdrop-blur-md">
          {SECTIONS.filter((s) => layers.has(s.layer)).map((section) => {
            const rows =
              section.layer === "vision"
                ? store.raw.nodesVision.map((n) => ({ id: n.node_id, name: n.name, hue: undefined as string | undefined }))
                : store.raw.nodesBanded
                    .filter((n) => n.layer === section.layer)
                    .map((n) => ({ id: n.node_id, name: n.name, hue: colorFor(n.morphology) }));
            if (rows.length === 0) return null;
            return (
              <Section
                key={section.layer}
                label={section.label}
                rows={rows}
                onPick={(id) => selectNode(id, { fly: false })}
              />
            );
          })}
        </aside>
      )}
    </>
  );
}

function Section({
  label,
  rows,
  onPick,
}: {
  label: string;
  rows: { id: string; name: string; hue?: string }[];
  onPick: (id: string) => void;
}) {
  const [open, setOpen] = useState(true);
  return (
    <section className="mb-4 last:mb-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="mono mb-2 flex w-full items-center justify-between text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
      >
        <span>{label}</span>
        <span aria-hidden>{open ? "−" : "+"}</span>
      </button>
      {open && (
        <ul className="flex flex-col">
          {rows.map((r) => (
            <li key={r.id}>
              <button
                onClick={() => onPick(r.id)}
                className="flex w-full items-center gap-2.5 py-1.5 text-left text-[13px] text-foreground/85 hover:text-foreground"
              >
                {r.hue && (
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: r.hue }}
                  />
                )}
                <span className="font-serif leading-snug">{r.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
