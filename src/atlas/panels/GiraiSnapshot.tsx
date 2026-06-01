import { useState } from "react";
import type { DataStore } from "@/data/store";
import type { GiraiCountry } from "@/data/types";
import { ChevronDown } from "lucide-react";
import { ThemeCrossCountryPanel } from "./ThemeCrossCountryPanel";

const DIM_LABELS: { key: keyof GiraiCountry["dimensions"]; label: string }[] = [
  { key: "human_rights", label: "Human rights" },
  { key: "governance", label: "Governance" },
  { key: "capacities", label: "Capacities" },
];

interface Props {
  store: DataStore;
  girai: GiraiCountry;
  totalCountries: number;
  /** Optional override label, e.g. "national (USA) — GIRAI does not score sub-nationally." */
  contextNote?: string;
  /** ISO3 of the current country in focus (for highlighting in the cross-country sheet). */
  currentIso: string | null;
}

export function GiraiSnapshot({ store, girai, totalCountries, contextNote, currentIso }: Props) {
  const [open, setOpen] = useState(false);
  const [activeArea, setActiveArea] = useState<string | null>(null);

  return (
    <section className="flex flex-col gap-3 border-t border-border/40 pt-5">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          GIRAI snapshot
        </h3>
        <span className="mono text-[10px] tracking-[0.1em] text-muted-foreground">
          {girai.index_score.toFixed(1)} / 100 · rank {Math.round(girai.ranking)} of {totalCountries}
        </span>
      </div>

      {contextNote && (
        <p className="font-serif text-[11.5px] italic leading-snug text-muted-foreground">
          {contextNote}
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {DIM_LABELS.map(({ key, label }) => {
          const v = girai.dimensions[key];
          return (
            <li key={key} className="grid grid-cols-[110px_1fr_36px] items-center gap-3">
              <span className="font-serif text-[12px] text-foreground/80">{label}</span>
              <span
                className="relative block h-[5px] overflow-hidden rounded-[1px] bg-secondary/40"
                aria-hidden
              >
                <span
                  className="absolute inset-y-0 left-0 bg-foreground/55"
                  style={{ width: `${Math.max(0, Math.min(100, v))}%` }}
                />
              </span>
              <span className="mono text-right text-[10px] tabular-nums text-muted-foreground">
                {v.toFixed(0)}
              </span>
            </li>
          );
        })}
      </ul>

      <ThematicDisclosure
        areas={girai.thematic_areas}
        open={open}
        setOpen={setOpen}
        onSelectArea={setActiveArea}
      />

      <ThemeCrossCountryPanel
        store={store}
        area={activeArea}
        currentIso={currentIso}
        onClose={() => setActiveArea(null)}
      />
    </section>
  );
}

function ThematicDisclosure({
  areas,
  open,
  setOpen,
  onSelectArea,
}: {
  areas: Record<string, number | null>;
  open: boolean;
  setOpen: (fn: (o: boolean) => boolean) => void;
  onSelectArea: (area: string) => void;
}) {
  const entries = Object.entries(areas).sort(([a], [b]) => a.localeCompare(b));

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="mono mt-1 flex items-center gap-1.5 text-left text-[10px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
      >
        <span>Thematic detail</span>
        <ChevronDown
          className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {open && (
        <>
          <p className="-mt-1 font-serif text-[11px] italic leading-snug text-muted-foreground">
            Tap an area to compare across all scored countries.
          </p>
          <ul className="flex flex-col gap-1.5 pt-1">
            {entries.map(([name, v]) => (
              <li key={name}>
                <button
                  type="button"
                  onClick={() => onSelectArea(name)}
                  className="grid w-full grid-cols-[1fr_60px_36px] items-center gap-2 rounded-sm px-1 py-0.5 text-left text-[11.5px] transition-colors hover:bg-foreground/[0.04]"
                >
                  <span className="font-serif text-foreground/80 hover:text-foreground">
                    {name}
                  </span>
                  <span
                    className="relative block h-[3px] overflow-hidden rounded-[1px] bg-secondary/40"
                    aria-hidden
                  >
                    {v != null && (
                      <span
                        className="absolute inset-y-0 left-0 bg-foreground/45"
                        style={{ width: `${Math.max(0, Math.min(100, v))}%` }}
                      />
                    )}
                  </span>
                  <span className="mono text-right text-[9px] tabular-nums text-muted-foreground">
                    {v == null ? "—" : v.toFixed(0)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
