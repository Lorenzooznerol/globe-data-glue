import { useAtlasStore } from "@/atlas/store";
import { THEMES } from "@/atlas/theme";

export function TrajectoryLegend() {
  const themeName = useAtlasStore((s) => s.theme);
  const theme = THEMES[themeName];
  return (
    <div className="flex flex-col gap-2">
      <span className="mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        Forecasts
      </span>
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className="block h-2.5 w-2.5 rounded-sm"
          style={{ background: theme.accent }}
        />
        <span className="font-serif text-[12px] text-foreground/85">
          Has a forecast
        </span>
      </div>
      <p className="font-serif text-[11px] italic leading-snug text-muted-foreground">
        Tap a highlighted country to see its prediction. Or open the full register.
      </p>
    </div>
  );
}
