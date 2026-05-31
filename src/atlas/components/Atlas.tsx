import { useCallback, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import type { DataStore } from "@/data/store";
import { Globe } from "./Globe";
import { CameraRig } from "./CameraRig";
import { StateMarkers, MARKER_RADIUS } from "./StateMarkers";
import { RingLayer } from "./RingLayer";
import { VisionHalo, stateCentroidPos } from "./VisionHalo";
import { useAtlasStore } from "@/atlas/store";

const ACTOR_RING_R = 1.28;
const DEPLOYER_RING_R = 1.48;

interface Props {
  store: DataStore;
}

export function Atlas({ store }: Props) {
  const selectNode = useAtlasStore((s) => s.selectNode);

  // Build a single resolver: id -> world position (state centroid, actor/deployer ring, vision halo)
  const positionMap = useMemo(() => {
    const m = new Map<string, THREE.Vector3>();
    // states
    for (const n of store.raw.nodesBanded) {
      if (n.layer !== "state") continue;
      const p = stateCentroidPos(n.node_id, 1 + MARKER_RADIUS);
      if (p) m.set(n.node_id, p);
    }
    // actors
    const actors = store.raw.nodesBanded.filter((n) => n.layer === "actor");
    actors.forEach((n, i) => {
      const a = (i / Math.max(1, actors.length)) * Math.PI * 2;
      const tilt = (15 * Math.PI) / 180;
      const x = Math.cos(a) * ACTOR_RING_R;
      const yB = Math.sin(a) * ACTOR_RING_R;
      m.set(n.node_id, new THREE.Vector3(x, yB * Math.cos(tilt), yB * Math.sin(tilt)));
    });
    // deployers
    const deployers = store.raw.nodesBanded.filter((n) => n.layer === "deployer");
    deployers.forEach((n, i) => {
      const a = (i / Math.max(1, deployers.length)) * Math.PI * 2;
      const tilt = (15 * Math.PI) / 180;
      const x = Math.cos(a) * DEPLOYER_RING_R;
      const yB = Math.sin(a) * DEPLOYER_RING_R;
      m.set(n.node_id, new THREE.Vector3(x, yB * Math.cos(tilt), yB * Math.sin(tilt)));
    });
    return m;
  }, [store]);

  const resolvePos = useCallback(
    (id: string) => positionMap.get(id) ?? null,
    [positionMap],
  );

  const handlePick = useCallback((id: string) => selectNode(id), [selectNode]);

  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0, 3.2], fov: 38 }}
      gl={{ antialias: true, alpha: false }}
      onCreated={({ scene }) => {
        scene.background = new THREE.Color("#0a0d12");
      }}
    >
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 2, 4]} intensity={0.4} color="#c9d0db" />

      <Globe radius={1} />
      <StateMarkers nodes={store.raw.nodesBanded} onPick={handlePick} />
      <RingLayer
        nodes={store.raw.nodesBanded}
        layer="actor"
        radius={ACTOR_RING_R}
        onPick={handlePick}
      />
      <RingLayer
        nodes={store.raw.nodesBanded}
        layer="deployer"
        radius={DEPLOYER_RING_R}
        onPick={handlePick}
      />
      <VisionHalo
        visions={store.raw.nodesVision}
        edges={store.raw.edges.filter((e) => e.included.toLowerCase() === "yes" || e.included.toLowerCase() === "no")}
        resolveNodePos={resolvePos}
        onPick={handlePick}
      />

      <CameraRig resolvePosition={resolvePos} />
    </Canvas>
  );
}
