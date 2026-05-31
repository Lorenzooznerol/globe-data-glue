import { useMemo } from "react";
import type { NodeBanded } from "@/data/types";
import {
  BANDS,
  MORPH_COLOR,
  bandIndex,
  evidenceOpacity,
  splitMorphology,
  type MorphCode,
} from "@/atlas/morphology";

/**
 * The project's signature glyph. Reusable, inline SVG, no three.
 * intent (paper_band) -> instrument (mid) -> reality (realization_band)
 */
interface SignatureProps {
  node: Pick<NodeBanded, "morphology" | "paper_band" | "realization_band" | "evidence_strength">;
  width?: number;
  height?: number;
}

const W = 132;
const H = 96;
const PADX = 22;
const PADY = 12;

export function Signature({ node, width = W, height = H }: SignatureProps) {
  const { primary, secondary } = splitMorphology(node.morphology);
  const color = primary ? MORPH_COLOR[primary] : "#888";
  const secondaryColor = secondary ? MORPH_COLOR[secondary] : null;
  const opacity = evidenceOpacity(node.evidence_strength);

  const innerW = W - PADX * 2;
  const innerH = H - PADY * 2 - 10; // 10px reserved for column labels

  // y for band ordinal (CI=0 low realization -> C=4 high realization). Higher band -> higher on chart (smaller y).
  const yFor = (band: string) => {
    const i = bandIndex(band);
    const step = innerH / (BANDS.length - 1);
    return PADY + (BANDS.length - 1 - i) * step;
  };

  const xIntent = PADX;
  const xInst = PADX + innerW / 2;
  const xReal = PADX + innerW;

  const intentY = yFor(node.paper_band);
  const realY = yFor(node.realization_band);

  // Instrument y by mechanism
  const midY = PADY + innerH / 2;
  const instrumentY = useMemo(() => {
    if (primary === "M3") return PADY + 4; // held high
    if (primary === "M1") return midY + innerH * 0.15; // dips below mid (the lag)
    // M6, M7, others: straight line through mid of intent->reality
    return (intentY + realY) / 2;
  }, [primary, intentY, realY, midY, innerH]);

  const dashed = primary === "M6";
  const polylinePoints = `${xIntent},${intentY} ${xInst},${instrumentY} ${xReal},${realY}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="intent to reality signature"
    >
      {/* Gridlines */}
      {BANDS.map((b, i) => {
        const y = PADY + (BANDS.length - 1 - i) * (innerH / (BANDS.length - 1));
        return (
          <g key={b}>
            <line
              x1={PADX}
              x2={PADX + innerW}
              y1={y}
              y2={y}
              stroke="currentColor"
              strokeOpacity={0.08}
              strokeWidth={0.5}
            />
            <text
              x={PADX - 4}
              y={y + 2.5}
              fontSize={6}
              textAnchor="end"
              fill="currentColor"
              fillOpacity={0.45}
              fontFamily="var(--font-mono)"
            >
              {b}
            </text>
          </g>
        );
      })}

      {/* Polyline */}
      <polyline
        points={polylinePoints}
        fill="none"
        stroke={color}
        strokeOpacity={opacity}
        strokeWidth={1.2}
        strokeDasharray={dashed ? "3 3" : undefined}
      />

      {/* Intent — filled dot */}
      <circle cx={xIntent} cy={intentY} r={2.6} fill={color} fillOpacity={opacity} />

      {/* Instrument marker by mechanism */}
      <InstrumentMarker code={primary} x={xInst} y={instrumentY} color={color} opacity={opacity} />

      {/* Reality — hollow ring (Prompt 2 will encode prediction status) */}
      <circle
        cx={xReal}
        cy={realY}
        r={3}
        fill="none"
        stroke={color}
        strokeOpacity={opacity}
        strokeWidth={1.2}
      />

      {/* Secondary morphology in M3+M4 etc. — small open diamond next to reality */}
      {secondaryColor && (
        <polygon
          points={`${xReal + 7},${realY - 3} ${xReal + 10},${realY} ${xReal + 7},${realY + 3} ${xReal + 4},${realY}`}
          fill="none"
          stroke={secondaryColor}
          strokeOpacity={opacity}
          strokeWidth={1}
        />
      )}

      {/* Column labels */}
      {[
        ["int", xIntent],
        ["inst", xInst],
        ["real", xReal],
      ].map(([label, x]) => (
        <text
          key={label as string}
          x={x as number}
          y={H - 3}
          fontSize={6.5}
          textAnchor="middle"
          fill="currentColor"
          fillOpacity={0.55}
          fontFamily="var(--font-mono)"
        >
          {label}
        </text>
      ))}
    </svg>
  );
}

function InstrumentMarker({
  code,
  x,
  y,
  color,
  opacity,
}: {
  code: MorphCode | null;
  x: number;
  y: number;
  color: string;
  opacity: number;
}) {
  if (code === "M3") {
    // Open square — a gate
    return (
      <rect
        x={x - 3}
        y={y - 3}
        width={6}
        height={6}
        fill="none"
        stroke={color}
        strokeOpacity={opacity}
        strokeWidth={1}
      />
    );
  }
  if (code === "M1") {
    // Downward chevron — the lag
    return (
      <polyline
        points={`${x - 4},${y - 2} ${x},${y + 3} ${x + 4},${y - 2}`}
        fill="none"
        stroke={color}
        strokeOpacity={opacity}
        strokeWidth={1.2}
      />
    );
  }
  // default dot
  return <circle cx={x} cy={y} r={2} fill={color} fillOpacity={opacity} />;
}
