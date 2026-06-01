import type { DataStore } from "@/data/store";
import { useAtlasStore } from "@/atlas/store";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { GiraiSnapshot } from "./GiraiSnapshot";

interface Props {
  store: DataStore;
}

export function GiraiOnlyCard({ store }: Props) {
  const selectedIso = useAtlasStore((s) => s.selectedIso);
  const clearIso = useAtlasStore((s) => s.clearIso);

  if (!selectedIso) return null;
  const girai = store.giraiByIso.get(selectedIso);
  if (!girai) return null;
  const total = store.girai.countries.length;

  return (
    <aside
      className="pointer-events-auto fixed right-0 top-0 z-30 flex h-screen w-full max-w-[480px] flex-col border-l border-border/70 bg-background/95 backdrop-blur-md"
      role="dialog"
      aria-label={`${girai.country} — GIRAI snapshot`}
    >
      <header className="relative shrink-0 border-b border-border/40 px-6 pb-5 pt-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={clearIso}
          className="absolute right-3 top-3 h-7 w-7 text-muted-foreground hover:text-foreground"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </Button>
        <div className="mono mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          <span>Country</span>
          {girai.region && (
            <>
              <span aria-hidden>·</span>
              <span>{girai.region}</span>
            </>
          )}
        </div>
        <h2 className="font-serif text-[26px] font-medium leading-tight tracking-tight text-foreground">
          {girai.country}
        </h2>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-10 pt-5">
        <p className="font-serif text-[14px] italic leading-relaxed text-muted-foreground">
          Not yet covered by the Atlas's morphological analysis.
        </p>
        <div className="mt-5">
          <GiraiSnapshot store={store} girai={girai} totalCountries={total} currentIso={girai.iso3} />
        </div>
      </div>
    </aside>
  );
}
