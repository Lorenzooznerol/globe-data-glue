import { useMemo } from "react";
import * as THREE from "three";
import { Html, QuadraticBezierLine } from "@react-three/drei";
import type { NodeVision, LegitimacyEdge } from "@/data/types";
import { useAtlasStore } from "@/atlas/store";
import { CENTROIDS } from "@/atlas/centroids";
import { latLngToVec3 } from "@/atlas/projection";

const HALO_RADIUS = 1.85;

interface Props {
  visions: NodeVision[];
  edges: LegitimacyEdge[];
  // node id -> world position (for AC/DP/ST resolution when drawing arcs)
  resolveNodePos: (id: string) => THREE.Vector3 | null;
  onPick: (id: string) => void;
}

export function VisionHalo({ visions, edges, resolveNodePos, onPick }: Props) {
  const visible = useAtlasStore((s) => s.rings.vision && s.filters.layers.has("vision"));

  const positions = useMemo(() => {
    const m = new Map<string, THREE.Vector3>();
    visions.forEach((v, i) => {
      const angle = (i / Math.max(1, visions.length)) * Math.PI * 2;
      const tilt = -10 * (Math.PI / 180);
      const x = Math.cos(angle) * HALO_RADIUS;
      const yBase = Math.sin(angle) * HALO_RADIUS;
      const y = yBase * Math.cos(tilt);
      const z = yBase * Math.sin(tilt);
      m.set(v.node_id, new THREE.Vector3(x, y, z));
    });
    return m;
  }, [visions]);

  // Pre-compute arcs from edges
  const arcs = useMemo(() => {
    return edges
      .map((e) => {
        const from = positions.get(e.from_node) ?? resolveNodePos(e.from_node);
        const to = positions.get(e.to_node) ?? resolveNodePos(e.to_node);
        if (!from || !to) return null;
        // mid point pushed outward for a gentle arc
        const mid = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5);
        const outward = mid.clone().normalize().multiplyScalar(mid.length() * 1.3 + 0.1);
        const included = (e.included ?? "").toLowerCase() === "yes";
        return { edge: e, from, to, mid: outward, included };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [edges, positions, resolveNodePos]);

  if (!visible) return null;

  return (
    <group>
      {/* Vision glyphs + labels */}
      {visions.map((v) => {
        const p = positions.get(v.node_id);
        if (!p) return null;
        return (
          <group key={v.node_id} position={p}>
            <mesh
              onPointerDown={(e) => {
                e.stopPropagation();
                onPick(v.node_id);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                document.body.style.cursor = "pointer";
              }}
              onPointerOut={() => {
                document.body.style.cursor = "auto";
              }}
            >
              <ringGeometry args={[0.015, 0.022, 18]} />
              <meshBasicMaterial color="#9aa3b2" transparent opacity={0.55} side={THREE.DoubleSide} />
            </mesh>
            <Html
              center
              distanceFactor={8}
              style={{ pointerEvents: "none", userSelect: "none" }}
            >
              <div className="mono text-[9px] uppercase tracking-[0.18em] text-foreground/55 whitespace-nowrap">
                {shortVisionLabel(v.node_id, v.name)}
              </div>
            </Html>
          </group>
        );
      })}

      {/* Arcs — included as solid faint, excluded as dashed-fainter */}
      {arcs.map(({ edge, from, to, mid, included }) => (
        <QuadraticBezierLine
          key={edge.edge_id}
          start={from}
          end={to}
          mid={mid}
          color={included ? "#7a8694" : "#5b6470"}
          lineWidth={1}
          transparent
          opacity={included ? 0.35 : 0.18}
          dashed={!included}
          dashScale={120}
        />
      ))}
    </group>
  );
}

// Centroid resolver for use across components — pure
export function stateCentroidPos(nodeId: string, radius = 1.005): THREE.Vector3 | null {
  const c = CENTROIDS[nodeId];
  if (!c) return null;
  return latLngToVec3(c[0], c[1], radius);
}

function shortVisionLabel(id: string, fallback: string): string {
  const map: Record<string, string> = {
    "VN-ROME": "Rome Call",
    "VN-ISLAM": "Islamic",
    "VN-UNESCO": "UNESCO",
    "VN-OECD": "OECD/G7",
    "VN-COE": "CoE",
    "VN-IEEE": "IEEE",
    "VN-GRAV": "Gravities",
    "VN-SAFE": "AI-Safety",
    "VN-SOUTH": "Global South",
  };
  return map[id] ?? fallback;
}
