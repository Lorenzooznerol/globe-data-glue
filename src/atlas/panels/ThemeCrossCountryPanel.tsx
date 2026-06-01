import { useState } from "react";
import type { DataStore } from "@/data/store";
import { useAtlasStore } from "@/atlas/store";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface Props {
  store: DataStore;
  area: string | null;
  currentIso: string | null;
  onClose: () => void;
}

export function ThemeCrossCountryPanel({ store, area, currentIso, onClose }: Props) {
  const reducedMotion = useAtlasStore((s) => s.reducedMotion);
  const selectIso = useAtlasStore((s) => s.selectIso);
  const open = area !== null;

  const rows = area
    ? store.girai.countries
        .map((c) => ({
          iso3: c.iso3,
          name: c.country,
          score: c.thematic_areas?.[area] ?? null,
        }))
        .filter((r): r is { iso3: string; name: string; score: number } => r.score != null)
        .sort((a, b) => b.score - a.score)
    : [];

  return (
    <Sheet open={open} onOpenChange={(v) => (v ? null : onClose())}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 border-l border-border/70 bg-background/95 p-0 backdrop-blur-md sm:max-w-[440px]"
      >
        <SheetHeader className="shrink-0 border-b border-border/40 px-6 py-5 text-left">
          <SheetTitle className="font-serif text-[20px] font-medium leading-tight tracking-tight">
            {area ?? ""}
          </SheetTitle>
          <p className="mono mt-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            GIRAI 2023 data · {rows.length} countries scored
          </p>
        </SheetHeader>

        <div
          className={`min-h-0 flex-1 overflow-y-auto px-5 py-4 ${
            reducedMotion ? "" : "animate-in fade-in-0 duration-200"
          }`}
        >
          <ul className="flex flex-col">
            {rows.map((r, i) => {
              const isCurrent = currentIso && r.iso3 === currentIso;
              return (
                <li
                  key={r.iso3}
                  ref={(el) => {
                    if (isCurrent && el && open) {
                      requestAnimationFrame(() =>
                        el.scrollIntoView({ block: "center", behavior: "auto" }),
                      );
                    }
                  }}
                  className={`border-t border-border/25 first:border-t-0 ${
                    isCurrent ? "bg-foreground/5" : ""
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      selectIso(r.iso3);
                      onClose();
                    }}
                    className="grid w-full grid-cols-[28px_1fr_56px_36px] items-center gap-3 px-2 py-2.5 text-left hover:bg-foreground/[0.03]"
                  >
                    <span className="mono text-[10px] tabular-nums text-muted-foreground">
                      {i + 1}
                    </span>
                    <span
                      className={`font-serif text-[13.5px] ${
                        isCurrent ? "font-medium text-foreground" : "text-foreground/85"
                      }`}
                    >
                      {r.name}
                    </span>
                    <span
                      className="relative block h-[4px] overflow-hidden rounded-[1px] bg-secondary/40"
                      aria-hidden
                    >
                      <span
                        className="absolute inset-y-0 left-0 bg-foreground/55"
                        style={{ width: `${Math.max(0, Math.min(100, r.score))}%` }}
                      />
                    </span>
                    <span className="mono text-right text-[10px] tabular-nums text-muted-foreground">
                      {r.score.toFixed(0)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="shrink-0 border-t border-border/40 px-6 py-3">
          <p className="mono text-[9.5px] uppercase tracking-[0.18em] text-muted-foreground">
            Tap a country to focus it on the globe
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
