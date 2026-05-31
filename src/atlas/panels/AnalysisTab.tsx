import { useState } from "react";
import type { NodeBanded } from "@/data/types";
import type { DataStore } from "@/data/store";
import { colorFor, splitMorphology, MORPH_COLOR, MORPH_LABEL } from "@/atlas/morphology";
import {
  SUBMECH_PLAIN,
  gapGloss,
  plainMorph,
} from "@/atlas/plainLanguage";
import { BandMeter } from "./BandMeter";

interface Props {
  store: DataStore;
  node: NodeBanded;
}

export function AnalysisTab({ store, node }: Props) {
  const hue = colorFor(node.morphology);
  const { primary, secondary } = splitMorphology(node.morphology);
  const morphSentence = plainMorph(node.morphology);
  const subPlain = node.sub_mechanism ? SUBMECH_PLAIN[node.sub_mechanism] : "";

  const claims = store.claimsForNode(node.node_id);
  const latestClaim = claims[0];
  const trajectory = node.notes || latestClaim?.claim_text || "";

  const subFederal: NodeBanded[] =
    node.node_id === "ST-US"
      ? (["ST-US-CA", "ST-US-CO"]
          .map((id) => store.nodesBandedById.get(id))
          .filter((n): n is NodeBanded => !!n))
      : [];

  return (
    <div className="flex flex-col gap-7">
      {/* 1. What shape this takes */}
      <section>
        <h3 className="mono mb-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          What shape this takes
        </h3>
        <p
          className="font-serif text-[15px] leading-relaxed"
          style={{ color: hue }}
        >
          {morphSentence}
        </p>
        {subPlain && (
          <p className="mt-1.5 font-serif text-[13px] italic leading-relaxed text-foreground/75">
            {subPlain}
          </p>
        )}
        {secondary && (
          <p className="mono mt-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            also exhibits · {MORPH_LABEL[secondary]}
          </p>
        )}
      </section>

      {/* 2. On paper vs in practice */}
      {(node.paper_band || node.realization_band) && (
        <section>
          <h3 className="mono mb-3 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            On paper vs in practice
          </h3>
          <div className="flex flex-col gap-4">
            <BandMeter label="on paper" bandCode={node.paper_band} hue={hue} />
            <BandMeter label="in practice" bandCode={node.realization_band} hue={hue} />
          </div>
          <p className="mt-3 font-serif text-[13px] italic leading-relaxed text-foreground/75">
            {gapGloss(node.paper_band, node.realization_band)}
          </p>
        </section>
      )}

      {/* 3. What to expect */}
      {trajectory && (
        <section>
          <h3 className="mono mb-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            What to expect
          </h3>
          <p className="font-serif text-[14px] leading-relaxed text-foreground/90">
            {trajectory}
          </p>
        </section>
      )}

      {/* 4. Key facts */}
      {claims.length > 0 && (
        <section>
          <h3 className="mono mb-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Key facts
          </h3>
          <ul className="flex flex-col">
            {claims.map((c) => (
              <li key={c.claim_id} className="border-t border-border/40 py-2.5 first:border-t-0 first:pt-0">
                <p className="font-serif text-[13.5px] leading-snug text-foreground/95">
                  {c.claim_text}
                </p>
                <p className="mono mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                  {c.as_of_date}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Sub-federal (US only) */}
      {subFederal.length > 0 && (
        <section>
          <h3 className="mono mb-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Sub-federal
          </h3>
          <ul className="flex flex-col gap-3">
            {subFederal.map((s) => (
              <li key={s.node_id} className="border-l-2 pl-3" style={{ borderColor: colorFor(s.morphology) }}>
                <p className="font-serif text-[14px] text-foreground/95">{s.name}</p>
                <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">
                  {s.notes}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 5. Technical detail (collapsed) */}
      <TechnicalDetail node={node} primary={primary} secondary={secondary} />
    </div>
  );
}

function TechnicalDetail({
  node,
  primary,
  secondary,
}: {
  node: NodeBanded;
  primary: ReturnType<typeof splitMorphology>["primary"];
  secondary: ReturnType<typeof splitMorphology>["secondary"];
}) {
  const [open, setOpen] = useState(false);
  return (
    <section className="border-t border-border/40 pt-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mono flex w-full items-center justify-between text-[10px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
      >
        <span>Technical detail</span>
        <span aria-hidden>{open ? "−" : "+"}</span>
      </button>
      {open && (
        <dl className="mono mt-3 grid grid-cols-[120px_1fr] gap-y-2 text-[11px]">
          <Row k="node_id" v={node.node_id} />
          <Row k="layer" v={node.layer} />
          <Row k="morphology" v={node.morphology + (primary ? ` (${primary}${secondary ? "+" + secondary : ""})` : "")} mono-v />
          <Row k="sub_mechanism" v={node.sub_mechanism} />
          <Row k="paper_band" v={node.paper_band} />
          <Row k="realization_band" v={node.realization_band} />
          <Row k="realization_mode" v={node.realization_mode} />
          <Row k="epistemic_level" v={node.epistemic_level} />
          <Row k="evidence_strength" v={node.evidence_strength} />
          {primary && (
            <Row
              k="color"
              v={MORPH_COLOR[primary]}
            />
          )}
        </dl>
      )}
    </section>
  );
}

function Row({ k, v }: { k: string; v: string; "mono-v"?: boolean }) {
  if (!v) return null;
  return (
    <>
      <dt className="uppercase tracking-[0.15em] text-muted-foreground">{k}</dt>
      <dd className="text-foreground/90">{v}</dd>
    </>
  );
}
