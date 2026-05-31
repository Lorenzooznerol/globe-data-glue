import type { GlyphKind } from "@/atlas/trajectory";

interface Props {
  kind: GlyphKind;
  color?: string;
  size?: number;
  reducedMotion?: boolean;
  title?: string;
}

export function DirectionGlyph({
  kind,
  color = "currentColor",
  size = 22,
  reducedMotion,
  title,
}: Props) {
  const s = size;
  const common = {
    width: s,
    height: s,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-label": title ?? kind,
    role: "img",
  };
  switch (kind) {
    case "holds":
      // steady short bar inside a ring with a centered dot
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <line x1="7" y1="12" x2="17" y2="12" />
          <circle cx="12" cy="12" r="1.5" fill={color} stroke="none" />
        </svg>
      );
    case "rising":
      // up arrow
      return (
        <svg {...common}>
          <line x1="12" y1="19" x2="12" y2="5" />
          <polyline points="6 11 12 5 18 11" />
        </svg>
      );
    case "eroding": {
      // hollow dashed ring (animated dash if motion allowed)
      const dash = "3 4";
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" strokeDasharray={dash}>
            {!reducedMotion && (
              <animate
                attributeName="stroke-dashoffset"
                from="0"
                to="14"
                dur="2.2s"
                repeatCount="indefinite"
              />
            )}
          </circle>
        </svg>
      );
    }
    default:
      return null;
  }
}
