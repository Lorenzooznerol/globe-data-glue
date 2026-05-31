import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { DataStore } from "@/data/store";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

/**
 * Inline glossary highlighter. Scans text for any glossary term (case-insensitive,
 * whole-word, longest-match-first). Within a <TermScope>, each unique term is
 * chipped at most once, and the scope caps total highlights at MAX_PER_SCOPE so
 * sections don't turn into a minefield.
 */

const MAX_PER_SCOPE = 3;

type ScopeContext = {
  store: DataStore;
  used: Set<string>;
  count: { n: number };
};

const Ctx = createContext<ScopeContext | null>(null);

export function TermScope({
  store,
  children,
}: {
  store: DataStore;
  children: ReactNode;
}) {
  const ctx = useMemo<ScopeContext>(
    () => ({ store, used: new Set(), count: { n: 0 } }),
    // re-create per render so each render of a scope starts fresh
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store, children],
  );
  return <Ctx.Provider value={ctx}>{children}</Ctx.Provider>;
}

/** Renders a plain string, wrapping any glossary terms in dotted-underline chips. */
export function Term({ children }: { children: string }) {
  const ctx = useContext(Ctx);
  if (!ctx || typeof children !== "string") return <>{children}</>;
  return <>{renderWithTerms(children, ctx)}</>;
}

function renderWithTerms(text: string, ctx: ScopeContext): ReactNode[] {
  // Build sorted term list (longest first) once per scope render.
  const terms = [...ctx.store.glossaryByTerm.values()]
    .map((g) => g.term)
    .sort((a, b) => b.length - a.length);

  if (terms.length === 0) return [text];

  // Build a single combined regex with word boundaries; alternatives sorted longest-first.
  const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const re = new RegExp(`\\b(${escaped.join("|")})\\b`, "gi");

  const out: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const start = m.index;
    const end = start + m[0].length;
    const matched = m[0];
    const lcKey = matched.toLowerCase();

    if (start > lastIndex) out.push(text.slice(lastIndex, start));

    const def = ctx.store.glossaryByTerm.get(lcKey);
    const canChip = !!def && !ctx.used.has(lcKey) && ctx.count.n < MAX_PER_SCOPE;

    if (canChip && def) {
      ctx.used.add(lcKey);
      ctx.count.n += 1;
      out.push(
        <HoverCard key={`t-${key++}`} openDelay={120} closeDelay={80}>
          <HoverCardTrigger asChild>
            <span
              tabIndex={0}
              className="cursor-help underline decoration-dotted decoration-foreground/40 underline-offset-[3px] hover:decoration-foreground/80 focus:outline-none focus-visible:decoration-foreground"
              aria-label={`Definition of ${def.term}`}
            >
              {matched}
            </span>
          </HoverCardTrigger>
          <HoverCardContent
            side="top"
            align="start"
            className="w-72 border-border/70 bg-popover/95 p-3 backdrop-blur-md"
          >
            <p className="mono mb-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {def.term}
            </p>
            <p className="font-serif text-[13px] leading-snug text-foreground/95">
              {def.plain_definition}
            </p>
          </HoverCardContent>
        </HoverCard>,
      );
    } else {
      out.push(matched);
    }
    lastIndex = end;
  }
  if (lastIndex < text.length) out.push(text.slice(lastIndex));
  return out;
}
