import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAtlasStore } from "@/atlas/store";
import type { DataStore } from "@/data/store";
import { cn } from "@/lib/utils";

interface Props {
  store: DataStore;
}

export function LibraryView({ store }: Props) {
  const open = useAtlasStore((s) => s.libraryOpen);
  const close = useAtlasStore((s) => s.closeLibrary);
  const tab = useAtlasStore((s) => s.libraryTab);
  const setTab = useAtlasStore((s) => s.setLibraryTab);
  const selectNode = useAtlasStore((s) => s.selectNode);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="h-[88vh] max-w-[1100px] overflow-hidden border-border/70 bg-card/95 p-0 backdrop-blur-md">
        <DialogHeader className="flex flex-row items-baseline justify-between border-b border-border/60 px-6 py-4">
          <div>
            <DialogTitle className="font-serif text-xl tracking-tight">Library</DialogTitle>
            <p className="mono mt-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              sources & claims · audit trail
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(["sources", "claims"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "mono border px-3 py-1.5 text-[10px] uppercase tracking-[0.18em]",
                  tab === t
                    ? "border-foreground/70 text-foreground"
                    : "border-border/60 text-muted-foreground hover:text-foreground",
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </DialogHeader>

        <div className="h-[calc(88vh-77px)] overflow-y-auto">
          {tab === "sources" ? (
            <SourcesTab store={store} />
          ) : (
            <ClaimsTab
              store={store}
              onJump={(nodeId) => {
                selectNode(nodeId);
                close();
              }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SourcesTab({ store }: { store: DataStore }) {
  const [q, setQ] = useState("");
  const [type, setType] = useState<string>("");
  const [reliability, setReliability] = useState<string>("");

  const types = useMemo(
    () => Array.from(new Set(store.raw.sources.map((s) => s.source_type).filter(Boolean))).sort(),
    [store],
  );
  const reliabilities = useMemo(
    () => Array.from(new Set(store.raw.sources.map((s) => s.reliability).filter(Boolean))).sort(),
    [store],
  );

  // Reverse join: source_id -> claim_ids
  const reverse = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const c of store.raw.claims) {
      for (const sid of c.source_ids) {
        const arr = m.get(sid) ?? [];
        arr.push(c.claim_id);
        m.set(sid, arr);
      }
    }
    return m;
  }, [store]);

  const filtered = store.raw.sources.filter((s) => {
    if (type && s.source_type !== type) return false;
    if (reliability && s.reliability !== reliability) return false;
    if (q) {
      const needle = q.toLowerCase();
      if (
        !s.title.toLowerCase().includes(needle) &&
        !s.publisher.toLowerCase().includes(needle) &&
        !s.topic.toLowerCase().includes(needle)
      )
        return false;
    }
    return true;
  });

  return (
    <div className="p-6">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="search title, publisher, topic…"
          className="mono h-9 w-72 text-[12px]"
        />
        <Select label="type" value={type} onChange={setType} options={types} />
        <Select label="reliability" value={reliability} onChange={setReliability} options={reliabilities} />
        <span className="mono ml-auto text-[10px] uppercase tracking-wider text-muted-foreground">
          {filtered.length} / {store.raw.sources.length}
        </span>
      </div>

      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="mono border-b border-border/60 text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
            <th className="py-2 pr-3 font-normal">id</th>
            <th className="py-2 pr-3 font-normal">title</th>
            <th className="py-2 pr-3 font-normal">publisher</th>
            <th className="py-2 pr-3 font-normal">date</th>
            <th className="py-2 pr-3 font-normal">type</th>
            <th className="py-2 pr-3 font-normal">reliability</th>
            <th className="py-2 pr-3 font-normal">cited by</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((s) => {
            const cites = reverse.get(s.source_id) ?? [];
            return (
              <tr key={s.source_id} className="border-b border-border/30 align-top">
                <td className="mono py-2 pr-3 text-[10px] text-muted-foreground">{s.source_id}</td>
                <td className="py-2 pr-3 text-[12px]">
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {s.title}
                  </a>
                </td>
                <td className="mono py-2 pr-3 text-[10px] text-muted-foreground">{s.publisher}</td>
                <td className="mono py-2 pr-3 text-[10px] text-muted-foreground">{s.pub_date}</td>
                <td className="mono py-2 pr-3 text-[10px] text-muted-foreground">{s.source_type}</td>
                <td className="mono py-2 pr-3 text-[10px] text-muted-foreground">{s.reliability}</td>
                <td className="mono py-2 pr-3 text-[10px] text-muted-foreground">{cites.length}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ClaimsTab({
  store,
  onJump,
}: {
  store: DataStore;
  onJump: (nodeId: string) => void;
}) {
  const [q, setQ] = useState("");
  const [epi, setEpi] = useState<string>("");

  const epiLevels = useMemo(
    () =>
      Array.from(new Set(store.raw.claims.map((c) => c.epistemic_level).filter(Boolean))).sort(),
    [store],
  );

  const filtered = store.raw.claims.filter((c) => {
    if (epi && c.epistemic_level !== epi) return false;
    if (q && !c.claim_text.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-6">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="search claim text…"
          className="mono h-9 w-72 text-[12px]"
        />
        <Select label="epistemic" value={epi} onChange={setEpi} options={epiLevels} />
        <span className="mono ml-auto text-[10px] uppercase tracking-wider text-muted-foreground">
          {filtered.length} / {store.raw.claims.length}
        </span>
      </div>

      <ul className="divide-y divide-border/40">
        {filtered.map((c) => {
          const node = store.getNode(c.node_id);
          return (
            <li key={c.claim_id} className="py-3">
              <div className="mono mb-1 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                <span>{c.claim_id}</span>
                <span aria-hidden>·</span>
                <button
                  onClick={() => onJump(c.node_id)}
                  className="text-foreground/85 hover:underline"
                >
                  {c.node_id}
                </button>
                <span aria-hidden>·</span>
                <span>{c.epistemic_level}</span>
                <span aria-hidden>·</span>
                <span>{c.as_of_date}</span>
                <span aria-hidden>·</span>
                <span>{c.source_ids.length} src</span>
              </div>
              <p className="text-[13px] leading-snug text-foreground/90">{c.claim_text}</p>
              {node && "name" in node && (
                <p className="mono mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                  → {node.name}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="mono inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mono h-9 border border-border/60 bg-background px-2 text-[11px] text-foreground"
      >
        <option value="">all</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
