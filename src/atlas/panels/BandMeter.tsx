import { bandStep, BAND_ORDER, BAND_PLAIN, plainWordStep, type BandCode } from "@/atlas/plainLanguage";

interface Props {
  label: string;
  /** Either a band code (CI/IN/AS/S/C) or a plain word ("almost none"…"comprehensive"). */
  bandCode?: string;
  plainWord?: string;
  hue: string;
  /** If true, wrap label in <Term> for glossary highlighting (used by NodeCard). */
  renderLabel?: (label: string) => React.ReactNode;
}

export function BandMeter({ label, bandCode, plainWord, hue, renderLabel }: Props) {
  let step = 0;
  let word = "—";
  if (plainWord && plainWord.trim()) {
    step = plainWordStep(plainWord);
    word = plainWord.trim().toLowerCase();
  } else if (bandCode) {
    step = bandStep(bandCode);
    const u = (bandCode ?? "").trim().toUpperCase() as BandCode;
    word = step > 0 ? (BAND_PLAIN[u] ?? "—") : "—";
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <span className="mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {renderLabel ? renderLabel(label) : label}
        </span>
        <span className="font-serif text-[13px] italic text-foreground/90">{word}</span>
      </div>
      <div className="flex gap-1">
        {BAND_ORDER.map((_, i) => (
          <div
            key={i}
            className="h-1.5 flex-1 rounded-[1px]"
            style={{
              background: i < step ? hue : "rgba(120,130,150,0.18)",
              opacity: i < step ? 0.9 : 1,
            }}
          />
        ))}
      </div>
    </div>
  );
}
