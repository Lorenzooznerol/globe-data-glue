import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { CountryOverlay, OverlayClaim, OverlaySource } from "@/data/types";
import { EpistemicChip } from "./EpistemicChip";

interface Props {
  overlay: CountryOverlay;
}

export function ClaimsProvenance({ overlay }: Props) {
  const sourcesById = new Map(overlay.sources.map((s) => [s.source_id, s]));
  if (!overlay.claims.length) return null;

  return (
    <section>
      <h3 className="mono mb-3 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        Claims &amp; provenance
      </h3>
      <ul className="flex flex-col">
        {overlay.claims.map((c) => (
          <ClaimRow key={c.claim_id} claim={c} sourcesById={sourcesById} />
        ))}
      </ul>
    </section>
  );
}

function ClaimRow({
  claim,
  sourcesById,
}: {
  claim: OverlayClaim;
  sourcesById: Map<string, OverlaySource>;
}) {
  const ids = (claim.source_ids || "")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
  const sources = ids
    .map((id) => sourcesById.get(id))
    .filter((s): s is OverlaySource => !!s);

  return (
    <li className="border-t border-border/30 py-3 first:border-t-0 first:pt-0">
      <p className="font-serif text-[13.5px] leading-relaxed text-foreground/90">
        {claim.claim_text}
      </p>
      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-ring"
              aria-label={`${claim.epistemic_level} — show sources`}
            >
              <EpistemicChip level={claim.epistemic_level} />
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-[320px] border-border/60 bg-popover/95 p-3 backdrop-blur-md"
          >
            <p className="mono mb-2 text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
              {claim.epistemic_level} · {sources.length}{" "}
              {sources.length === 1 ? "source" : "sources"}
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
        {claim.reg_ref && (
          <span className="mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground">
            {claim.reg_ref}
          </span>
        )}
        {claim.as_of_date && (
          <span className="mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground">
            {claim.as_of_date}
          </span>
        )}
      </div>
    </li>
  );
}
