import type { CountryOverlay, OverlayCoordinate, OverlayCoordinates } from "@/data/types";
import { EpistemicChip } from "@/atlas/panels/EpistemicChip";

const AXES: { key: keyof OverlayCoordinates; label: string }[] = [
  { key: "gaze", label: "Gaze" },
  { key: "surveillance_breadth", label: "Surveillance breadth" },
  { key: "institutional_transparency", label: "Institutional transparency" },
  { key: "reciprocity", label: "Reciprocity" },
];

interface Props {
  overlay: CountryOverlay;
}

export function Layer4Coordinates({ overlay }: Props) {
  return (
    <div className="rounded-sm border border-dashed border-border/60 p-5">
      <header className="mb-5 flex items-center justify-between gap-2">
        <h2 className="mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
          The Coordinates
        </h2>
        <EpistemicChip level="INFERRED">Reading, not fact</EpistemicChip>
      </header>
      <dl className="flex flex-col gap-5">
        {AXES.map(({ key, label }) => (
          <Axis
            key={key}
            label={label}
            coord={overlay.coordinates[key] as OverlayCoordinate & { reading?: string }}
          />
        ))}
      </dl>
    </div>
  );
}

function Axis({
  label,
  coord,
}: {
  label: string;
  coord: OverlayCoordinate & { reading?: string };
}) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <dt className="mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </dt>
        <span className="font-serif text-[13px] text-foreground/90">{coord.value}</span>
      </div>
      {coord.reading && (
        <dd className="font-serif text-[13px] italic leading-relaxed text-foreground/70">
          {coord.reading}
        </dd>
      )}
      {coord.evidence_articles?.length > 0 && (
        <p className="mono mt-1 text-[9px] uppercase tracking-[0.15em] text-muted-foreground">
          Arts. {coord.evidence_articles.join(", ")}
        </p>
      )}
    </div>
  );
}
