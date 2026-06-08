import { Search, X } from "lucide-react";
import { useLandingStore } from "./landingStore";

interface Props {
  active: boolean;
  totalNodes: number;
  totalCountries: number;
}

export function SearchHero({ active, totalNodes, totalCountries }: Props) {
  const query = useLandingStore((s) => s.query);
  const setQuery = useLandingStore((s) => s.setQuery);

  return (
    <>
      {/* Headline cluster — fades out on activation */}
      <div
        className="landing-hero pointer-events-none absolute left-0 right-0 z-20 flex flex-col items-center px-6 text-center"
        style={{ top: "20vh" }}
        data-active={active}
      >
        <h1
          className="display text-foreground"
          style={{ fontSize: "clamp(2.6rem, 6vw, 5.2rem)" }}
        >
          Esplora la governance dell'IA
        </h1>
        <p
          className="num mt-5 text-[14px] text-muted-foreground"
          style={{ letterSpacing: "-0.005em" }}
        >
          {totalCountries} giurisdizioni · {totalNodes} nodi mappati a fonte primaria
        </p>
      </div>

      {/* Search pill — centered at rest, sticky-top when active */}
      <div
        className="landing-search-shell pointer-events-none absolute left-1/2 z-30 -translate-x-1/2"
        style={{
          top: active ? "18px" : "calc(20vh + clamp(2.6rem, 6vw, 5.2rem) + 90px)",
          width: active ? "min(680px, 60vw)" : "min(720px, 64vw)",
        }}
      >
        <div className="landing-pill pointer-events-auto flex items-center gap-2 px-5 py-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cerca un paese, una regione o un meccanismo"
            className="flex-1 bg-transparent text-[14.5px] text-foreground outline-none placeholder:text-muted-foreground/70"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear"
              className="rounded-full p-1 text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </>
  );
}
