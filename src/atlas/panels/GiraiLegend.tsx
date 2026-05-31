import { useAtlasStore } from "@/atlas/store";
import { giraiGradientCss, THEMES } from "@/atlas/theme";
import { GIRAI_INFO_TEXT, InfoPopover } from "./InfoPopover";

export function GiraiLegend() {
  const theme = useAtlasStore((s) => s.theme);
  const gradient = giraiGradientCss(THEMES[theme]);
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <span className="mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Movement (GIRAI index)
        </span>
        <InfoPopover label="About GIRAI">{GIRAI_INFO_TEXT}</InfoPopover>
      </div>
      <div
        className="h-2 w-full rounded-[1px]"
        style={{ background: gradient }}
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
