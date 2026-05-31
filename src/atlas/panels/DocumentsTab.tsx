import type { Source } from "@/data/types";

interface Props {
  documents: Source[];
}

export function DocumentsTab({ documents }: Props) {
  if (documents.length === 0) {
    return (
      <p className="mono text-[11px] uppercase tracking-wider text-muted-foreground">
        No documents recorded for this node.
      </p>
    );
  }

  return (
    <ul className="flex flex-col">
      {documents.map((s) => {
        const year = (s.pub_date ?? "").slice(0, 4);
        const unverified = s.url_status && s.url_status !== "verified";
        return (
          <li
            key={s.source_id}
            className="border-t border-border/40 py-3 first:border-t-0 first:pt-0"
          >
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block font-serif text-[14px] leading-snug text-foreground/95 underline decoration-border underline-offset-4 hover:decoration-foreground/60"
            >
              {s.title}
            </a>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
              <span>{s.publisher || "—"}</span>
              {year && <><span aria-hidden>·</span><span>{year}</span></>}
              {s.source_type && (
                <span className="mono inline-block border border-border/60 px-1.5 py-[1px] text-[9px] uppercase tracking-[0.15em]">
                  {s.source_type}
                </span>
              )}
              {s.reliability && (
                <span className="mono inline-block border border-border/60 px-1.5 py-[1px] text-[9px] uppercase tracking-[0.15em]">
                  {s.reliability}
                </span>
              )}
              {unverified && (
                <span className="mono inline-block border border-amber-400/40 px-1.5 py-[1px] text-[9px] uppercase tracking-[0.15em] text-amber-300/80">
                  unverified
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
