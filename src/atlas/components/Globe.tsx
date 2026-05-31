import { useMemo } from "react";
import * as THREE from "three";

/**
 * Quiet graticule: latitude + longitude circles every 30°, rendered as line segments.
 * Returns a single BufferGeometry consumed by <lineSegments>.
 */
function buildGraticule(radius: number, step = 30, samples = 96): THREE.BufferGeometry {
  const positions: number[] = [];

  // Lines of latitude (parallels)
  for (let lat = -90 + step; lat < 90; lat += step) {
    const phi = (90 - lat) * (Math.PI / 180);
    const ringRadius = radius * Math.sin(phi);
    const y = radius * Math.cos(phi);
    for (let i = 0; i < samples; i++) {
      const t0 = (i / samples) * Math.PI * 2;
      const t1 = ((i + 1) / samples) * Math.PI * 2;
      positions.push(
        Math.cos(t0) * ringRadius, y, Math.sin(t0) * ringRadius,
        Math.cos(t1) * ringRadius, y, Math.sin(t1) * ringRadius,
      );
    }
  }

  // Lines of longitude (meridians)
  for (let lng = -180; lng < 180; lng += step) {
    const theta = (lng + 180) * (Math.PI / 180);
    for (let i = 0; i < samples; i++) {
      const p0 = (i / samples) * Math.PI;
      const p1 = ((i + 1) / samples) * Math.PI;
      const r0 = radius * Math.sin(p0);
      const r1 = radius * Math.sin(p1);
      positions.push(
        -r0 * Math.cos(theta), radius * Math.cos(p0), r0 * Math.sin(theta),
        -r1 * Math.cos(theta), radius * Math.cos(p1), r1 * Math.sin(theta),
      );
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  return geom;
}

export function Globe({ radius = 1 }: { radius?: number }) {
  const graticule = useMemo(() => buildGraticule(radius * 1.001, 30, 96), [radius]);

  return (
    <group>
      {/* Dark sphere, near-black, very low specular */}
      <mesh>
        <sphereGeometry args={[radius, 96, 96]} />
        <meshStandardMaterial
          color="#0a0d12"
          roughness={1}
          metalness={0}
          emissive="#0a0d12"
          emissiveIntensity={0.4}
        />
      </mesh>
      {/* Faint graticule */}
      <lineSegments geometry={graticule}>
        <lineBasicMaterial color="#3a4453" transparent opacity={0.18} />
      </lineSegments>
    </group>
  );
}
