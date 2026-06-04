import type { OverlayCoordinates } from "@/data/types";

const AXES: { key: keyof OverlayCoordinates; label: string }[] = [
  { key: "gaze", label: "gaze" },
  { key: "surveillance_breadth", label: "breadth" },
  { key: "institutional_transparency", label: "transparency" },
  { key: "reciprocity", label: "reciprocity" },
];

// Heuristic scale from textual values → 0..1
const SCALE: Record<string, number> = {
  none: 0,
  limited: 0.35,
  low: 0.3,
  medium: 0.55,
  broad: 0.85,
  high: 0.9,
  "mixed-ex-ante": 0.5,
};

function toScalar(v: string): number {
  const k = (v || "").toLowerCase();
  return SCALE[k] ?? 0.5;
}

export function MiniRadar({ coords }: { coords: OverlayCoordinates }) {
  const size = 180;
  const cx = size / 2;
  const cy = size / 2;
  const r = 70;
  const points = AXES.map((a, i) => {
    const angle = (Math.PI * 2 * i) / AXES.length - Math.PI / 2;
    const value = toScalar(coords[a.key].value);
    const px = cx + Math.cos(angle) * r * value;
    const py = cy + Math.sin(angle) * r * value;
    return { ...a, angle, value, px, py };
  });
  const poly = points.map((p) => `${p.px},${p.py}`).join(" ");

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      role="img"
      aria-label="inferred coordinates radar"
    >
      {[0.33, 0.66, 1].map((k) => (
        <circle
          key={k}
          cx={cx}
          cy={cy}
          r={r * k}
          fill="none"
          stroke="var(--border)"
          strokeWidth={0.5}
          strokeDasharray="2 3"
        />
      ))}
      {points.map((p, i) => {
        const ex = cx + Math.cos(p.angle) * r;
        const ey = cy + Math.sin(p.angle) * r;
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={ex}
            y2={ey}
            stroke="var(--border)"
            strokeWidth={0.5}
          />
        );
      })}
      <polygon
        points={poly}
        fill="var(--epistemic-inferred)"
        fillOpacity={0.15}
        stroke="var(--epistemic-inferred)"
        strokeWidth={1}
        strokeDasharray="3 2"
      />
      {points.map((p, i) => {
        const lx = cx + Math.cos(p.angle) * (r + 14);
        const ly = cy + Math.sin(p.angle) * (r + 14);
        return (
          <text
            key={i}
            x={lx}
            y={ly}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={8}
            fontFamily="ui-monospace, monospace"
            fill="var(--muted-foreground)"
            style={{ letterSpacing: "0.12em", textTransform: "uppercase" }}
          >
            {p.label}
          </text>
        );
      })}
    </svg>
  );
}
