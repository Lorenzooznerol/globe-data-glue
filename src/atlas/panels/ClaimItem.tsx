import { useState } from "react";
import type { Claim, Source } from "@/data/types";
import { cn } from "@/lib/utils";

interface Props {
  claim: Claim;
  sources: Source[];
}

const TAG_STYLE: Record<string, string> = {
  VERIFIED: "text-emerald-300/90 border-emerald-300/40",
  ATTESTED: "text-sky-300/90 border-sky-300/40",
  INFERRED: "text-amber-300/90 border-amber-300/40",
};

export function ClaimItem({ claim, sources }: Props) {
  const [open, setOpen] = useState(false);
  const tagClass = TAG_STYLE[claim.epistemic_level] ?? "text-foreground/70 border-border";

  return (
    <li className="border-t border-border/40 py-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-3 text-left"
      >
        <span
          className={cn(
            "mono mt-0.5 inline-flex shrink-0 items-center border px-1.5 py-0.5 text-[9px] uppercase tracking-[0.18em]",
            tagClass,
          )}
        >
          {claim.epistemic_level || "—"}
        </span>
        <span className="flex-1">
          <span className="block text-[13px] leading-snug text-foreground/90">
            {claim.claim_text}
          </span>
          <span className="mono mt-1 block text-[10px] uppercase tracking-wider text-muted-foreground">
            {claim.as_of_date} · {claim.claim_id} · {sources.length} source{sources.length === 1 ? "" : "s"}
          </span>
        </span>
        <span className="mono mt-0.5 text-[10px] text-muted-foreground">
          {open ? "−" : "+"}
        </span>
      </button>

      {open && (
        <ul className="mt-3 space-y-2 border-l border-border/50 pl-3">
          {sources.length === 0 && (
            <li className="mono text-[10px] uppercase tracking-wider text-muted-foreground">
              no resolved sources
            </li>
          )}
          {sources.map((s) => (
            <li key={s.source_id}>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-[12px] leading-snug text-foreground/90 hover:underline"
              >
                {s.title}
              </a>
              <div className="mono mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                {s.publisher} · {s.source_type} · {s.reliability} · {s.url_status}
              </div>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
