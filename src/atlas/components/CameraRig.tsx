import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useAtlasStore } from "@/atlas/store";
import { easeInOutCubic } from "@/atlas/projection";

const CAMERA_DISTANCE = 2.6;
const FLY_MS = 900;
const AUTO_ROTATE_SPEED = 0.18; // drei units

interface Props {
  /** Resolver: given a node id, return its world-space position (or null). */
  resolvePosition: (id: string) => THREE.Vector3 | null;
}

export function CameraRig({ resolvePosition }: Props) {
  const controls = useRef<OrbitControlsImpl | null>(null);
  const { camera } = useThree();

  const pendingFlyTo = useAtlasStore((s) => s.pendingFlyTo);
  const reducedMotion = useAtlasStore((s) => s.reducedMotion);

  // Tween state
  const tween = useRef<{
    fromPos: THREE.Vector3;
    toPos: THREE.Vector3;
    fromTarget: THREE.Vector3;
    toTarget: THREE.Vector3;
    start: number;
  } | null>(null);

  // Detect prefers-reduced-motion once
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    useAtlasStore.getState().setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) =>
      useAtlasStore.getState().setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Kick off fly-to when a node is selected
  useEffect(() => {
    if (!pendingFlyTo) return;
    const target = resolvePosition(pendingFlyTo.id);
    if (!target) return;

    const targetCamPos = target.clone().normalize().multiplyScalar(CAMERA_DISTANCE);

    if (reducedMotion) {
      camera.position.copy(targetCamPos);
      if (controls.current) {
        controls.current.target.copy(target);
        controls.current.update();
      }
      return;
    }

    tween.current = {
      fromPos: camera.position.clone(),
      toPos: targetCamPos,
      fromTarget: controls.current ? controls.current.target.clone() : new THREE.Vector3(),
      toTarget: target.clone(),
      start: performance.now(),
    };
  }, [pendingFlyTo, resolvePosition, camera, reducedMotion]);

  useFrame(() => {
    const t = tween.current;
    if (!t) return;
    const elapsed = performance.now() - t.start;
    const p = Math.min(1, elapsed / FLY_MS);
    const e = easeInOutCubic(p);

    camera.position.lerpVectors(t.fromPos, t.toPos, e);
    if (controls.current) {
      controls.current.target.lerpVectors(t.fromTarget, t.toTarget, e);
      controls.current.update();
    }
    if (p >= 1) tween.current = null;
  });

  return (
    <OrbitControls
      ref={controls}
      enablePan={false}
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.55}
      minDistance={1.6}
      maxDistance={5}
      autoRotate={!reducedMotion}
      autoRotateSpeed={AUTO_ROTATE_SPEED}
      makeDefault
    />
  );
}
