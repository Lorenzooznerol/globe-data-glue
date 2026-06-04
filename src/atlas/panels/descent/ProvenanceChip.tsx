import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { EpistemicChip } from "@/atlas/panels/EpistemicChip";
import type { CountryOverlay, OverlaySource } from "@/data/types";

interface Props {
  level: string;
  sourceIds?: string;
  overlay: CountryOverlay;
  regRef?: string;
  asOf?: string;
}

export function ProvenanceChip({ level, sourceIds, overlay, regRef, asOf }: Props) {
  const ids = (sourceIds || "").split(";").map((s) => s.trim()).filter(Boolean);
  const sources: OverlaySource[] = ids
    .map((id) => overlay.sources.find((s) => s.source_id === id))
    .filter((s): s is OverlaySource => !!s);

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-ring"
            aria-label={`${level} — show ${sources.length} source${sources.length === 1 ? "" : "s"}`}
          >
            <EpistemicChip level={level} />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-[320px] border-border/60 bg-popover/95 p-3 backdrop-blur-md"
        >
          <p className="mono mb-2 text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
            {level} · {sources.length} {sources.length === 1 ? "source" : "sources"}
          </p>
          {sources.length === 0 ? (
            <p className="font-serif text-[12.5px] italic text-muted-foreground">
              No sources recorded.
            </p>
          ) : (
            <ul className="flex flex-col">
              {sources.map((s) => (
                <li
                  key={s.source_id}
                  className="border-t border-border/30 py-2 first:border-t-0 first:pt-0"
                >
                  <a
                    href={s.url ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-serif text-[12.5px] leading-snug text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground/60"
                  >
                    {s.title}
                  </a>
                  {s.publisher && (
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {s.publisher}
                      {s.pub_date ? ` · ${s.pub_date.slice(0, 4)}` : ""}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </PopoverContent>
      </Popover>
      {regRef && (
        <span className="mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground">
          {regRef}
        </span>
      )}
      {asOf && (
        <span className="mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground">
          {asOf}
        </span>
      )}
    </span>
  );
}
