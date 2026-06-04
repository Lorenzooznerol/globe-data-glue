import { useCallback, useEffect, useMemo, useState } from "react";
import { X, ChevronUp } from "lucide-react";
import type { DataStore } from "@/data/store";
import type { AtlasNode, CountryOverlay } from "@/data/types";
import { useAtlasStore } from "@/atlas/store";
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
  const [active, setActive] = useState(0);
  const [toVerifyOpen, setToVerifyOpen] = useState(false);

  // Globe recession: toggle body attribute while mounted.
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

  // Keyboard: Esc ascends or closes; ↓/↑ traverse.
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

  const visibleLayers = useMemo(() => LAYERS.slice(0, active + 1), [active]);

  return (
    <aside
      className="pointer-events-auto fixed right-0 top-0 z-30 flex h-screen w-full max-w-[520px] flex-col border-l border-border/70 bg-background/95 backdrop-blur-md"
      role="dialog"
      aria-label={`${node.name} — layered entry`}
    >
      <LayerBreadcrumb
        layers={LAYERS}
        active={active}
        onJump={setActive}
        onOpenToVerify={() => setToVerifyOpen(true)}
        toVerifyCount={overlay.to_verify?.length ?? 0}
      />

      <header className="relative shrink-0 border-b border-border/40 px-6 pb-3 pt-4 pl-24">
        <div className="mono flex items-center gap-2 text-[9px] uppercase tracking-[0.24em] text-muted-foreground">
          <span>{node.name}</span>
          <span aria-hidden>·</span>
          <span>Layer {active} / {LAYERS.length - 1}</span>
          <span aria-hidden>·</span>
          <span>{LAYERS[active].label}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={close}
          className="absolute right-3 top-2.5 h-7 w-7 text-muted-foreground hover:text-foreground"
          aria-label="Close to globe"
        >
          <X className="h-4 w-4" />
        </Button>
        {active > 0 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={ascend}
            className="absolute right-12 top-2.5 h-7 w-7 text-muted-foreground hover:text-foreground"
            aria-label="One layer back"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
        )}
      </header>

      <div className="relative min-h-0 flex-1 overflow-hidden pl-20">
        <div
          key={active}
          className="absolute inset-0 overflow-y-auto px-6 pb-12 pt-5"
          style={{
            animation: reducedMotion
              ? "descent-fade 180ms ease-out both"
              : "descent-enter 240ms ease-out both",
          }}
        >
          <LayerView
            index={active}
            store={store}
            node={node}
            overlay={overlay}
            onDeeper={descend}
            isLast={active === LAYERS.length - 1}
          />

        </div>
      </div>

      <ToVerifyDrawer
        open={toVerifyOpen}
        onOpenChange={setToVerifyOpen}
        items={overlay.to_verify ?? []}
      />
    </aside>
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
  isLast: boolean;
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
