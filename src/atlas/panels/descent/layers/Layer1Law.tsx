import type { CountryOverlay } from "@/data/types";
import { ClaimLine } from "../ClaimLine";
import { GoDeeper } from "../GoDeeper";

const LAYER_CLAIMS = ["C-IT-01", "C-IT-02", "C-IT-03"];

interface Props {
  overlay: CountryOverlay;
  onDeeper: () => void;
}

export function Layer1Law({ overlay, onDeeper }: Props) {
  const claims = LAYER_CLAIMS
    .map((id) => overlay.claims.find((c) => c.claim_id === id))
    .filter((c): c is NonNullable<typeof c> => !!c);
  const docs = overlay.readable.documents ?? [];

  return (
    <div>
      <SectionTitle>The Law</SectionTitle>
      {overlay.readable.how_it_works && (
        <p className="mb-6 font-serif text-[14.5px] leading-relaxed text-foreground/85">
          {overlay.readable.how_it_works}
        </p>
      )}
      <ul className="flex flex-col">
        {claims.map((c) => (
          <ClaimLine key={c.claim_id} claim={c} overlay={overlay} />
        ))}
      </ul>
      {docs.length > 0 && (
        <section className="mt-6 border-t border-border/40 pt-4">
          <h4 className="mono mb-3 text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
            Primary documents
          </h4>
          <ul className="flex flex-col">
            {docs.map((d) => {
              const s = overlay.sources.find((x) => x.source_id === d.source_id);
              if (!s) return null;
              return (
                <li
                  key={d.source_id}
                  className="border-t border-border/30 py-2 first:border-t-0 first:pt-0"
                >
                  <a
                    href={s.url ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-serif text-[13px] leading-snug text-foreground/90 underline decoration-border underline-offset-4 hover:decoration-foreground/60"
                  >
                    {d.label || s.title}
                  </a>
                  {s.publisher && (
                    <p className="mt-0.5 text-[10.5px] text-muted-foreground">
                      {s.publisher}
                      {s.pub_date ? ` · ${s.pub_date.slice(0, 4)}` : ""}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
      <GoDeeper label="Next: Authorities" onClick={onDeeper} />
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mono mb-5 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
      {children}
    </h2>
  );
}
