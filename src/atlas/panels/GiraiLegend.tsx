import { RAMP_GRADIENT_CSS } from "@/atlas/giraiRamp";

export function GiraiLegend() {
  return (
    <div className="flex flex-col gap-2.5">
      <span className="mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        Movement (GIRAI index)
      </span>
      <div
        className="h-2 w-full rounded-[1px]"
        style={{ background: RAMP_GRADIENT_CSS }}
        aria-hidden
      />
      <div className="mono flex justify-between text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
        <span>barely moving</span>
        <span>comprehensive</span>
      </div>
      <p className="font-serif text-[11px] italic leading-snug text-muted-foreground/80">
        138 countries scored on responsible-AI governance. Grey = not measured. Data: GIRAI 2024
        (2023 data), CC BY-NC-SA.
      </p>
    </div>
  );
}
