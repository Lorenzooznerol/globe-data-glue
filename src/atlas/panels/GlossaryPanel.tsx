import { useMemo, useState } from "react";
import { BookOpen } from "lucide-react";
import type { DataStore } from "@/data/store";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";

interface Props {
  store: DataStore;
}

export function GlossaryPanel({ store }: Props) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return store.glossaryList;
    return store.glossaryList.filter(
      (g) =>
        g.term.toLowerCase().includes(needle) ||
        g.plain_definition.toLowerCase().includes(needle),
    );
  }, [q, store.glossaryList]);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          className="mono inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
          aria-label="Open glossary"
        >
          <BookOpen className="h-3 w-3" aria-hidden />
          <span>Glossary</span>
        </button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full max-w-[420px] border-l border-border/70 bg-background/95 backdrop-blur-md"
      >
        <SheetHeader className="text-left">
          <SheetTitle className="font-serif text-[22px] font-medium tracking-tight">
            Glossary
          </SheetTitle>
          <SheetDescription className="text-[12px] text-muted-foreground">
            Plain-language definitions for every term used in the atlas.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-5">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter terms…"
            className="mono text-[12px]"
            aria-label="Filter glossary"
          />
        </div>
        <ul className="mt-5 max-h-[calc(100vh-220px)] divide-y divide-border/40 overflow-y-auto pr-1">
          {filtered.map((g) => (
            <li key={g.term} className="py-3 first:pt-0">
              <p className="mono mb-1 text-[10px] uppercase tracking-[0.18em] text-foreground/90">
                {g.term}
              </p>
              <p className="font-serif text-[13.5px] leading-snug text-foreground/85">
                {g.plain_definition}
              </p>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="mono py-4 text-[11px] uppercase tracking-wider text-muted-foreground">
              No matching terms.
            </li>
          )}
        </ul>
      </SheetContent>
    </Sheet>
  );
}
