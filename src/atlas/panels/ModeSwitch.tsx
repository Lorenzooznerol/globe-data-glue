import { useAtlasStore, type AtlasMode } from "@/atlas/store";
import { GIRAI_INFO_TEXT, InfoPopover } from "./InfoPopover";

const MODES: { key: AtlasMode; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "girai", label: "GIRAI" },
  { key: "forecasts", label: "Forecasts" },
];

export function ModeSwitch() {
  const mode = useAtlasStore((s) => s.mode);
  const setMode = useAtlasStore((s) => s.setMode);
  return (
    <div className="flex items-center gap-1.5">
      <div
        role="tablist"
        aria-label="Globe mode"
        className="flex flex-1 overflow-hidden rounded-sm border border-border/60 bg-secondary/30"
      >
        {MODES.map((m) => {
          const active = mode === m.key;
          return (
            <button
              key={m.key}
              role="tab"
              aria-selected={active}
              onClick={() => setMode(m.key)}
              className={[
                "mono flex-1 px-2 py-1.5 text-[10px] uppercase tracking-[0.18em] transition-colors",
                active
                  ? "bg-background text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              {m.label}
            </button>
          );
        })}
      </div>
      <InfoPopover label="About GIRAI">{GIRAI_INFO_TEXT}</InfoPopover>
    </div>
  );
}
