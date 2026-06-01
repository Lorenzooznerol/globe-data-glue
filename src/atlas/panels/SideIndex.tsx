import { useMemo, useState } from "react";
import type { DataStore } from "@/data/store";
import { useAtlasStore } from "@/atlas/store";
import { colorForNode } from "@/atlas/families";
import { layerOf } from "@/atlas/morphology";
import { SegmentedTabs } from "./SegmentedTabs";

interface Props {
  store: DataStore;
}

type TabKey = "actor" | "deployer" | "vision";

const TABS: { key: TabKey; label: string }[] = [
  { key: "actor", label: "Actors" },
  { key: "deployer", label: "Deployers" },
  { key: "vision", label: "Legitimacy" },
];

export function SideIndex({ store }: Props) {
  const open = useAtlasStore((s) => s.sideIndexOpen);
  const toggle = useAtlasStore((s) => s.toggleSideIndex);
  const selectNode = useAtlasStore((s) => s.selectNode);
  const [tab, setTab] = useState<TabKey>("actor");

  const rowsByLayer = useMemo(() => {
    const map = new Map<TabKey, { id: string; name: string; hue: string }[]>();
    for (const t of TABS) {
      map.set(
        t.key,
        store.atlas.nodes
          .filter((n) => layerOf(n.node_id) === t.key)
          .map((n) => ({ id: n.node_id, name: n.name, hue: colorForNode(n) })),
      );
    }
    return map;
  }, [store]);

  const tabsWithCount = TABS.map((t) => ({
    ...t,
    count: rowsByLayer.get(t.key)?.length ?? 0,
  }));

  const rows = rowsByLayer.get(tab) ?? [];

  return (
    <>
      <button
        onClick={toggle}
        className="pointer-events-auto mono rounded-md border border-border/50 bg-background/85 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-foreground/80 backdrop-blur-md hover:text-foreground"
      >
        {open ? "× Index" : "Index"}
      </button>
      {open && (
        <aside className="pointer-events-auto mt-2 flex min-h-0 flex-1 flex-col rounded-md border border-border/50 bg-background/90 backdrop-blur-md">
          <div className="shrink-0 p-3 pb-2">
            <SegmentedTabs
              tabs={tabsWithCount}
              value={tab}
              onChange={setTab}
              ariaLabel="Index sections"
            />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-1">
            <ul className="flex flex-col gap-1">
              {rows.map((r) => (
                <li key={r.id}>
                  <button
                    onClick={() => selectNode(r.id, { fly: false })}
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
              {rows.length === 0 && (
                <li className="mono py-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                  Nothing here yet.
                </li>
              )}
            </ul>
          </div>
        </aside>
      )}
    </>
  );
}
