import type { DataStore } from "@/data/store";
import type { AtlasNode, CountryOverlay } from "@/data/types";
import { GoDeeper } from "../GoDeeper";

interface Props {
  store: DataStore;
  node: AtlasNode;
  overlay: CountryOverlay;
  onDeeper: () => void;
}

export function Layer0Face({ store, node, overlay, onDeeper }: Props) {
  const r = overlay.readable;
  const iso = node.iso3 ?? overlay.meta.iso3;
  const girai = iso ? store.giraiByIso.get(iso) : undefined;
  const total = store.girai.countries.length;
  const summaryLead = (r.summary || "").split(". ").slice(0, 1).join(". ");

  return (
    <div className="flex h-full flex-col justify-center">
      <p className="mono mb-4 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
        {node.region ?? overlay.meta.country}
      </p>
      <h1 className="font-serif text-[44px] font-medium leading-none tracking-tight text-foreground">
        {node.name}
      </h1>
      {r.headline && (
        <p className="mt-6 max-w-[36ch] font-serif text-[20px] leading-[1.3] text-foreground/90">
          {r.headline}
        </p>
      )}
      {girai && (
        <p className="mono mt-8 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          GIRAI · {girai.index_score.toFixed(1)} / 100 · {ordinal(Math.round(girai.ranking))} of {total}
        </p>
      )}
      {summaryLead && (
        <p className="mt-6 max-w-[44ch] font-serif text-[14px] italic leading-relaxed text-foreground/70">
          {summaryLead}{summaryLead.endsWith(".") ? "" : "."}
        </p>
      )}
      <GoDeeper label="Go inside" onClick={onDeeper} />
    </div>
  );
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
