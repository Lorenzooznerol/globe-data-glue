import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { DataStore } from "@/data/store";
import type { AtlasNode, GlossaryTerm } from "@/data/types";

interface Props {
  store: DataStore;
  node: AtlasNode;
}

function gatherText(node: AtlasNode): string {
  const parts: (string | undefined | null)[] = [
    node.headline,
    node.summary,
    node.notes,
    node.morphology_plain,
    node.paper_plain,
    node.reality_plain,
    node.vision?.notes,
    node.vision?.source_of_authority,
    node.vision?.scope,
    node.vision?.mode_of_influence,
    node.vision?.dated_anchor,
  ];
  return parts.filter(Boolean).join("\n");
}

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function NodeGlossary({ store, node }: Props) {
  const [open, setOpen] = useState(false);

  const terms = useMemo<GlossaryTerm[]>(() => {
    const text = gatherText(node);
    if (!text) return [];
    const all = [...store.glossaryByTerm.values()];
    if (all.length === 0) return [];
    const sorted = all.slice().sort((a, b) => b.term.length - a.term.length);
    const escaped = sorted.map((g) => escapeRe(g.term));
    const re = new RegExp(`\\b(${escaped.join("|")})\\b`, "gi");
    const found = new Set<string>();
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      found.add(m[0].toLowerCase());
    }
    return sorted
      .filter((g) => found.has(g.term.toLowerCase()))
      .sort((a, b) => a.term.localeCompare(b.term));
  }, [store, node]);

  if (terms.length === 0) return null;

  const iso = node.iso3 ?? node.part_of_iso3 ?? null;

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="mono inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
      >
        <span>Glossary ({terms.length})</span>
        <ChevronDown
          className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {open && (
        <ul className="mt-3 divide-y divide-border/40 border-t border-border/40">
          {terms.map((g) => {
            const nuance =
              iso && g.country_nuance ? g.country_nuance[iso] : undefined;
            return (
              <li key={g.term} className="py-3">
                <p className="mono mb-1 text-[10px] uppercase tracking-[0.18em] text-foreground/90">
                  {g.term}
                </p>
                <p className="font-serif text-[13px] leading-snug text-foreground/85">
                  {g.plain_definition}
                </p>
                {nuance && (
                  <p className="mt-1.5 font-serif text-[12.5px] italic leading-snug text-foreground/75">
                    <span className="mono mr-1 text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground">
                      In this country
                    </span>
                    {nuance}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
