import type { DataStore } from "@/data/store";
import type { NodeBanded, NodeVision } from "@/data/types";
import { useAtlasStore } from "@/atlas/store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { colorFor, splitMorphology, layerOf } from "@/atlas/morphology";
import { plainHeadline } from "@/atlas/plainLanguage";
import { AnalysisTab } from "./AnalysisTab";
import { DocumentsTab } from "./DocumentsTab";

interface Props {
  store: DataStore;
}

export function NodeCard({ store }: Props) {
  const selectedNodeId = useAtlasStore((s) => s.selectedNodeId);
  const selectNode = useAtlasStore((s) => s.selectNode);

  if (!selectedNodeId) return null;

  const banded = store.nodesBandedById.get(selectedNodeId);
  const vision = store.nodesVisionById.get(selectedNodeId);
  const node = banded ?? vision;
  if (!node) return null;

  const docs = store.documentsForNode(selectedNodeId);
  const hue = banded ? colorFor(banded.morphology) : "var(--muted-foreground)";
  const headline = banded ? plainHeadline(banded.morphology) : "";
  const layer = layerOf(selectedNodeId).toUpperCase();

  return (
    <aside
      className="pointer-events-auto fixed right-0 top-0 z-30 flex h-screen w-full max-w-[480px] flex-col border-l border-border/70 bg-background/95 backdrop-blur-md"
      role="dialog"
      aria-label={`${node.name} — atlas card`}
    >
      {/* Header */}
      <header className="relative shrink-0 border-b border-border/40 px-6 pb-5 pt-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => selectNode(null)}
          className="absolute right-3 top-3 h-7 w-7 text-muted-foreground hover:text-foreground"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </Button>
        <div className="mono mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          <span>{layer}</span>
          {banded?.region && (
            <>
              <span aria-hidden>·</span>
              <span>{banded.region}</span>
            </>
          )}
        </div>
        <h2 className="font-serif text-[26px] font-medium leading-tight tracking-tight text-foreground">
          {node.name}
        </h2>
        {headline && (
          <p className="mt-2 font-serif text-[14px] italic leading-snug" style={{ color: hue }}>
            {headline}
          </p>
        )}
      </header>

      {/* Tabs */}
      <Tabs defaultValue="analysis" className="flex min-h-0 flex-1 flex-col">
        <TabsList className="mx-6 mt-4 grid w-[calc(100%-3rem)] grid-cols-2 bg-secondary/40">
          <TabsTrigger value="analysis" className="font-serif">Analysis</TabsTrigger>
          <TabsTrigger value="documents" className="font-serif">
            Documents
            <span className="mono ml-2 text-[10px] text-muted-foreground">{docs.length}</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="analysis" className="m-0 flex-1 overflow-y-auto px-6 pb-8 pt-5">
          {banded ? (
            <AnalysisTab store={store} node={banded as NodeBanded} />
          ) : (
            <VisionAnalysis node={vision as NodeVision} />
          )}
        </TabsContent>
        <TabsContent value="documents" className="m-0 flex-1 overflow-y-auto px-6 pb-8 pt-5">
          <DocumentsTab documents={docs} />
        </TabsContent>
      </Tabs>
    </aside>
  );
}

function VisionAnalysis({ node }: { node: NodeVision }) {
  return (
    <div className="flex flex-col gap-6">
      <Field label="Source of authority" value={node.source_of_authority} />
      <Field label="Scope" value={node.scope} />
      <Field label="Mode of influence" value={node.mode_of_influence} />
      <Field label="Dated anchor" value={node.dated_anchor} />
      {node.notes && (
        <section>
          <h3 className="mono mb-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Notes
          </h3>
          <p className="font-serif text-[14px] italic leading-relaxed text-foreground/85">
            {node.notes}
          </p>
        </section>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <section>
      <h3 className="mono mb-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </h3>
      <p className="font-serif text-[14px] leading-relaxed text-foreground/90">{value}</p>
    </section>
  );
}

// Reference for type system
void splitMorphology;
