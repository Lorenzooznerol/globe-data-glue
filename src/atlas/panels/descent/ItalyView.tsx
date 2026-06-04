import { useCallback, useEffect, useMemo, useState } from "react";
import type { DataStore } from "@/data/store";
import type {
  AtlasNode,
  CountryOverlay,
  EpistemicLevel,
  OverlaySource,
} from "@/data/types";
import { useAtlasStore } from "@/atlas/store";

interface Props {
  store: DataStore;
  node: AtlasNode;
  overlay: CountryOverlay;
}

type Focus = {
  id: string;
  text: string;
  epistemic: EpistemicLevel;
  sources: OverlaySource[];
} | null;

const W = 900;
const H = 720;
const CX = W / 2;
const CY = H / 2;
const BASE_R = 290;
const CORE_R = 110;
const RADAR_R = 56;

export function ItalyView({ store: _store, node, overlay }: Props) {
  const selectNode = useAtlasStore((s) => s.selectNode);
  const reducedMotion = useAtlasStore((s) => s.reducedMotion);
  const [focus, setFocus] = useState<Focus>(null);
  const [zoomed, setZoomed] = useState(false);
  const [toVerifyOpen, setToVerifyOpen] = useState(false);

  // Hide the globe behind.
  useEffect(() => {
    document.body.setAttribute("data-descent", "on");
    return () => document.body.removeAttribute("data-descent");
  }, []);

  const close = useCallback(() => selectNode(null), [selectNode]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (toVerifyOpen) setToVerifyOpen(false);
      else if (zoomed) setZoomed(false);
      else if (focus) setFocus(null);
      else close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomed, focus, toVerifyOpen, close]);

  // Index sources & claims.
  const sourceById = useMemo(() => {
    const m = new Map<string, OverlaySource>();
    for (const s of overlay.sources ?? []) m.set(s.source_id, s);
    return m;
  }, [overlay.sources]);

  const claimById = useMemo(() => {
    const m = new Map<string, (typeof overlay.claims)[number]>();
    for (const c of overlay.claims ?? []) m.set(c.claim_id, c);
    return m;
  }, [overlay.claims]);

  const resolveClaim = useCallback(
    (claimId: string): Focus => {
      const c = claimById.get(claimId);
      if (!c) return null;
      const ids = (c.source_ids || "")
        .split(";")
        .map((x) => x.trim())
        .filter(Boolean);
      const sources = ids
        .map((id) => sourceById.get(id))
        .filter((s): s is OverlaySource => !!s);
      return {
        id: claimId,
        text: c.claim_text,
        epistemic: c.epistemic_level as EpistemicLevel,
        sources,
      };
    },
    [claimById, sourceById],
  );

  // === Geometry ===
  const giraiPct = 61.8;
  const giraiRank = 7;
  const giraiOf = 138;

  const authorities = [
    { id: "agid", label: "AgID", angle: -160, claim: "C-IT-02", flag: false },
    { id: "acn", label: "ACN", angle: -20, claim: "C-IT-05", flag: true },
  ];

  const triggers = [
    { id: "deepfake", label: "Deepfake crime", claim: "C-IT-03", angle: -75, shape: "triangle" as const },
    { id: "sectoral", label: "Sector rules", claim: "C-IT-02", angle: 25, shape: "hex" as const },
    { id: "minors", label: "Under-14 gate", claim: "C-IT-04", angle: 90, shape: "square" as const },
    { id: "fund", label: "€1bn fund", claim: "C-IT-07", angle: 155, shape: "euro" as const },
    { id: "decrees", label: "Decrees · Oct '26", claim: "C-IT-07", angle: 215, shape: "clock" as const },
  ];

  const axes = [
    {
      key: "gaze",
      label: "Gaze",
      val: 0.6,
      reading: "Mixed gaze: ex-ante for conformity & sectoral disclosure; ex-post for the new criminal offence.",
    },
    {
      key: "breadth",
      label: "Breadth",
      val: 0.9,
      reading: "Broad scope — all AI/GPAI as defined by the EU AI Act, with no national risk taxonomy.",
    },
    {
      key: "transparency",
      label: "Transparency",
      val: 0.55,
      reading: "Medium — supervisors are government agencies, not independent authorities.",
    },
    {
      key: "reciprocity",
      label: "Reciprocity",
      val: 0.3,
      reading: "Limited — information rights for workers/clients; no horizontal right to contest beyond AI Act + GDPR Art.22.",
    },
  ];

  const pos = (angleDeg: number, r: number) => {
    const a = (angleDeg * Math.PI) / 180;
    return { x: CX + Math.cos(a) * r, y: CY + Math.sin(a) * r };
  };

  // GIRAI arc on a circle just outside the core
  const giraiArcCircR = CORE_R + 10;
  const giraiCirc = 2 * Math.PI * giraiArcCircR;
  const giraiArcLen = giraiCirc * (giraiPct / 100);

  // Radar polygon + axis spokes
  const radarPts = axes
    .map((a, i) => {
      const ang = -Math.PI / 2 + (i * 2 * Math.PI) / axes.length;
      const r = RADAR_R * a.val;
      return `${CX + Math.cos(ang) * r},${CY + Math.sin(ang) * r}`;
    })
    .join(" ");
  const radarSpokes = axes.map((_, i) => {
    const ang = -Math.PI / 2 + (i * 2 * Math.PI) / axes.length;
    return {
      x2: CX + Math.cos(ang) * RADAR_R,
      y2: CY + Math.sin(ang) * RADAR_R,
    };
  });

  const showCoord = (i: number) =>
    setFocus({
      id: `coord-${axes[i].key}`,
      text: axes[i].reading,
      epistemic: "INFERRED",
      sources: [],
    });

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-30 bg-background"
      role="dialog"
      aria-label={`${node.name} — visual layered view`}
      onClick={() => {
        setFocus(null);
        setToVerifyOpen(false);
      }}
    >
      {/* Top-left title */}
      <div className="absolute left-4 top-4 z-10">
        <div className="mono text-[9px] uppercase tracking-[0.28em] text-muted-foreground">
          {node.region ?? "Europe"} · Italy
        </div>
        <div className="mt-1 font-serif text-[14px] leading-tight text-foreground/85">
          Law 132/2025 on the EU AI Act
        </div>
      </div>

      {/* Top-right close */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          close();
        }}
        className="mono absolute right-4 top-4 z-10 rounded-full border border-border/60 bg-background/80 px-3 py-1.5 text-[10px] uppercase tracking-[0.24em] text-muted-foreground backdrop-blur-md transition-colors hover:text-foreground"
      >
        Close · Esc
      </button>

      {/* On-demand focus line */}
      <div
        className="pointer-events-none absolute inset-x-0 top-20 z-10 flex justify-center px-4"
        aria-live="polite"
      >
        {focus && (
          <div
            className="pointer-events-auto flex max-w-[680px] flex-wrap items-center gap-x-3 gap-y-1.5 rounded-md border border-border/60 bg-background/95 px-4 py-2.5 backdrop-blur-md"
            style={{
              animation: reducedMotion
                ? "descent-fade 160ms ease-out both"
                : "descent-enter 220ms ease-out both",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-serif text-[14.5px] leading-snug text-foreground">{focus.text}</p>
            <div className="flex flex-wrap items-center gap-1.5">
              {focus.sources.length > 0 ? (
                focus.sources.map((s) => (
                  <ProvChip key={s.source_id} src={s} level={focus.epistemic} />
                ))
              ) : (
                <ProvChip level={focus.epistemic} />
              )}
            </div>
          </div>
        )}
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid meet"
        onClick={(e) => e.stopPropagation()}
      >
        <defs>
          <radialGradient id="it-core" cx="50%" cy="38%" r="68%">
            <stop offset="0%" stopColor="hsl(var(--primary) / 0.95)" />
            <stop offset="100%" stopColor="hsl(var(--primary) / 0.55)" />
          </radialGradient>
          <radialGradient id="it-shadow" cx="50%" cy="80%" r="55%">
            <stop offset="0%" stopColor="hsl(var(--primary) / 0.32)" />
            <stop offset="100%" stopColor="hsl(var(--primary) / 0)" />
          </radialGradient>
        </defs>

        {/* Camera group: zooms into the radar on core click */}
        <g
          style={{
            transformOrigin: `${CX}px ${CY}px`,
            transform: zoomed && !reducedMotion ? "scale(3.4)" : "scale(1)",
            transition: reducedMotion
              ? "opacity 200ms ease-out"
              : "transform 720ms cubic-bezier(0.22, 1, 0.36, 1)",
            opacity: reducedMotion && zoomed ? 0.85 : 1,
          }}
        >
          {/* BASE RING — EU AI Act baseline (broad, quiet) */}
          <g
            style={{ cursor: "pointer" }}
            onMouseEnter={() =>
              setFocus(resolveClaim("C-IT-04"))
            }
          >
            <circle
              cx={CX}
              cy={CY}
              r={BASE_R}
              fill="none"
              stroke="hsl(var(--muted-foreground) / 0.32)"
              strokeWidth={26}
            />
            <text
              x={CX}
              y={CY - BASE_R - 14}
              textAnchor="middle"
              fontFamily="ui-monospace, monospace"
              fontSize={10}
              letterSpacing={2.5}
              fill="hsl(var(--muted-foreground))"
            >
              EU AI ACT · BASELINE
            </text>
          </g>

          {/* Core elevation shadow (lifts the national core above the ring) */}
          <ellipse
            cx={CX}
            cy={CY + CORE_R + 7}
            rx={CORE_R * 0.95}
            ry={10}
            fill="url(#it-shadow)"
          />

          {/* GIRAI arc on the core perimeter */}
          <circle
            cx={CX}
            cy={CY}
            r={giraiArcCircR}
            fill="none"
            stroke="hsl(var(--muted-foreground) / 0.22)"
            strokeWidth={2.5}
          />
          <circle
            cx={CX}
            cy={CY}
            r={giraiArcCircR}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth={2.5}
            strokeDasharray={`${giraiArcLen} ${giraiCirc}`}
            strokeLinecap="round"
            transform={`rotate(-90 ${CX} ${CY})`}
            style={{ cursor: "pointer" }}
            onMouseEnter={() => setFocus(resolveClaim("C-IT-06"))}
          />

          {/* NATIONAL CORE = Law 132/2025 */}
          <g
            style={{ cursor: "pointer" }}
            onClick={(e) => {
              e.stopPropagation();
              setZoomed((z) => !z);
            }}
            onMouseEnter={() => setFocus(resolveClaim("C-IT-01"))}
          >
            <circle
              cx={CX}
              cy={CY}
              r={CORE_R}
              fill="url(#it-core)"
              stroke="hsl(var(--primary))"
              strokeWidth={1.5}
            />
            <text
              x={CX}
              y={CY - 24}
              textAnchor="middle"
              fontFamily="ui-serif, Georgia, serif"
              fontSize={17}
              fontWeight={500}
              fill="hsl(var(--primary-foreground))"
            >
              Law 132/2025
            </text>
            <text
              x={CX}
              y={CY - 6}
              textAnchor="middle"
              fontFamily="ui-monospace, monospace"
              fontSize={8.5}
              letterSpacing={2}
              fill="hsl(var(--primary-foreground) / 0.85)"
            >
              NATIONAL CORE
            </text>
            <text
              x={CX}
              y={CY + 18}
              textAnchor="middle"
              fontFamily="ui-monospace, monospace"
              fontSize={9}
              letterSpacing={1}
              fill="hsl(var(--primary-foreground) / 0.78)"
            >
              {giraiPct.toFixed(1)} / 100
            </text>
            <text
              x={CX}
              y={CY + 32}
              textAnchor="middle"
              fontFamily="ui-monospace, monospace"
              fontSize={8}
              letterSpacing={1}
              fill="hsl(var(--primary-foreground) / 0.65)"
            >
              #{giraiRank} of {giraiOf}
            </text>
          </g>

          {/* COORDINATES RADAR — innermost, dashed (INFERRED) */}
          <g>
            {radarSpokes.map((l, i) => (
              <line
                key={i}
                x1={CX}
                y1={CY}
                x2={l.x2}
                y2={l.y2}
                stroke="hsl(var(--primary-foreground) / 0.4)"
                strokeWidth={0.6}
                strokeDasharray="2 3"
              />
            ))}
            <polygon
              points={radarPts}
              fill="hsl(var(--primary-foreground) / 0.15)"
              stroke="hsl(var(--primary-foreground) / 0.85)"
              strokeWidth={1.1}
              strokeDasharray="3 3"
            />
            {axes.map((a, i) => {
              const ang = -Math.PI / 2 + (i * 2 * Math.PI) / axes.length;
              const vx = CX + Math.cos(ang) * RADAR_R * a.val;
              const vy = CY + Math.sin(ang) * RADAR_R * a.val;
              const lr = RADAR_R + 14;
              const lx = CX + Math.cos(ang) * lr;
              const ly = CY + Math.sin(ang) * lr;
              return (
                <g
                  key={a.key}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={() => showCoord(i)}
                  onClick={(e) => {
                    e.stopPropagation();
                    showCoord(i);
                  }}
                >
                  <circle cx={vx} cy={vy} r={3} fill="hsl(var(--primary-foreground))" />
                  {zoomed && (
                    <text
                      x={lx}
                      y={ly}
                      textAnchor="middle"
                      fontFamily="ui-monospace, monospace"
                      fontSize={4.5}
                      letterSpacing={0.6}
                      fill="hsl(var(--primary-foreground) / 0.9)"
                    >
                      {a.label.toUpperCase()}
                    </text>
                  )}
                </g>
              );
            })}
          </g>

          {/* AUTHORITIES */}
          {authorities.map((a) => {
            const p = pos(a.angle, CORE_R + 78);
            return (
              <g
                key={a.id}
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setFocus(resolveClaim(a.claim))}
              >
                <line
                  x1={CX + Math.cos((a.angle * Math.PI) / 180) * CORE_R}
                  y1={CY + Math.sin((a.angle * Math.PI) / 180) * CORE_R}
                  x2={p.x}
                  y2={p.y}
                  stroke="hsl(var(--foreground) / 0.22)"
                  strokeWidth={1}
                />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={22}
                  fill="hsl(var(--background))"
                  stroke="hsl(var(--foreground) / 0.55)"
                  strokeWidth={1.2}
                />
                <text
                  x={p.x}
                  y={p.y + 4}
                  textAnchor="middle"
                  fontFamily="ui-serif, Georgia, serif"
                  fontSize={11}
                  fill="hsl(var(--foreground))"
                >
                  {a.label}
                </text>
                {a.flag && (
                  <g>
                    <circle cx={p.x + 17} cy={p.y - 16} r={4.5} fill="hsl(36 96% 56%)" />
                    <circle
                      cx={p.x + 17}
                      cy={p.y - 16}
                      r={7}
                      fill="none"
                      stroke="hsl(36 96% 56%)"
                      strokeOpacity={0.35}
                      strokeWidth={1}
                    />
                  </g>
                )}
              </g>
            );
          })}

          {/* TRIGGERS */}
          {triggers.map((t) => {
            const p = pos(t.angle, CORE_R + 165);
            return (
              <g
                key={t.id}
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setFocus(resolveClaim(t.claim))}
              >
                <TriggerGlyph shape={t.shape} x={p.x} y={p.y} />
                <text
                  x={p.x}
                  y={p.y + 32}
                  textAnchor="middle"
                  fontFamily="ui-monospace, monospace"
                  fontSize={9}
                  letterSpacing={1}
                  fill="hsl(var(--muted-foreground))"
                >
                  {t.label}
                </text>
              </g>
            );
          })}

          {/* TO_VERIFY dot near core edge */}
          <g
            style={{ cursor: "pointer" }}
            onClick={(e) => {
              e.stopPropagation();
              setToVerifyOpen((v) => !v);
              setFocus(null);
            }}
          >
            <circle
              cx={CX + CORE_R - 8}
              cy={CY - CORE_R + 8}
              r={6.5}
              fill="hsl(var(--background))"
              stroke="hsl(var(--muted-foreground) / 0.8)"
              strokeWidth={1}
              strokeDasharray="2 2"
            />
            <circle
              cx={CX + CORE_R - 8}
              cy={CY - CORE_R + 8}
              r={1.8}
              fill="hsl(var(--muted-foreground))"
            />
          </g>
        </g>
      </svg>

      {/* to_verify expansion */}
      {toVerifyOpen && (
        <div
          className="absolute left-1/2 top-24 z-20 max-w-[480px] -translate-x-1/2 rounded-md border border-border/60 bg-background/95 p-4 backdrop-blur-md"
          onClick={(e) => e.stopPropagation()}
          style={{
            animation: reducedMotion
              ? "descent-fade 160ms ease-out both"
              : "descent-enter 220ms ease-out both",
          }}
        >
          <div className="mono mb-3 flex items-center justify-between text-[9px] uppercase tracking-[0.24em] text-muted-foreground">
            <span>Still being verified · {overlay.to_verify?.length ?? 0}</span>
            <button
              type="button"
              onClick={() => setToVerifyOpen(false)}
              className="hover:text-foreground"
            >
              close
            </button>
          </div>
          <ul className="space-y-2">
            {(overlay.to_verify ?? []).map((t, i) => (
              <li key={i} className="font-serif text-[13px] leading-snug text-foreground/85">
                — {t}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Bottom hint */}
      <div className="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex justify-center">
        <span className="mono text-[9px] uppercase tracking-[0.24em] text-muted-foreground">
          hover a shape · click the core to zoom · esc to leave
        </span>
      </div>
    </div>
  );
}

function TriggerGlyph({
  shape,
  x,
  y,
}: {
  shape: "triangle" | "square" | "hex" | "euro" | "clock";
  x: number;
  y: number;
}) {
  const stroke = "hsl(var(--foreground) / 0.75)";
  const fill = "hsl(var(--background))";
  const s = 15;
  switch (shape) {
    case "triangle":
      return (
        <polygon
          points={`${x},${y - s} ${x + s * 0.95},${y + s * 0.8} ${x - s * 0.95},${y + s * 0.8}`}
          fill={fill}
          stroke={stroke}
          strokeWidth={1.2}
        />
      );
    case "square":
      return (
        <rect
          x={x - s * 0.9}
          y={y - s * 0.9}
          width={s * 1.8}
          height={s * 1.8}
          fill={fill}
          stroke={stroke}
          strokeWidth={1.2}
        />
      );
    case "hex": {
      const pts = Array.from({ length: 6 }, (_, i) => {
        const a = (Math.PI / 3) * i - Math.PI / 2;
        return `${x + Math.cos(a) * s},${y + Math.sin(a) * s}`;
      }).join(" ");
      return <polygon points={pts} fill={fill} stroke={stroke} strokeWidth={1.2} />;
    }
    case "euro":
      return (
        <g>
          <circle cx={x} cy={y} r={s} fill={fill} stroke={stroke} strokeWidth={1.2} />
          <text
            x={x}
            y={y + 5}
            textAnchor="middle"
            fontFamily="ui-serif, Georgia, serif"
            fontSize={15}
            fill={stroke}
          >
            €
          </text>
        </g>
      );
    case "clock":
      return (
        <g>
          <circle cx={x} cy={y} r={s} fill={fill} stroke={stroke} strokeWidth={1.2} />
          <line x1={x} y1={y} x2={x} y2={y - s * 0.7} stroke={stroke} strokeWidth={1.3} />
          <line x1={x} y1={y} x2={x + s * 0.55} y2={y} stroke={stroke} strokeWidth={1.3} />
        </g>
      );
  }
}

function ProvChip({
  src,
  level,
}: {
  src?: OverlaySource;
  level: EpistemicLevel;
}) {
  const base =
    "mono inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] transition-colors";
  let styles = "";
  switch (level) {
    case "VERIFIED":
      styles = "bg-foreground/10 text-foreground border border-foreground/40";
      break;
    case "ATTESTED":
      styles = "bg-transparent text-foreground border border-foreground/55";
      break;
    case "INFERRED":
      styles =
        "bg-transparent text-muted-foreground border border-dashed border-muted-foreground/60";
      break;
    case "TO_VERIFY":
    case "SPECULATED":
    case "OPAQUE":
    default:
      styles =
        "bg-transparent text-muted-foreground/75 border border-dotted border-muted-foreground/45";
      break;
  }
  const label = level.toLowerCase().replace("_", " ");
  if (!src || !src.url) {
    return <span className={`${base} ${styles}`}>{label}</span>;
  }
  return (
    <a
      href={src.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`${base} ${styles} hover:text-foreground`}
      title={`${src.title}${src.publisher ? ` — ${src.publisher}` : ""}`}
      onClick={(e) => e.stopPropagation()}
    >
      <span>{label}</span>
      {src.publisher && (
        <>
          <span aria-hidden>·</span>
          <span className="text-[10px] normal-case tracking-normal">{src.publisher}</span>
        </>
      )}
    </a>
  );
}
