import { useMemo, useState } from "react";
import type { DataStore } from "@/data/store";
import { useAtlasStore } from "@/atlas/store";
import { Input } from "@/components/ui/input";
import { layerOf } from "@/atlas/morphology";
import { NODE_TO_ISO3 } from "@/atlas/iso";

interface Props {
  store: DataStore;
}

export function SearchCommand({ store }: Props) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const selectNode = useAtlasStore((s) => s.selectNode);

  const all = useMemo(() => {
    return [
      ...store.raw.nodesBanded.map((n) => ({ id: n.node_id, name: n.name, kind: n.layer })),
      ...store.raw.nodesVision.map((n) => ({ id: n.node_id, name: n.name, kind: "vision" })),
    ];
  }, [store]);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return [] as typeof all;
    return all
      .filter((n) => n.name.toLowerCase().includes(needle) || n.id.toLowerCase().includes(needle))
      .slice(0, 8);
  }, [q, all]);

  return (
    <div className="pointer-events-auto relative w-[320px]">
      <Input
        type="search"
        placeholder="Search a country, company, or vision…"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="h-9 border-border/60 bg-background/85 font-serif text-[13px] backdrop-blur-md placeholder:font-serif placeholder:italic"
      />
      {open && results.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-y-auto rounded-md border border-border/60 bg-background/95 backdrop-blur-md">
          {results.map((r) => {
            const hasGeo = layerOf(r.id) === "state" && !!NODE_TO_ISO3[r.id];
            return (
              <li key={r.id}>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    selectNode(r.id, { fly: hasGeo });
                    setQ("");
                    setOpen(false);
                  }}
                  className="flex w-full items-baseline justify-between gap-3 px-3 py-2 text-left hover:bg-accent/40"
                >
                  <span className="font-serif text-[13px] text-foreground/95">{r.name}</span>
                  <span className="mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                    {r.kind}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
