import type { OverlayCoordinates } from "@/data/types";

const AXES: { key: keyof OverlayCoordinates; label: string }[] = [
  { key: "gaze", label: "GAZE" },
  { key: "surveillance_breadth", label: "BREADTH" },
  { key: "institutional_transparency", label: "TRANSPARENCY" },
  { key: "reciprocity", label: "RECIPROCITY" },
];

const SCALE: Record<string, number> = {
  none: 0,
  limited: 0.35,
  low: 0.3,
  medium: 0.55,
  broad: 0.85,
  high: 0.9,
  "mixed-ex-ante": 0.5,
  "ex-ante": 0.6,
  "ex-post": 0.45,
};

function toScalar(v: string): number {
  const k = (v || "").toLowerCase();
  return SCALE[k] ?? 0.5;
}

export function MiniRadar({ coords }: { coords: OverlayCoordinates }) {
  const size = 240;
  const cx = size / 2;
  const cy = size / 2;
  const r = 84;
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
      {/* concentric rings — three steps, hairline */}
      {[0.33, 0.66, 1].map((k) => (
        <circle
          key={k}
          cx={cx}
          cy={cy}
          r={r * k}
          fill="none"
          stroke="var(--it-rule-2)"
          strokeWidth={0.6}
          strokeDasharray="2 3"
        />
      ))}
      {/* axes */}
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
            stroke="var(--it-rule-2)"
            strokeWidth={0.6}
          />
        );
      })}
      {/* inferred polygon — soft fill + dashed stroke */}
      <polygon
        points={poly}
        fill="var(--it-prov-inferred)"
        fillOpacity={0.18}
        stroke="var(--it-prov-inferred)"
        strokeWidth={1.2}
        strokeDasharray="4 3"
      />
      {/* vertex dots */}
      {points.map((p, i) => (
        <circle
          key={`d-${i}`}
          cx={p.px}
          cy={p.py}
          r={2}
          fill="var(--it-prov-inferred)"
        />
      ))}
      {/* axis labels */}
      {points.map((p, i) => {
        const lx = cx + Math.cos(p.angle) * (r + 22);
        const ly = cy + Math.sin(p.angle) * (r + 22);
        return (
          <text
            key={`l-${i}`}
            x={lx}
            y={ly}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={9}
            fontFamily="var(--font-mono)"
            fill="var(--it-ink-2)"
            style={{ letterSpacing: "0.18em" }}
          >
            {p.label}
          </text>
        );
      })}
    </svg>
  );
}
