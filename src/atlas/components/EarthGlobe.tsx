import { lazy, Suspense, useEffect, useMemo, useRef } from "react";
import type { GlobeMethods } from "react-globe.gl";
import * as THREE from "three";
import { geoCentroid } from "d3-geo";
import type { DataStore } from "@/data/store";
import { useCountries } from "@/atlas/useCountries";
import { useAtlasStore } from "@/atlas/store";
import { NODE_CENTROIDS, isoToNodeId } from "@/atlas/iso";
import { colorFor, evidenceOpacity, splitMorphology } from "@/atlas/morphology";
import { plainHeadline } from "@/atlas/plainLanguage";

// Lazy-load react-globe.gl: it touches `window` at import time and would
// crash SSR otherwise. EarthGlobe itself is only mounted client-side by the
// route, so this lazy boundary stays on the client.
const Globe = lazy(() => import("react-globe.gl"));

const NEUTRAL_FILL = "rgba(64,72,86,0.18)";
const NEUTRAL_SIDE = "rgba(40,46,56,0.4)";
const STROKE = "rgba(120,130,150,0.35)";
const BG = "#0a0d12";

interface Props {
  store: DataStore;
  width: number;
  height: number;
}

interface Resolved {
  feature: { geometry: unknown; properties: Record<string, unknown> };
  iso: string | undefined;
  nodeId: string | null;
  node: ReturnType<DataStore["nodesBandedById"]["get"]> | null;
}

function hexToRgba(hex: string, alpha: number): string {
  const m = hex.replace("#", "");
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function EarthGlobe({ store, width, height }: Props) {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const features = useCountries();

  const selectedNodeId = useAtlasStore((s) => s.selectedNodeId);
  const hoveredNodeId = useAtlasStore((s) => s.hoveredNodeId);
  const morphologies = useAtlasStore((s) => s.morphologies);
  const reducedMotion = useAtlasStore((s) => s.reducedMotion);
  const flyToken = useAtlasStore((s) => s.flyToken);
  const selectNode = useAtlasStore((s) => s.selectNode);
  const setHovered = useAtlasStore((s) => s.setHovered);

  // One-time controls setup
  useEffect(() => {
    const g = globeRef.current;
    if (!g) return;
    const controls = g.controls();
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 180;
    controls.maxDistance = 600;
    controls.autoRotateSpeed = 0.3;
    g.pointOfView({ altitude: 2.4 }, 0);
  }, []);

  const resolved = useMemo<Resolved[]>(() => {
    return features.map((f) => {
      const iso = (f.properties.ADM0_A3 || f.properties.ISO_A3) as string | undefined;
      const nodeId = isoToNodeId(iso);
      const node = nodeId ? store.nodesBandedById.get(nodeId) ?? null : null;
      return { feature: f, iso, nodeId, node };
    });
  }, [features, store]);

  // Index nodeId -> first matching feature, for camera centroids
  const featureByNode = useMemo(() => {
    const m = new Map<string, Resolved["feature"]>();
    for (const r of resolved) {
      if (r.nodeId && !m.has(r.nodeId)) m.set(r.nodeId, r.feature);
    }
    return m;
  }, [resolved]);

  // Pause auto-rotate while hovering or while a country is selected.
  useEffect(() => {
    const g = globeRef.current;
    if (!g) return;
    g.controls().autoRotate =
      !reducedMotion && !hoveredNodeId && !selectedNodeId;
  }, [reducedMotion, hoveredNodeId, selectedNodeId]);

  // Camera fly-to on selection: use the feature's geographic centroid;
  // fall back to NODE_CENTROIDS (covers ST-EU, which spans 27 members).
  useEffect(() => {
    if (!selectedNodeId) return;
    const g = globeRef.current;
    if (!g) return;
    let lat: number | undefined;
    let lng: number | undefined;
    const fallback = NODE_CENTROIDS[selectedNodeId];
    const feat = featureByNode.get(selectedNodeId);
    if (selectedNodeId !== "ST-EU" && feat && feat.geometry) {
      try {
        const [cLng, cLat] = geoCentroid(feat as never);
        if (Number.isFinite(cLat) && Number.isFinite(cLng)) {
          lat = cLat;
          lng = cLng;
        }
      } catch {
        /* fall through */
      }
    }
    if (lat == null || lng == null) {
      if (!fallback) return;
      lat = fallback[0];
      lng = fallback[1];
    }
    g.pointOfView({ lat, lng, altitude: 1.6 }, reducedMotion ? 0 : 900);
  }, [flyToken, selectedNodeId, reducedMotion, featureByNode]);


  const polygonCapColor = (obj: object): string => {
    const r = obj as Resolved;
    if (!r.node) return NEUTRAL_FILL;
    const baseHex = colorFor(r.node.morphology);
    let alpha = evidenceOpacity(r.node.evidence_strength);
    if (morphologies.size > 0) {
      const { primary } = splitMorphology(r.node.morphology);
      if (!primary || !morphologies.has(primary)) alpha = 0.08;
    }
    if (r.nodeId && r.nodeId === hoveredNodeId) alpha = Math.min(1, alpha + 0.15);
    return hexToRgba(baseHex, alpha);
  };

  const polygonSideColor = (obj: object): string => {
    const r = obj as Resolved;
    if (!r.node) return NEUTRAL_SIDE;
    return hexToRgba(colorFor(r.node.morphology), 0.35);
  };

  const polygonAltitude = (obj: object): number => {
    const r = obj as Resolved;
    if (!r.nodeId) return 0.006;
    if (r.nodeId === hoveredNodeId) return reducedMotion ? 0.05 : 0.07;
    if (r.nodeId === selectedNodeId) return 0.05;
    return 0.01;
  };

  const polygonLabel = (obj: object): string => {
    const r = obj as Resolved;
    if (!r.node) return "";
    const isEU = r.nodeId === "ST-EU" && r.iso !== "EU";
    const subtitle = isEU ? "European Union (member state)" : r.node.name;
    const headline = plainHeadline(r.node.morphology);
    return `
      <div style="
        font-family: var(--font-serif), serif;
        background: rgba(10,13,18,0.92);
        border: 1px solid rgba(120,130,150,0.35);
        padding: 10px 14px;
        max-width: 280px;
        color: #e8e8e8;
        backdrop-filter: blur(6px);
      ">
        <div style="font-size: 15px; letter-spacing:-0.01em; margin-bottom: 4px;">
          ${escapeHtml(subtitle)}
        </div>
        <div style="font-size: 12px; line-height: 1.45; color: #b8b8b8; font-style: italic;">
          ${escapeHtml(headline)}
        </div>
      </div>`;
  };

  const handleHover = (obj: object | null) => {
    const r = obj as Resolved | null;
    setHovered(r?.nodeId ?? null);
    if (typeof document !== "undefined") {
      document.body.style.cursor = r?.nodeId ? "pointer" : "default";
    }
  };

  const handleClick = (obj: object) => {
    const r = obj as Resolved;
    if (r.nodeId) selectNode(r.nodeId, { fly: true });
  };

  const globeMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color("#10141b"),
      roughness: 1,
      metalness: 0,
      emissive: new THREE.Color("#10141b"),
      emissiveIntensity: 0.3,
    });
  }, []);

  return (
    <Suspense fallback={null}>
      <Globe
        ref={globeRef}
        width={width}
        height={height}
        backgroundColor={BG}
        showAtmosphere={false}
        showGraticules={false}
        globeMaterial={globeMaterial}
        polygonsData={resolved}
        polygonGeoJsonGeometry={(obj: object) =>
          (obj as Resolved).feature.geometry as never
        }
        polygonCapColor={polygonCapColor}
        polygonSideColor={polygonSideColor}
        polygonStrokeColor={() => STROKE}
        polygonAltitude={polygonAltitude}
        polygonsTransitionDuration={reducedMotion ? 0 : 260}
        polygonLabel={polygonLabel}
        onPolygonHover={handleHover}
        onPolygonClick={handleClick}
      />
    </Suspense>
  );
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    c === "&" ? "&amp;"
    : c === "<" ? "&lt;"
    : c === ">" ? "&gt;"
    : c === '"' ? "&quot;"
    : "&#39;",
  );
}
