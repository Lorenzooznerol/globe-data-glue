import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import type { DataStore } from "@/data/store";
import type { NodeBanded, NodeVision } from "@/data/types";
import { useAtlasStore } from "@/atlas/store";
import { Signature } from "@/atlas/signature/Signature";
import { ClaimItem } from "./ClaimItem";
import { MORPH_COLOR, MORPH_LABEL, layerOf, splitMorphology } from "@/atlas/morphology";

interface Props {
  store: DataStore;
}

export function NodePanel({ store }: Props) {
  const selectedId = useAtlasStore((s) => s.selectedNodeId);
  const selectNode = useAtlasStore((s) => s.selectNode);

  const open = !!selectedId;
  const node = selectedId
    ? store.nodesBandedById.get(selectedId) ?? store.nodesVisionById.get(selectedId) ?? null
    : null;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && selectNode(null)}>
      <SheetContent
        side="right"
        className="w-[440px] max-w-[92vw] overflow-y-auto border-l border-border/70 bg-card/95 backdrop-blur-md sm:max-w-[440px]"
      >
        {node ? (
          isVision(node) ? (
            <VisionPanelBody node={node as NodeVision} />
          ) : (
            <BandedPanelBody store={store} node={node as NodeBanded} />
          )
        ) : (
          <SheetHeader>
            <SheetTitle>Select a node</SheetTitle>
            <SheetDescription>Click a marker on the globe.</SheetDescription>
          </SheetHeader>
        )}
      </SheetContent>
    </Sheet>
  );
}

function isVision(n: NodeBanded | NodeVision): n is NodeVision {
  return layerOf(n.node_id) === "vision";
}

function BandedPanelBody({ store, node }: { store: DataStore; node: NodeBanded }) {
  const { primary } = splitMorphology(node.morphology);
  const morphColor = primary ? MORPH_COLOR[primary] : "#888";
  const morphLabel = primary ? MORPH_LABEL[primary] : "—";
  const claims = store.claimsForNode(node.node_id);
  const layerTag = (node.layer ?? layerOf(node.node_id)).toUpperCase();

  return (
    <div className="flex flex-col gap-6 pt-2">
      <SheetHeader className="space-y-2 p-0">
        <div className="mono flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          <span>{node.node_id}</span>
          <span aria-hidden>·</span>
          <span>{layerTag}</span>
          {node.region && (
            <>
              <span aria-hidden>·</span>
              <span>{node.region}</span>
            </>
          )}
        </div>
        <SheetTitle className="font-serif text-2xl leading-tight tracking-tight">
          {node.name}
        </SheetTitle>
        <SheetDescription className="sr-only">
          Governance morphology and claims for {node.name}.
        </SheetDescription>
      </SheetHeader>

      <section className="flex items-center gap-3">
        <span
          className="mono inline-flex items-center gap-2 border px-2 py-1 text-[10px] uppercase tracking-[0.18em]"
          style={{ color: morphColor, borderColor: morphColor + "55" }}
        >
          <span className="h-1.5 w-1.5 rounded-[1px]" style={{ background: morphColor }} aria-hidden />
          {node.morphology} · {morphLabel}
        </span>
        {node.sub_mechanism && (
          <span className="mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {node.sub_mechanism}
          </span>
        )}
      </section>

      <section>
        <h3 className="mono mb-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          intent → reality
        </h3>
        <div className="flex items-center gap-4 rounded-md border border-border/60 bg-background/40 p-3">
          <div style={{ color: morphColor }}>
            <Signature node={node} />
          </div>
          <div className="flex flex-col gap-1.5">
            <BandRow label="paper" value={node.paper_band} />
            <BandRow label="reality" value={node.realization_band} />
            <BandRow label="evidence" value={node.evidence_strength} />
            {node.epistemic_level && <BandRow label="epistemic" value={node.epistemic_level} />}
          </div>
        </div>
      </section>

      <section>
        <h3 className="mono mb-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          claims · {claims.length}
        </h3>
        {claims.length === 0 ? (
          <p className="mono text-[10px] uppercase tracking-wider text-muted-foreground">
            no claims recorded
          </p>
        ) : (
          <ul>
            {claims.map((c) => (
              <ClaimItem key={c.claim_id} claim={c} sources={store.getSources(c.source_ids)} />
            ))}
          </ul>
        )}
      </section>

      {node.notes && (
        <section>
          <h3 className="mono mb-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            notes
          </h3>
          <p className="text-[13px] italic leading-relaxed text-muted-foreground">{node.notes}</p>
        </section>
      )}
    </div>
  );
}

function VisionPanelBody({ node }: { node: NodeVision }) {
  return (
    <div className="flex flex-col gap-6 pt-2">
      <SheetHeader className="space-y-2 p-0">
        <div className="mono flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          <span>{node.node_id}</span>
          <span aria-hidden>·</span>
          <span>VISION</span>
        </div>
        <SheetTitle className="font-serif text-2xl leading-tight tracking-tight">
          {node.name}
        </SheetTitle>
        <SheetDescription className="sr-only">Legitimacy vision node.</SheetDescription>
      </SheetHeader>

      <dl className="grid grid-cols-1 gap-3">
        <Field label="source of authority" value={node.source_of_authority} />
        <Field label="scope" value={node.scope} />
        <Field label="mode of influence" value={node.mode_of_influence} />
        <Field label="dated anchor" value={node.dated_anchor} />
      </dl>

      {node.notes && (
        <section>
          <h3 className="mono mb-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            notes
          </h3>
          <p className="text-[13px] italic leading-relaxed text-muted-foreground">{node.notes}</p>
        </section>
      )}
    </div>
  );
}

function BandRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="mono flex items-baseline gap-2 text-[10px] uppercase tracking-[0.18em]">
      <span className="w-16 text-muted-foreground">{label}</span>
      <span className="text-foreground/95">{value || "—"}</span>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="border-t border-border/40 pt-2">
      <dt className="mono mb-0.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </dt>
      <dd className="text-[13px] text-foreground/90">{value}</dd>
    </div>
  );
}
