import type { CountryOverlay } from "@/data/types";
import { AlertTriangle } from "lucide-react";
import { ClaimLine } from "../ClaimLine";
import { ProvenanceChip } from "../ProvenanceChip";
import { GoDeeper } from "../GoDeeper";

interface Props {
  overlay: CountryOverlay;
  onDeeper: () => void;
}

export function Layer2Authorities({ overlay, onDeeper }: Props) {
  const auth = overlay.claims.find((c) => c.claim_id === "C-IT-03");
  const indep = overlay.claims.find((c) => c.claim_id === "C-IT-09");
  const independenceFlag = overlay.node.independence_flag === true;

  return (
    <div>
      <h2 className="mono mb-5 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
        The Authorities
      </h2>
      <ul className="flex flex-col">
        {auth && <ClaimLine claim={auth} overlay={overlay} />}
      </ul>

      {independenceFlag && indep && (
        <div
          className="mt-6 flex items-start gap-3 border-l-2 pl-3"
          style={{ borderColor: "var(--epistemic-warn)" }}
          role="note"
        >
          <AlertTriangle
            className="mt-1 h-4 w-4 shrink-0"
            style={{ color: "var(--epistemic-warn)" }}
            aria-hidden
          />
          <div>
            <p
              className="font-serif text-[14px] leading-relaxed"
              style={{ color: "var(--epistemic-warn)" }}
            >
              Supervisors are government agencies, not independent authorities — a choice the
              Garante and the European Commission questioned.
            </p>
            <div className="mt-2">
              <ProvenanceChip
                level={indep.epistemic_level}
                sourceIds={indep.source_ids}
                overlay={overlay}
                regRef={indep.reg_ref}
                asOf={indep.as_of_date}
              />
            </div>
          </div>
        </div>
      )}

      <GoDeeper label="Next: Triggers" onClick={onDeeper} />
    </div>
  );
}
