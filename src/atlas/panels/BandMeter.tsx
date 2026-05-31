import { bandStep, BAND_ORDER, type BandCode } from "@/atlas/plainLanguage";

interface Props {
  label: string;
  bandCode: string;
  hue: string;
}

export function BandMeter({ label, bandCode, hue }: Props) {
  const step = bandStep(bandCode); // 0..5
  const wordKey = (bandCode ?? "").trim().toUpperCase() as BandCode;
  const word = step > 0
    ? ({ CI: "almost none", IN: "minimal", AS: "partial", S: "substantial", C: "comprehensive" }[wordKey] ?? "—")
    : "—";

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <span className="mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {label}
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
