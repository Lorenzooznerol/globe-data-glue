import { createFileRoute } from "@tanstack/react-router";
import { useDataStore } from "@/data/useDataStore";
import { Atlas } from "@/atlas/components/Atlas";
import { FilterRail } from "@/atlas/panels/FilterRail";
import { Legend } from "@/atlas/panels/Legend";
import { NodePanel } from "@/atlas/panels/NodePanel";
import { LibraryView } from "@/atlas/panels/LibraryView";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Atlas of AI Governance" },
      {
        name: "description",
        content: "An instrument-grade 3D atlas of world AI governance morphologies.",
      },
      { property: "og:title", content: "Atlas of AI Governance" },
      {
        property: "og:description",
        content: "An instrument-grade 3D atlas of world AI governance morphologies.",
      },
    ],
  }),
  component: AtlasPage,
});

function AtlasPage() {
  const { data: store, isLoading, error } = useDataStore();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <span className="mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          loading instrument…
        </span>
      </div>
    );
  }
  if (error || !store) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <span className="mono text-[11px] uppercase tracking-[0.2em] text-destructive">
          failed to load: {(error as Error | undefined)?.message ?? "no data"}
        </span>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background">
      {/* 3D canvas */}
      <div className="absolute inset-0">
        <Atlas store={store} />
      </div>

      {/* Vignette overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      {/* Top-left filter rail */}
      <div className="pointer-events-none absolute left-4 top-4 z-10">
        <FilterRail />
      </div>

      {/* Bottom-left legend */}
      <div className="pointer-events-none absolute bottom-4 left-4 z-10">
        <Legend />
      </div>

      {/* Bottom-right credit */}
      <div className="pointer-events-none absolute bottom-4 right-4 z-10">
        <span className="mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
          informational layer · drag to rotate · scroll to zoom
        </span>
      </div>

      {/* Right-side node panel (controlled by store) */}
      <NodePanel store={store} />

      {/* Library overlay (controlled by store) */}
      <LibraryView store={store} />
    </div>
  );
}
