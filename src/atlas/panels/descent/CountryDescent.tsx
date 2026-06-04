import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { X, ChevronUp, ChevronDown } from "lucide-react";
import { geoMercator, geoPath } from "d3-geo";
import type { DataStore } from "@/data/store";
import type { AtlasNode, CountryOverlay } from "@/data/types";
import { useAtlasStore } from "@/atlas/store";
import { useCountries } from "@/atlas/useCountries";
import { Button } from "@/components/ui/button";
import { LayerBreadcrumb } from "./LayerBreadcrumb";
import { ToVerifyDrawer } from "./ToVerifyDrawer";
import { Layer0Face } from "./layers/Layer0Face";
import { Layer1Law } from "./layers/Layer1Law";
import { Layer2Authorities } from "./layers/Layer2Authorities";
import { Layer3Triggers } from "./layers/Layer3Triggers";
import { Layer4Coordinates } from "./layers/Layer4Coordinates";

interface Props {
  store: DataStore;
  node: AtlasNode;
  overlay: CountryOverlay;
}

const LAYERS = [
  { key: 0, label: "Face" },
  { key: 1, label: "Law" },
  { key: 2, label: "Authorities" },
  { key: 3, label: "Triggers" },
  { key: 4, label: "Coordinates" },
];

export function CountryDescent({ store, node, overlay }: Props) {
  const selectNode = useAtlasStore((s) => s.selectNode);
  const reducedMotion = useAtlasStore((s) => s.reducedMotion);
  const features = useCountries();
  const [active, setActive] = useState(0);
  const [toVerifyOpen, setToVerifyOpen] = useState(false);

  // Track viewport size so the perimeter scales with the window.
  const [size, setSize] = useState<{ w: number; h: number }>(() => ({
    w: typeof window === "undefined" ? 1280 : window.innerWidth,
    h: typeof window === "undefined" ? 800 : window.innerHeight,
  }));
  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Hide the globe entirely while inside a country.
  useEffect(() => {
    document.body.setAttribute("data-descent", "on");
    return () => {
      document.body.removeAttribute("data-descent");
    };
  }, []);

  const close = useCallback(() => selectNode(null), [selectNode]);
  const descend = useCallback(
    () => setActive((a) => Math.min(a + 1, LAYERS.length - 1)),
    [],
  );
  const ascend = useCallback(() => setActive((a) => Math.max(a - 1, 0)), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (toVerifyOpen) return;
      if (e.key === "Escape") {
        if (active === 0) close();
        else ascend();
      } else if (e.key === "ArrowDown" || e.key === "PageDown") {
        if (active < LAYERS.length - 1) {
          e.preventDefault();
          descend();
        }
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        if (active > 0) {
          e.preventDefault();
          ascend();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, ascend, close, descend, toVerifyOpen]);

  // Find the country feature for this overlay and project it to fit the screen.
  const iso = node.iso3 ?? overlay.meta.iso3;
  const feature = useMemo(() => {
    if (!iso) return null;
    return features.find((f) => f.properties.ADM0_A3 === iso || f.properties.ISO_A3 === iso) ?? null;
  }, [features, iso]);

  const maskId = useMemo(() => `country-mask-${iso ?? "x"}`, [iso]);

  const projected = useMemo(() => {
    if (!feature) return null;
    // Inset so the silhouette sits inside a comfortable margin.
    const padX = Math.max(48, size.w * 0.08);
    const padTop = 96;   // leave room for header
    const padBot = 80;   // leave room for hint / breadcrumb
    const projection = geoMercator().fitExtent(
      [
        [padX, padTop],
        [size.w - padX, size.h - padBot],
      ],
      feature as never,
    );
    const path = geoPath(projection);
    const d = path(feature as never) ?? "";
    const b = path.bounds(feature as never);
    const bx = b[0][0];
    const by = b[0][1];
    const bw = b[1][0] - b[0][0];
    const bh = b[1][1] - b[0][1];
    return { d, bx, by, bw, bh };
  }, [feature, size]);

  // Inset the content box inside the silhouette so text doesn't ride the border.
  const contentBox = useMemo(() => {
    if (!projected) return null;
    const inset = Math.min(48, Math.min(projected.bw, projected.bh) * 0.1);
    return {
      left: projected.bx + inset,
      top: projected.by + inset,
      width: Math.max(280, projected.bw - inset * 2),
      height: Math.max(240, projected.bh - inset * 2),
    };
  }, [projected]);

  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className="pointer-events-auto fixed inset-0 z-30 bg-background"
      role="dialog"
      aria-label={`${node.name} — perimeter view`}
    >
      {/* Perimeter silhouette */}
      {projected && (
        <svg
          width={size.w}
          height={size.h}
          className="absolute inset-0"
          style={{ pointerEvents: "none" }}
          aria-hidden
        >
          <defs>
            <clipPath id={maskId} clipPathUnits="userSpaceOnUse">
              <path d={projected.d} />
            </clipPath>
            <radialGradient id={`${maskId}-glow`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="hsl(var(--primary) / 0.10)" />
              <stop offset="100%" stopColor="hsl(var(--primary) / 0)" />
            </radialGradient>
          </defs>
          {/* Fill the silhouette with a slightly lifted surface */}
          <path d={projected.d} fill="hsl(var(--card))" opacity="0.92" />
          <path d={projected.d} fill={`url(#${maskId}-glow)`} />
          {/* Perimeter outline */}
          <path
            d={projected.d}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth={1.25}
            strokeOpacity={0.55}
            style={{
              filter: "drop-shadow(0 0 8px hsl(var(--primary) / 0.25))",
            }}
          />
        </svg>
      )}

      {/* Clipped content — only visible inside the country silhouette */}
      {projected && contentBox && (
        <div
          className="absolute inset-0"
          style={{ clipPath: `url(#${maskId})`, WebkitClipPath: `url(#${maskId})` }}
        >
          <div
            key={active}
            className="absolute overflow-y-auto"
            style={{
              left: contentBox.left,
              top: contentBox.top,
              width: contentBox.width,
              height: contentBox.height,
              animation: reducedMotion
                ? "descent-fade 180ms ease-out both"
                : "descent-enter 280ms ease-out both",
            }}
          >
            <LayerView
              index={active}
              store={store}
              node={node}
              overlay={overlay}
              onDeeper={descend}
            />
          </div>
        </div>
      )}

      {/* Fallback when no geometry: render content full-screen */}
      {!projected && (
        <div className="absolute inset-0 overflow-y-auto px-10 pb-16 pt-24">
          <div className="mx-auto max-w-[640px]">
            <LayerView
              index={active}
              store={store}
              node={node}
              overlay={overlay}
              onDeeper={descend}
            />
          </div>
        </div>
      )}

      {/* Chrome — sits ABOVE the clipped layer, not clipped itself */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between px-4 pt-4">
        <div className="pointer-events-auto">
          <LayerBreadcrumb
            layers={LAYERS}
            active={active}
            onJump={setActive}
            onOpenToVerify={() => setToVerifyOpen(true)}
            toVerifyCount={overlay.to_verify?.length ?? 0}
          />
        </div>

        <div className="pointer-events-auto flex items-center gap-2 rounded-md border border-border/50 bg-background/85 px-3 py-2 backdrop-blur-md">
          <div className="mono flex items-center gap-2 pr-1 text-[9px] uppercase tracking-[0.24em] text-muted-foreground">
            <span>{node.name}</span>
            <span aria-hidden>·</span>
            <span>
              Layer {active} / {LAYERS.length - 1}
            </span>
            <span aria-hidden>·</span>
            <span>{LAYERS[active].label}</span>
          </div>
          {active > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={ascend}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              aria-label="One layer back"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={close}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            aria-label="Close to globe"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Bottom hint + next-layer affordance, outside the silhouette clip */}
      <div className="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex justify-center">
        {active < LAYERS.length - 1 ? (
          <button
            type="button"
            onClick={descend}
            className="pointer-events-auto mono inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/85 px-4 py-1.5 text-[10px] uppercase tracking-[0.24em] text-muted-foreground backdrop-blur-md transition-colors hover:text-foreground"
          >
            <span>Descend · {LAYERS[active + 1].label}</span>
            <ChevronDown className="h-3 w-3" />
          </button>
        ) : (
          <span className="mono text-[9px] uppercase tracking-[0.24em] text-muted-foreground">
            deepest layer · esc to ascend
          </span>
        )}
      </div>

      <ToVerifyDrawer
        open={toVerifyOpen}
        onOpenChange={setToVerifyOpen}
        items={overlay.to_verify ?? []}
      />
    </div>
  );
}

function LayerView({
  index,
  store,
  node,
  overlay,
  onDeeper,
}: {
  index: number;
  store: DataStore;
  node: AtlasNode;
  overlay: CountryOverlay;
  onDeeper: () => void;
}) {
  switch (index) {
    case 0:
      return <Layer0Face store={store} node={node} overlay={overlay} onDeeper={onDeeper} />;
    case 1:
      return <Layer1Law overlay={overlay} onDeeper={onDeeper} />;
    case 2:
      return <Layer2Authorities overlay={overlay} onDeeper={onDeeper} />;
    case 3:
      return <Layer3Triggers overlay={overlay} onDeeper={onDeeper} />;
    case 4:
      return <Layer4Coordinates overlay={overlay} />;
    default:
      return null;
  }
}
