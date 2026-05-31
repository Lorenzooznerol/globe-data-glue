import { createFileRoute } from "@tanstack/react-router";
import { useDataStore } from "@/data/useDataStore";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Governance Data Store" },
      { name: "description", content: "Smoke test: typed in-memory CSV store with FK joins." },
    ],
  }),
  component: Index,
});

function Index() {
  const { data: store, isLoading, error } = useDataStore();

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading CSVs…</div>;
  }
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center text-destructive">
        Failed to load: {(error as Error).message}
      </div>
    );
  }
  if (!store) return null;

  const counts: Array<[string, number]> = [
    ["nodes_banded", store.raw.nodesBanded.length],
    ["nodes_vision", store.raw.nodesVision.length],
    ["morphology_timeindexed", store.raw.morphology.length],
    ["legitimacy_edges", store.raw.edges.length],
    ["markers", store.raw.markers.length],
    ["predictions", store.raw.predictions.length],
    ["claims", store.raw.claims.length],
    ["sources", store.raw.sources.length],
  ];

  return (
    <div className="min-h-screen bg-background p-8 text-foreground">
      <div className="mx-auto max-w-3xl space-y-8">
        <header>
          <h1 className="text-2xl font-semibold">Data store online</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            8 CSVs parsed in-memory with FK joins. Read path only — no views, no backend.
          </p>
        </header>

        <section>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">Row counts</h2>
          <ul className="divide-y divide-border rounded-md border border-border">
            {counts.map(([name, n]) => (
              <li key={name} className="flex items-center justify-between px-4 py-2 text-sm">
                <code className="font-mono">{name}</code>
                <span className="tabular-nums">{n}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
            FK warnings ({store.warnings.length})
          </h2>
          {store.warnings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No dangling foreign keys.</p>
          ) : (
            <ul className="space-y-1 rounded-md border border-border bg-muted/40 p-4 text-xs font-mono">
              {store.warnings.slice(0, 5).map((w, i) => (
                <li key={i}>{w}</li>
              ))}
              {store.warnings.length > 5 && (
                <li className="text-muted-foreground">…and {store.warnings.length - 5} more</li>
              )}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
