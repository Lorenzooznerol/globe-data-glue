import type { GlyphKind } from "@/atlas/trajectory";

interface Props {
  kind: GlyphKind;
  color: string;
  size?: number;
  reducedMotion?: boolean;
  title?: string;
}

export function DirectionGlyph({ kind, color, size = 18, reducedMotion, title }: Props) {
  const s = size;
  const stroke = color;
  const common = {
    width: s,
    height: s,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke,
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-label": title,
    role: "img",
  };
  switch (kind) {
    case "stability":
      // steady horizontal bar inside a ring
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <line x1="6" y1="12" x2="18" y2="12" />
        </svg>
      );
    case "enactment":
      // upward arrow
      return (
        <svg {...common}>
          <line x1="12" y1="19" x2="12" y2="5" />
          <polyline points="6 11 12 5 18 11" />
        </svg>
      );
    case "lag":
      // half-filled forward chevron
      return (
        <svg {...common}>
          <path d="M5 5 L13 12 L5 19 Z" fill={color} fillOpacity={0.45} stroke="none" />
          <path d="M13 5 L21 12 L13 19" />
        </svg>
      );
    case "durability": {
      // dashed ring; animated dasharray when motion allowed
      const dash = reducedMotion ? "4 3" : "3 4";
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" strokeDasharray={dash}>
            {!reducedMotion && (
              <animate
                attributeName="stroke-dashoffset"
                from="0"
                to="14"
                dur="1.6s"
                repeatCount="indefinite"
              />
            )}
          </circle>
        </svg>
      );
    }
    case "refinement":
      // hollow diamond
      return (
        <svg {...common}>
          <path d="M12 3 L21 12 L12 21 L3 12 Z" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
  }
}
