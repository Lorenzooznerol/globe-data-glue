import { FAMILY_COLOR, FAMILY_LABEL, familyOf, OPAQUE_GREY } from "@/atlas/families";
import type { AtlasMorphologyEntry } from "@/data/types";

interface Props {
  timeline: AtlasMorphologyEntry[];
}

function colorFor(morph: string): string {
  const fam = familyOf(morph);
  return fam ? FAMILY_COLOR[fam] : OPAQUE_GREY;
}

function familyLabelFor(morph: string): string {
  const fam = familyOf(morph);
  return fam ? FAMILY_LABEL[fam] : "Opaque";
}

export function MigrationStrip({ timeline }: Props) {
  if (!timeline || timeline.length < 2) return null;
  const a = timeline[0];
  const b = timeline[timeline.length - 1];
  const moved = a.morphology !== b.morphology;
  return (
    <section className="flex flex-col gap-2">
      <span className="mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        Migration
      </span>
      <div className="grid grid-cols-[1fr_16px_1fr] items-center gap-2">
        <Cell asOf={a.as_of} morph={a.morphology} />
        <span aria-hidden className="text-center text-muted-foreground">→</span>
        <Cell asOf={b.as_of} morph={b.morphology} />
      </div>
      {moved && b.note && (
        <p className="font-serif text-[12.5px] italic leading-relaxed text-foreground/75">
          {b.note}
        </p>
      )}
      {!moved && (
        <p className="font-serif text-[12.5px] italic leading-relaxed text-muted-foreground">
          No change in form across this window.
        </p>
      )}
    </section>
  );
}

function Cell({ asOf, morph }: { asOf: string; morph: string }) {
  return (
    <div className="flex items-center gap-2 border border-border/40 px-2 py-1.5">
      <span
        className="block h-2.5 w-2.5 shrink-0 rounded-[1px]"
        style={{ background: colorFor(morph) }}
        aria-hidden
      />
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
          {asOf}
        </span>
        <span className="font-serif text-[12.5px] text-foreground/90">{familyLabelFor(morph)}</span>
      </span>
    </div>
  );
}
