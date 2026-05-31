import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import type { GlobeMethods } from "react-globe.gl";
import * as THREE from "three";
import { geoCentroid } from "d3-geo";
import { renderToStaticMarkup } from "react-dom/server";
import type { DataStore } from "@/data/store";
import type { AtlasNode, GiraiCountry } from "@/data/types";
import { useCountries } from "@/atlas/useCountries";
import { useAtlasStore } from "@/atlas/store";
import { NODE_CENTROIDS, isoToNodeId } from "@/atlas/iso";
import { colorForNode, familyOf, FAMILY_COLOR, OPAQUE_GREY } from "@/atlas/families";
import { plainHeadline } from "@/atlas/plainLanguage";
import { giraiRampColor } from "@/atlas/giraiRamp";
import { directionGlyph } from "@/atlas/trajectory";
import { DirectionGlyph } from "@/atlas/panels/DirectionGlyph";

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
  node: AtlasNode | null;
  girai: GiraiCountry | null;
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
  const selectedIso = useAtlasStore((s) => s.selectedIso);
  const hoveredNodeId = useAtlasStore((s) => s.hoveredNodeId);
  const families = useAtlasStore((s) => s.families);
  const reducedMotion = useAtlasStore((s) => s.reducedMotion);
  const flyToken = useAtlasStore((s) => s.flyToken);
  const mode = useAtlasStore((s) => s.mode);
  const migrationToken = useAtlasStore((s) => s.migrationToken);
  const selectNode = useAtlasStore((s) => s.selectNode);
  const selectIso = useAtlasStore((s) => s.selectIso);
  const setHovered = useAtlasStore((s) => s.setHovered);

  const trajectoryMode = mode === "trajectory";

  // Migration animation progress 0..1 for the 6 nodes with timelines.
  const [migrationT, setMigrationT] = useState(0);
  useEffect(() => {
    if (!trajectoryMode) {
      setMigrationT(0);
      return;
    }
    if (reducedMotion) {
      setMigrationT(1);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const dur = 1400;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setMigrationT(p);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [trajectoryMode, migrationToken, reducedMotion]);

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
      const node = nodeId ? store.nodesById.get(nodeId) ?? null : null;
      const girai = iso ? store.giraiByIso.get(iso) ?? null : null;
      return { feature: f, iso, nodeId, node, girai };
    });
  }, [features, store]);

  const featureByNode = useMemo(() => {
    const m = new Map<string, Resolved["feature"]>();
    for (const r of resolved) {
      if (r.nodeId && !m.has(r.nodeId)) m.set(r.nodeId, r.feature);
    }
    return m;
  }, [resolved]);

  const activeSelectedNodeId = selectedNodeId;

  useEffect(() => {
    const g = globeRef.current;
    if (!g) return;
    g.controls().autoRotate =
      !reducedMotion && !hoveredNodeId && !activeSelectedNodeId && !selectedIso;
  }, [reducedMotion, hoveredNodeId, activeSelectedNodeId, selectedIso]);

  useEffect(() => {
    if (!activeSelectedNodeId) return;
    const g = globeRef.current;
    if (!g) return;
    let lat: number | undefined;
    let lng: number | undefined;
    const fallback = NODE_CENTROIDS[activeSelectedNodeId];
    const feat = featureByNode.get(activeSelectedNodeId);
    if (activeSelectedNodeId !== "ST-EU" && feat && feat.geometry) {
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
  }, [flyToken, activeSelectedNodeId, reducedMotion, featureByNode]);

  const polygonCapColor = (obj: object): string => {
    const r = obj as Resolved;
    let base: string;
    if (r.girai) {
      base = giraiRampColor(r.girai.index_score, 1);
      if (r.nodeId && r.nodeId === hoveredNodeId) {
        // tiny brighten on hover
        base = giraiRampColor(Math.min(100, r.girai.index_score + 10), 1);
      }
    } else {
      base = NEUTRAL_FILL;
    }
    // Family filter: dim countries whose curated node is filtered out.
    if (families.size > 0 && r.node) {
      const fam = familyOf(r.node.morphology);
      if (!fam || !families.has(fam)) {
        return r.girai ? giraiRampColor(r.girai.index_score, 0.25) : NEUTRAL_FILL;
      }
    }
    return base;
  };

  const polygonSideColor = (obj: object): string => {
    const r = obj as Resolved;
    if (r.node) return hexToRgba(colorForNode(r.node), 0.45);
    return NEUTRAL_SIDE;
  };

  // Curated nodes get a family-coloured stroke ring; everything else uses the neutral stroke.
  const polygonStrokeColor = (obj: object): string => {
    const r = obj as Resolved;
    if (r.node) return colorForNode(r.node);
    return STROKE;
  };

  const polygonAltitude = (obj: object): number => {
    const r = obj as Resolved;
    if (r.nodeId === hoveredNodeId && r.nodeId) return reducedMotion ? 0.05 : 0.07;
    if (r.nodeId && r.nodeId === activeSelectedNodeId) return 0.05;
    if (r.iso && r.iso === selectedIso) return 0.04;
    if (r.nodeId) return 0.022; // curated nodes sit raised so the ring is visible
    return 0.006;
  };

  const polygonLabel = (obj: object): string => {
    const r = obj as Resolved;
    if (!r.node && !r.girai) return "";
    let subtitle: string;
    let line: string;
    if (r.node) {
      const isEU = r.nodeId === "ST-EU" && r.iso !== "EU";
      subtitle = isEU ? "European Union (member state)" : r.node.name;
      line = r.node.headline || plainHeadline(r.node.morphology);
      if (r.girai) {
        line += ` · GIRAI ${r.girai.index_score.toFixed(1)} / 100`;
      }
    } else if (r.girai) {
      subtitle = r.girai.country;
      line = `GIRAI ${r.girai.index_score.toFixed(1)} / 100 · rank ${Math.round(
        r.girai.ranking,
      )} of ${store.girai.countries.length}`;
    } else {
      return "";
    }
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
          ${escapeHtml(line)}
        </div>
      </div>`;
  };

  const handleHover = (obj: object | null) => {
    const r = obj as Resolved | null;
    setHovered(r?.nodeId ?? null);
    if (typeof document !== "undefined") {
      const interactive = !!(r && (r.nodeId || r.girai));
      document.body.style.cursor = interactive ? "pointer" : "default";
    }
  };

  const handleClick = (obj: object) => {
    const r = obj as Resolved;
    if (r.nodeId) {
      selectNode(r.nodeId, { fly: true });
      return;
    }
    if (r.iso && r.girai) {
      selectIso(r.iso);
    }
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
        polygonStrokeColor={polygonStrokeColor}
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
