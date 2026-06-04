import { useMemo } from "react";
import type { CountryOverlay, OverlayClaim } from "@/data/types";
import { ProvenanceChip } from "@/atlas/panels/descent/ProvenanceChip";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { MiniRadar } from "./MiniRadar";
import type { EntityData } from "./graphModel";

interface Props {
  entity: EntityData | null;
  overlay: CountryOverlay;
  onClose: () => void;
  reducedMotion: boolean;
}

const KIND_LABEL: Record<string, string> = {
  baseline: "EU substrate",
  law: "National law",
  authority: "Authorities",
  criminal: "Criminal law",
  sectors: "Sectoral rules",
  programme: "Programme",
  morphology: "Morphology",
};

export function Inspector({ entity, overlay, onClose, reducedMotion }: Props) {
  const claimsById = useMemo(() => {
    const m = new Map<string, OverlayClaim>();
    for (const c of overlay.claims) m.set(c.claim_id, c);
    return m;
  }, [overlay.claims]);

  const open = !!entity;
  const claims = entity
    ? (entity.claimIds ?? []).map((id) => claimsById.get(id)).filter(Boolean) as OverlayClaim[]
    : [];

  return (
    <aside
      className="italy-inspector"
      data-open={open ? "true" : "false"}
      data-reduced={reducedMotion ? "true" : "false"}
      role="dialog"
      aria-label={entity ? `${entity.label} — inspector` : "inspector"}
      aria-hidden={!open}
    >
      {entity && (
        <>
          <header className="italy-inspector__head">
            <div>
              <p className="italy-inspector__kind">{KIND_LABEL[entity.kind] ?? entity.kind}</p>
              <h2 className="italy-inspector__title">{entity.label}</h2>
              {entity.subLabel && (
                <p className="italy-inspector__sub">{entity.subLabel}</p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              aria-label="Close inspector"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </header>

          <div className="italy-inspector__body">
            {entity.kind === "morphology" && (
              <div className="italy-inspector__radar">
                <MiniRadar coords={overlay.coordinates} />
              </div>
            )}

            {entity.kind === "sectors" && entity.sectors && (
              <ul className="italy-inspector__sectors">
                {entity.sectors.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            )}

            <ul className="italy-inspector__claims">
              {claims.map((c) => (
                <li key={c.claim_id} className="italy-inspector__claim">
                  <p className="italy-inspector__claim-text">{c.claim_text}</p>
                  <ProvenanceChip
                    level={c.epistemic_level}
                    sourceIds={c.source_ids}
                    overlay={overlay}
                    regRef={c.reg_ref}
                    asOf={c.as_of_date}
                  />
                </li>
              ))}
            </ul>

            {entity.flagToVerify && overlay.to_verify?.length > 0 && (
              <section className="italy-inspector__verify">
                <p className="italy-inspector__verify-head">To verify</p>
                <ul>
                  {overlay.to_verify.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </>
      )}
    </aside>
  );
}
