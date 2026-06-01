import type { DataStore } from "@/data/store";
import { useAtlasStore } from "@/atlas/store";
import { colorForNode } from "@/atlas/families";
import { layerOf } from "@/atlas/morphology";

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
        <aside className="pointer-events-auto mt-2 min-h-0 flex-1 overflow-y-auto rounded-md border border-border/50 bg-background/90 p-4 backdrop-blur-md">
          {SECTIONS.map((section) => {
            const rows = store.atlas.nodes
              .filter((n) => layerOf(n.node_id) === section.layer)
              .map((n) => ({ id: n.node_id, name: n.name, hue: colorForNode(n) }));
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
  rows: { id: string; name: string; hue: string }[];
  onPick: (id: string) => void;
}) {
  return (
    <section className="mb-4 last:mb-0">
      <h3 className="mono mb-2 text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </h3>
      <ul className="flex flex-col gap-1">
        {rows.map((r) => (
          <li key={r.id}>
            <button
              onClick={() => onPick(r.id)}
              className="grid w-full grid-cols-[8px_1fr] items-baseline gap-x-2 text-left font-serif text-[13px] text-foreground/85 hover:text-foreground"
            >
              <span
                className="mt-[5px] block h-1.5 w-1.5 rounded-[1px]"
                style={{ background: r.hue }}
              />
              <span>{r.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
