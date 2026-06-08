import { useMemo, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { DataStore } from "@/data/store";
import { MORPH_LABEL, type MorphCode, type Band, type Layer } from "@/atlas/morphology";
import { useLandingStore, type LandingFilters, type EvidenceLevel } from "./landingStore";

interface Props {
  store: DataStore;
}

type FacetKey = Exclude<keyof LandingFilters, "query">;

interface Option {
  value: string;
  label: string;
}

export function FilterChips({ store }: Props) {
  const f = useLandingStore();
  const toggle = useLandingStore((s) => s.toggle);
  const clearFacet = useLandingStore((s) => s.clearFacet);

  const jurisdictionOptions = useMemo<Option[]>(() => {
    const seen = new Set<string>();
    const opts: Option[] = [];
    for (const n of store.atlas.nodes) {
      const iso = n.iso3 ?? n.part_of_iso3;
      if (!iso || seen.has(iso)) continue;
      seen.add(iso);
      const girai = store.giraiByIso.get(iso);
      opts.push({ value: iso, label: girai?.country ?? n.name ?? iso });
    }
    return opts.sort((a, b) => a.label.localeCompare(b.label));
  }, [store]);

  const facets: Array<{
    key: FacetKey;
    label: string;
    options: Option[];
    selected: Set<string>;
  }> = [
    {
      key: "jurisdiction",
      label: "Giurisdizione",
      options: jurisdictionOptions,
      selected: f.jurisdiction as Set<string>,
    },
    {
      key: "layer",
      label: "Layer",
      options: (["state", "actor", "deployer", "vision"] as Layer[]).map((v) => ({
        value: v,
        label: v[0].toUpperCase() + v.slice(1),
      })),
      selected: f.layer as Set<string>,
    },
    {
      key: "morphology",
      label: "Morfologia",
      options: (Object.keys(MORPH_LABEL) as MorphCode[]).map((v) => ({
        value: v,
        label: `${v} · ${MORPH_LABEL[v]}`,
      })),
      selected: f.morphology as Set<string>,
    },
    {
      key: "paperBand",
      label: "Banda carta",
      options: (["CI", "IN", "AS", "S", "C"] as Band[]).map((v) => ({ value: v, label: v })),
      selected: f.paperBand as Set<string>,
    },
    {
      key: "realBand",
      label: "Banda realtà",
      options: (["CI", "IN", "AS", "S", "C"] as Band[]).map((v) => ({ value: v, label: v })),
      selected: f.realBand as Set<string>,
    },
    {
      key: "evidence",
      label: "Evidenza",
      options: (["STRONG", "WEAK", "OPAQUE"] as EvidenceLevel[]).map((v) => ({
        value: v,
        label: v[0] + v.slice(1).toLowerCase(),
      })),
      selected: f.evidence as Set<string>,
    },
  ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {facets.map((facet) => (
        <ChipDropdown
          key={facet.key}
          label={facet.label}
          options={facet.options}
          selected={facet.selected}
          onToggle={(v) => toggle(facet.key, v)}
          onClear={() => clearFacet(facet.key)}
        />
      ))}
    </div>
  );
}

function ChipDropdown({
  label,
  options,
  selected,
  onToggle,
  onClear,
}: {
  label: string;
  options: Option[];
  selected: Set<string>;
  onToggle: (v: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const n = selected.size;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className="landing-chip" data-on={n > 0}>
          <span>{label}</span>
          {n > 0 && <span className="num-badge num">{n}</span>}
          <ChevronDown className="h-3 w-3 opacity-70" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        className="max-h-[60vh] w-[260px] overflow-y-auto p-1"
      >
        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {label}
          </span>
          {n > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
            >
              clear
            </button>
          )}
        </div>
        <ul>
          {options.map((opt) => {
            const on = selected.has(opt.value);
            return (
              <li key={opt.value}>
                <button
                  type="button"
                  onClick={() => onToggle(opt.value)}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-[13px] hover:bg-foreground/5"
                >
                  <span
                    className="flex h-3.5 w-3.5 shrink-0 items-center justify-center border border-border"
                    style={{ background: on ? "var(--foreground)" : "transparent" }}
                  >
                    {on && (
                      <Check className="h-2.5 w-2.5" style={{ color: "var(--background)" }} />
                    )}
                  </span>
                  <span className="truncate">{opt.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
