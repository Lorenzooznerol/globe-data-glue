import { useMemo } from "react";
import * as THREE from "three";
import type { NodeBanded } from "@/data/types";
import { colorFor, evidenceOpacity, splitMorphology } from "@/atlas/morphology";
import { useAtlasStore, morphologyPasses } from "@/atlas/store";
import { MARKER_RADIUS } from "./StateMarkers";

interface Props {
  nodes: NodeBanded[];
  layer: "actor" | "deployer";
  radius: number;
  tiltDeg?: number;
  onPick: (id: string) => void;
}

export function RingLayer({ nodes, layer, radius, tiltDeg = 15, onPick }: Props) {
  const filters = useAtlasStore((s) => s.filters);
  const rings = useAtlasStore((s) => s.rings);
  const selectedId = useAtlasStore((s) => s.selectedNodeId);

  const visible = filters.layers.has(layer) && (layer === "actor" ? rings.actors : rings.deployers);

  const items = useMemo(() => {
    const filtered = nodes.filter((n) => n.layer === layer);
    return filtered.map((n, i) => {
      const angle = (i / Math.max(1, filtered.length)) * Math.PI * 2;
      const tilt = (tiltDeg * Math.PI) / 180;
      const x = Math.cos(angle) * radius;
      const yBase = Math.sin(angle) * radius;
      // tilt around X axis
      const y = yBase * Math.cos(tilt);
      const z = yBase * Math.sin(tilt);
      const pos = new THREE.Vector3(x, y, z);
      const { primary } = splitMorphology(n.morphology);
      const baseOpacity = evidenceOpacity(n.evidence_strength);
      const passes = morphologyPasses(filters.morphologies, primary);
      const opacity = passes ? baseOpacity : Math.min(baseOpacity, 0.12);
      return {
        node: n,
        pos,
        color: colorFor(n.morphology),
        opacity,
        selected: selectedId === n.node_id,
      };
    });
  }, [nodes, layer, radius, tiltDeg, filters.morphologies, selectedId]);

  if (!visible) return null;

  return (
    <group>
      {/* Faint ring */}
      <RingLine radius={radius} tiltDeg={tiltDeg} />
      {items.map(({ node, pos, color, opacity }) => (
        <group key={node.node_id} position={pos}>
          <mesh
            onPointerDown={(e) => {
              e.stopPropagation();
              onPick(node.node_id);
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              document.body.style.cursor = "pointer";
            }}
            onPointerOut={() => {
              document.body.style.cursor = "auto";
            }}
          >
            <sphereGeometry args={[MARKER_RADIUS, 14, 14]} />
            <meshBasicMaterial color={color} transparent opacity={opacity} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function RingLine({ radius, tiltDeg }: { radius: number; tiltDeg: number }) {
  const geometry = useMemo(() => {
    const pts: number[] = [];
    const segs = 256;
    const tilt = (tiltDeg * Math.PI) / 180;
    for (let i = 0; i < segs; i++) {
      const a0 = (i / segs) * Math.PI * 2;
      const a1 = ((i + 1) / segs) * Math.PI * 2;
      const y0 = Math.sin(a0) * radius;
      const y1 = Math.sin(a1) * radius;
      pts.push(
        Math.cos(a0) * radius,
        y0 * Math.cos(tilt),
        y0 * Math.sin(tilt),
        Math.cos(a1) * radius,
        y1 * Math.cos(tilt),
        y1 * Math.sin(tilt),
      );
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, [radius, tiltDeg]);
  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#3a4453" transparent opacity={0.18} />
    </lineSegments>
  );
}
