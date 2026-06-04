import type { CountryOverlay, OverlayClaim } from "@/data/types";
import { ProvenanceChip } from "./ProvenanceChip";

interface Props {
  claim: OverlayClaim;
  overlay: CountryOverlay;
}

export function ClaimLine({ claim, overlay }: Props) {
  return (
    <li className="border-t border-border/30 py-3 first:border-t-0 first:pt-0">
      <p className="font-serif text-[14px] leading-relaxed text-foreground/90">
        {claim.claim_text}
      </p>
      <div className="mt-2">
        <ProvenanceChip
          level={claim.epistemic_level}
          sourceIds={claim.source_ids}
          overlay={overlay}
          regRef={claim.reg_ref}
          asOf={claim.as_of_date}
        />
      </div>
    </li>
  );
}
