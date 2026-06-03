import type { OverlayCoordinate, OverlayCoordinates } from "@/data/types";
import { EpistemicChip } from "./EpistemicChip";

interface Props {
  coordinates: OverlayCoordinates;
}

const AXES: { key: keyof OverlayCoordinates; label: string }[] = [
  { key: "gaze", label: "Gaze" },
  { key: "surveillance_breadth", label: "Surveillance breadth" },
  { key: "institutional_transparency", label: "Institutional transparency" },
  { key: "reciprocity", label: "Reciprocity" },
];

export function CoordinatesReadout({ coordinates }: Props) {
  return (
    <section className="rounded-sm border border-dashed border-border/60 p-4">
      <header className="mb-3 flex items-center justify-between gap-2">
        <h3 className="mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Coordinates
        </h3>
        <EpistemicChip level="INFERRED">Reading, not fact</EpistemicChip>
      </header>
      <dl className="grid grid-cols-1 gap-3">
        {AXES.map(({ key, label }) => (
          <Axis key={key} label={label} coord={coordinates[key]} />
        ))}
      </dl>
    </section>
  );
}

function Axis({ label, coord }: { label: string; coord: OverlayCoordinate }) {
  return (
    <div className="grid grid-cols-[160px_1fr] items-baseline gap-3">
      <dt className="mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
        {label}
      </dt>
      <dd>
        <span className="font-serif text-[13.5px] text-foreground/90">{coord.value}</span>
        {coord.evidence_articles?.length > 0 && (
          <span className="mono ml-2 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            Arts. {coord.evidence_articles.join(", ")}
          </span>
        )}
      </dd>
    </div>
  );
}
