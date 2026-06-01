import { useState } from "react";
import type { GiraiCountry } from "@/data/types";
import { ChevronDown } from "lucide-react";

const DIM_LABELS: { key: keyof GiraiCountry["dimensions"]; label: string }[] = [
  { key: "human_rights", label: "Human rights" },
  { key: "governance", label: "Governance" },
  { key: "capacities", label: "Capacities" },
];

interface Props {
  girai: GiraiCountry;
  totalCountries: number;
  /** Optional override label, e.g. "national (USA) — GIRAI does not score sub-nationally." */
  contextNote?: string;
}

export function GiraiSnapshot({ girai, totalCountries, contextNote }: Props) {
  const [open, setOpen] = useState(false);

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

      <ThematicDisclosure areas={girai.thematic_areas} open={open} setOpen={setOpen} />
    </section>
  );
}

function ThematicDisclosure({
  areas,
  open,
  setOpen,
}: {
  areas: Record<string, number | null>;
  open: boolean;
  setOpen: (fn: (o: boolean) => boolean) => void;
}) {
  const entries = Object.entries(areas).sort(([a], [b]) => a.localeCompare(b));
  const hasAny = entries.some(([, v]) => v != null);
  const label = hasAny ? "Thematic detail" : "Thematic detail — scores not yet loaded";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="mono mt-1 flex items-center gap-1.5 text-left text-[10px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
      >
        <span>{label}</span>
        <ChevronDown
          className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {open && (hasAny ? <ThematicList entries={entries} /> : <ThematicNamesOnly entries={entries} />)}
    </>
  );
}

function ThematicNamesOnly({ entries }: { entries: [string, number | null][] }) {
  return (
    <div className="pt-1">
      <p className="mb-2 font-serif text-[11.5px] italic text-muted-foreground">
        Per-area scores aren't loaded yet.
      </p>
      <ul className="flex flex-col gap-1">
        {entries.map(([name]) => (
          <li key={name} className="font-serif text-[11.5px] text-foreground/70">
            {name}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ThematicList({ entries }: { entries: [string, number | null][] }) {
  return (
    <ul className="flex flex-col gap-1.5 pt-1">
      {entries.map(([name, v]) => (
        <li
          key={name}
          className="grid grid-cols-[1fr_60px_36px] items-center gap-2 text-[11.5px]"
        >
          <span className="font-serif text-foreground/75">{name}</span>
          <span className="relative block h-[3px] overflow-hidden rounded-[1px] bg-secondary/40" aria-hidden>
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
        </li>
      ))}
    </ul>
  );
}
