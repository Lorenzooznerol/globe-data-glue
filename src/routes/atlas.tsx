import { lazy, Suspense, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useDataStore } from "@/data/useDataStore";
import { EarthGlobe } from "@/atlas/components/EarthGlobe";
import { Legend } from "@/atlas/panels/Legend";
import { GiraiLegend } from "@/atlas/panels/GiraiLegend";
import { NodeCard } from "@/atlas/panels/NodeCard";
import { GiraiOnlyCard } from "@/atlas/panels/GiraiOnlyCard";
import { SideIndex } from "@/atlas/panels/SideIndex";
import { SearchCommand } from "@/atlas/panels/SearchCommand";
import { ModeSwitch } from "@/atlas/panels/ModeSwitch";
import { ThemeToggle } from "@/atlas/panels/ThemeToggle";
import { TrajectoryLegend } from "@/atlas/panels/TrajectoryLegend";
import { ForecastHeader } from "@/atlas/panels/ForecastHeader";
import { useAtlasStore } from "@/atlas/store";

const ForecastsPanel = lazy(() =>
  import("@/atlas/panels/TrajectoryPanel").then((m) => ({ default: m.TrajectoryPanel })),
);

type StanceSearch = { stance?: "yes" | "no" };

export const Route = createFileRoute("/atlas")({
  validateSearch: (raw: Record<string, unknown>): StanceSearch => {
    const s = raw.stance;
    return s === "yes" || s === "no" ? { stance: s } : {};
  },
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
  const reducedMotion = useAtlasStore((s) => s.reducedMotion);
  const setReducedMotion = useAtlasStore((s) => s.setReducedMotion);
  const setUserStance = useAtlasStore((s) => s.setUserStance);
  const playMigrations = useAtlasStore((s) => s.playMigrations);
  const { stance } = Route.useSearch();
  const { data: store, isLoading, error } = useDataStore();

  // TODO: surface stance in Atlas UI ("see where you are" vs. each country).
  useEffect(() => {
    if (stance) setUserStance(stance);
  }, [stance, setUserStance]);

  const [mounted, setMounted] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
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

  // Trigger migration pulse when entering Forecasts mode.
  useEffect(() => {
    if (mode === "forecasts") playMigrations();
    else setRegisterOpen(false);
  }, [mode, playMigrations]);

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
      <div className="absolute inset-0 globe-recede">
        {mounted && <EarthGlobe store={store} width={size.w} height={size.h} />}
      </div>

      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.35) 100%)",
        }}
      />

      {/* Top-left: mode + legends + index */}
      <div className="pointer-events-none absolute left-4 top-4 z-20 flex max-h-[calc(100vh-2rem)] w-[260px] flex-col gap-3">
        <div className="pointer-events-auto flex shrink-0 flex-col gap-5 rounded-md border border-border/50 bg-background/85 p-4 backdrop-blur-md">
          <ModeSwitch />
          <Legend />
          {mode === "girai" && (
            <>
              <div className="border-t border-border/40" />
              <GiraiLegend />
            </>
          )}
          {mode === "forecasts" && (
            <>
              <div className="border-t border-border/40" />
              <TrajectoryLegend />
            </>
          )}
        </div>
        <SideIndex store={store} />
      </div>


      {/* Top-center: search, or Forecast header in forecasts mode */}
      <div className="pointer-events-none absolute left-1/2 top-4 z-20 -translate-x-1/2">
        {mode === "forecasts" ? (
          <ForecastHeader store={store} onOpenRegister={() => setRegisterOpen(true)} />
        ) : (
          <SearchCommand store={store} />
        )}
      </div>

      {/* Top-right: theme toggle */}
      <div className="absolute right-4 top-4 z-30">
        <ThemeToggle />
      </div>

      <div className="pointer-events-none absolute bottom-3 right-4 z-20">
        <span className="mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
          drag · scroll to zoom · hover a country
        </span>
      </div>

      <div className="pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2">
        <button
          type="button"
          onClick={() => setReducedMotion(!reducedMotion)}
          aria-pressed={reducedMotion}
          className="pointer-events-auto mono inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/85 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground backdrop-blur-md transition-colors hover:text-foreground"
        >
          <span
            aria-hidden
            className={`inline-block h-1.5 w-1.5 rounded-full ${reducedMotion ? "bg-foreground" : "bg-foreground/30"}`}
          />
          <span>Slow motion · {reducedMotion ? "on" : "off"}</span>
        </button>
      </div>


      <div className="absolute inset-0 z-30 pointer-events-none">
        <NodeCard store={store} />
        <GiraiOnlyCard store={store} />
      </div>

      {mode === "forecasts" && (
        <Suspense fallback={null}>
          <ForecastsPanel
            store={store}
            open={registerOpen}
            onClose={() => setRegisterOpen(false)}
          />
        </Suspense>
      )}
    </div>
  );
}
