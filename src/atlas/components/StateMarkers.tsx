import { useMemo } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import type { NodeBanded } from "@/data/types";
import { CENTROIDS } from "@/atlas/centroids";
import {
  MORPH_COLOR,
  colorFor,
  evidenceOpacity,
  splitMorphology,
} from "@/atlas/morphology";
import { latLngToVec3 } from "@/atlas/projection";
import { useAtlasStore, morphologyPasses } from "@/atlas/store";

export const MARKER_RADIUS = 0.018; // CRITICAL: uniform — never scaled by band

interface Props {
  nodes: NodeBanded[];
  onPick: (id: string) => void;
}

export function StateMarkers({ nodes, onPick }: Props) {
  const filters = useAtlasStore((s) => s.filters);
  const layersOn = filters.layers.has("state");
  const morphFilter = filters.morphologies;
  const selectedId = useAtlasStore((s) => s.selectedNodeId);

  const items = useMemo(
    () =>
      nodes
        .filter((n) => CENTROIDS[n.node_id])
        .map((n) => {
          const [lat, lng] = CENTROIDS[n.node_id];
          const pos = latLngToVec3(lat, lng, 1 + MARKER_RADIUS);
          const { primary, secondary } = splitMorphology(n.morphology);
          const isOpaque = (n.evidence_strength ?? "").toUpperCase() === "OPAQUE";
          const baseOpacity = evidenceOpacity(n.evidence_strength);
          const passes = morphologyPasses(morphFilter, primary);
          const dim = !passes;
          return {
            node: n,
            pos,
            color: colorFor(n.morphology),
            secondaryColor: secondary ? MORPH_COLOR[secondary] : null,
            opacity: dim ? Math.min(baseOpacity, 0.12) : baseOpacity,
            isOpaque,
            selected: selectedId === n.node_id,
          };
        }),
    [nodes, morphFilter, selectedId],
  );

  if (!layersOn) return null;

  return (
    <group>
      {items.map(({ node, pos, color, opacity, isOpaque, selected }) => (
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
            <sphereGeometry args={[MARKER_RADIUS, 16, 16]} />
            <meshBasicMaterial color={color} transparent opacity={opacity} />
          </mesh>
          {/* OPAQUE ghost ring — present but bandless */}
          {isOpaque && <GhostRing color={color} />}
          {selected && <SelectedRing color={color} />}
        </group>
      ))}
    </group>
  );
}

function GhostRing({ color }: { color: string }) {
  const geometry = useMemo(() => {
    const pts: number[] = [];
    const segs = 48;
    const r = MARKER_RADIUS * 1.9;
    for (let i = 0; i < segs; i++) {
      const a0 = (i / segs) * Math.PI * 2;
      const a1 = ((i + 1) / segs) * Math.PI * 2;
      if (i % 2 === 0) continue; // dashed
      pts.push(Math.cos(a0) * r, Math.sin(a0) * r, 0, Math.cos(a1) * r, Math.sin(a1) * r, 0);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);
  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color={color} transparent opacity={0.55} />
    </lineSegments>
  );
}

function SelectedRing({ color }: { color: string }) {
  const geometry = useMemo(() => {
    const pts: number[] = [];
    const segs = 64;
    const r = MARKER_RADIUS * 2.4;
    for (let i = 0; i < segs; i++) {
      const a0 = (i / segs) * Math.PI * 2;
      const a1 = ((i + 1) / segs) * Math.PI * 2;
      pts.push(Math.cos(a0) * r, Math.sin(a0) * r, 0, Math.cos(a1) * r, Math.sin(a1) * r, 0);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);
  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color={color} transparent opacity={0.95} />
    </lineSegments>
  );
}

/** Hover label shown beside the selected node. */
export function SelectedLabel({ node, pos }: { node: NodeBanded; pos: THREE.Vector3 }) {
  return (
    <Html position={pos} distanceFactor={6} style={{ pointerEvents: "none" }}>
      <div className="mono text-[10px] uppercase tracking-wider text-foreground/80 whitespace-nowrap pl-2">
        {node.name}
      </div>
    </Html>
  );
}
