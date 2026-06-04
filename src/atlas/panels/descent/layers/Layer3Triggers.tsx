import type { CountryOverlay } from "@/data/types";
import { ClaimLine } from "../ClaimLine";
import { GoDeeper } from "../GoDeeper";

const LAYER_CLAIMS = ["C-IT-04", "C-IT-05", "C-IT-06", "C-IT-07", "C-IT-08"];

interface Props {
  overlay: CountryOverlay;
  onDeeper: () => void;
}

export function Layer3Triggers({ overlay, onDeeper }: Props) {
  const claims = LAYER_CLAIMS
    .map((id) => overlay.claims.find((c) => c.claim_id === id))
    .filter((c): c is NonNullable<typeof c> => !!c);

  return (
    <div>
      <h2 className="mono mb-5 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
        The Triggers
      </h2>
      <ul className="flex flex-col">
        {claims.map((c) => (
          <ClaimLine key={c.claim_id} claim={c} overlay={overlay} />
        ))}
      </ul>
      <GoDeeper label="Deepest: Coordinates" onClick={onDeeper} />
    </div>
  );
}
