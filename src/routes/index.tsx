import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useDataStore } from "@/data/useDataStore";
import { EarthGlobe } from "@/atlas/components/EarthGlobe";
import { Legend } from "@/atlas/panels/Legend";
import { LayerFilter } from "@/atlas/panels/LayerFilter";
import { NodeCard } from "@/atlas/panels/NodeCard";
import { SideIndex } from "@/atlas/panels/SideIndex";
import { SearchCommand } from "@/atlas/panels/SearchCommand";
import { useAtlasStore } from "@/atlas/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Atlas of AI Governance" },
      {
        name: "description",
        content:
          "A 3D world atlas of AI governance: how each country regulates AI in plain language, with the documents behind every claim.",
      },
      { property: "og:title", content: "Atlas of AI Governance" },
      {
        property: "og:description",
        content:
          "A 3D world atlas of AI governance: how each country regulates AI in plain language, with the documents behind every claim.",
      },
    ],
  }),
  component: AtlasPage,
});

function AtlasPage() {
  const { data: store, isLoading, error } = useDataStore();
  const setReducedMotion = useAtlasStore((s) => s.setReducedMotion);
  const [size, setSize] = useState<{ w: number; h: number }>({
    w: typeof window === "undefined" ? 1280 : window.innerWidth,
    h: typeof window === "undefined" ? 800 : window.innerHeight,
  });

  // Honor system preference once on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) setReducedMotion(true);
  }, [setReducedMotion]);

  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <span className="mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          loading atlas…
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
      {/* 3D Earth */}
      <div className="absolute inset-0">
        <EarthGlobe store={store} width={size.w} height={size.h} />
      </div>

      {/* Vignette */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.7) 100%)",
        }}
      />

      {/* Top-left: legend + filters + index */}
      <div className="pointer-events-none absolute left-4 top-4 z-20 flex w-[260px] flex-col gap-3">
        <Legend />
        <LayerFilter />
        <SideIndex store={store} />
      </div>

      {/* Top-center: search */}
      <div className="pointer-events-none absolute left-1/2 top-4 z-20 -translate-x-1/2">
        <SearchCommand store={store} />
      </div>

      {/* Bottom credit */}
      <div className="pointer-events-none absolute bottom-3 right-4 z-20">
        <span className="mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
          drag · scroll to zoom · hover a country
        </span>
      </div>

      {/* Right-side card (controlled by store) */}
      <div className="absolute inset-0 z-30 pointer-events-none">
        <NodeCard store={store} />
      </div>
    </div>
  );
}
