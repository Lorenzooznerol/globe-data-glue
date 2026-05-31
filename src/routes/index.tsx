import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useDataStore } from "@/data/useDataStore";
import { EarthGlobe } from "@/atlas/components/EarthGlobe";
import { Legend } from "@/atlas/panels/Legend";
import { GiraiLegend } from "@/atlas/panels/GiraiLegend";
import { LayerFilter } from "@/atlas/panels/LayerFilter";
import { NodeCard } from "@/atlas/panels/NodeCard";
import { GiraiOnlyCard } from "@/atlas/panels/GiraiOnlyCard";
import { SideIndex } from "@/atlas/panels/SideIndex";
import { SearchCommand } from "@/atlas/panels/SearchCommand";
import { ModeSwitch } from "@/atlas/panels/ModeSwitch";
import { ThemeToggle } from "@/atlas/panels/ThemeToggle";
import { TrajectoryLegend } from "@/atlas/panels/TrajectoryLegend";
import { TrajectoryPanel } from "@/atlas/panels/TrajectoryPanel";
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
  const mode = useAtlasStore((s) => s.mode);
  const { data: store, isLoading, error } = useDataStore();
  const setReducedMotion = useAtlasStore((s) => s.setReducedMotion);
  const [mounted, setMounted] = useState(false);
  const [size, setSize] = useState<{ w: number; h: number }>({
    w: typeof window === "undefined" ? 1280 : window.innerWidth,
    h: typeof window === "undefined" ? 800 : window.innerHeight,
  });

  useEffect(() => {
    setMounted(true);
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
      {/* 3D Earth (client-only: react-globe.gl touches window at import) */}
      <div className="absolute inset-0">
        {mounted && <EarthGlobe store={store} width={size.w} height={size.h} />}
      </div>

      {/* Vignette */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.7) 100%)",
        }}
      />

      {/* Top-left: mode switch + legends + filters + index */}
      <div className="pointer-events-none absolute left-4 top-4 z-20 flex w-[240px] flex-col gap-3">
        <div className="pointer-events-auto flex flex-col gap-5 rounded-md border border-border/50 bg-background/85 p-4 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className="flex-1"><ModeSwitch /></div>
            <ThemeToggle />
          </div>
          <Legend />
          {mode !== "trajectory" && (
            <>
              <div className="border-t border-border/40" />
              <LayerFilter />
            </>
          )}
          {mode === "girai" && (
            <>
              <div className="border-t border-border/40" />
              <GiraiLegend />
            </>
          )}
          {mode === "trajectory" && (
            <>
              <div className="border-t border-border/40" />
              <TrajectoryLegend />
            </>
          )}
        </div>
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
        <GiraiOnlyCard store={store} />
      </div>

      {/* Trajectory bottom sheet */}
      <TrajectoryPanel store={store} />
    </div>
  );
}
