import { lazy, memo, Suspense, useCallback, useEffect, useMemo, useRef } from "react";
import type { GlobeMethods } from "react-globe.gl";
import * as THREE from "three";
import { geoCentroid } from "d3-geo";
import { renderToStaticMarkup } from "react-dom/server";
import type { DataStore } from "@/data/store";
import type { AtlasNode, GiraiCountry } from "@/data/types";
import { useCountries } from "@/atlas/useCountries";
import { useAtlasStore } from "@/atlas/store";
import { NODE_CENTROIDS, isoToNodeId } from "@/atlas/iso";
import { colorForNode, familyOf } from "@/atlas/families";
import { plainHeadline } from "@/atlas/plainLanguage";
import { giraiColor, THEMES } from "@/atlas/theme";
import { plainPrediction } from "@/atlas/trajectory";

const Globe = lazy(() => import("react-globe.gl"));

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

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    c === "&" ? "&amp;"
    : c === "<" ? "&lt;"
    : c === ">" ? "&gt;"
    : c === '"' ? "&quot;"
    : "&#39;",
  );
}

function EarthGlobeImpl({ store, width, height }: Props) {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const features = useCountries();

  const selectedNodeId = useAtlasStore((s) => s.selectedNodeId);
  const selectedIso = useAtlasStore((s) => s.selectedIso);
  const hoveredNodeId = useAtlasStore((s) => s.hoveredNodeId);
  const families = useAtlasStore((s) => s.families);
  const reducedMotion = useAtlasStore((s) => s.reducedMotion);
  const flyToken = useAtlasStore((s) => s.flyToken);
  const mode = useAtlasStore((s) => s.mode);
  const themeName = useAtlasStore((s) => s.theme);
  const selectNode = useAtlasStore((s) => s.selectNode);
  const selectIso = useAtlasStore((s) => s.selectIso);
  const setHovered = useAtlasStore((s) => s.setHovered);

  const theme = THEMES[themeName];
  const forecastsMode = mode === "forecasts";

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
    try {
      const renderer = g.renderer();
      const pr = typeof window === "undefined" ? 1 : Math.min(2, window.devicePixelRatio || 1);
      renderer.setPixelRatio(pr);
    } catch {
      /* ignore */
    }
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

  // Precompute iso3 → cap color per (theme, families) to keep the hot path O(1).
  const capColorByIso = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of resolved) {
      if (!r.iso) continue;
      let color: string;
      if (r.girai) color = giraiColor(theme, r.girai.index_score);
      else color = theme.countryBase;
      // dim non-matching family nodes
      if (families.size > 0 && r.node) {
        const fam = familyOf(r.node.morphology);
        if (!fam || !families.has(fam)) {
          color = r.girai ? giraiColor(theme, r.girai.index_score, 0.2) : theme.countryBase;
        }
      }
      m.set(r.iso, color);
    }
    return m;
  }, [resolved, theme, families]);

  useEffect(() => {
    const g = globeRef.current;
    if (!g) return;
    g.controls().autoRotate =
      !reducedMotion &&
      !hoveredNodeId &&
      !selectedNodeId &&
      !selectedIso &&
      !forecastsMode;
  }, [reducedMotion, hoveredNodeId, selectedNodeId, selectedIso, forecastsMode]);

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

  const polygonCapColor = useCallback(
    (obj: object): string => {
      const r = obj as Resolved;
      if (forecastsMode) return theme.countryBase;
      if (!r.iso) return theme.countryBase;
      const base = capColorByIso.get(r.iso) ?? theme.countryBase;
      if (r.nodeId && r.nodeId === hoveredNodeId && r.girai) {
        return giraiColor(theme, Math.min(100, r.girai.index_score + 10));
      }
      return base;
    },
    [forecastsMode, theme, capColorByIso, hoveredNodeId],
  );

  const polygonSideColor = useCallback(
    (obj: object): string => {
      const r = obj as Resolved;
      if (r.node) return hexToRgba(colorForNode(r.node), 0.45);
      return theme.countryBase;
    },
    [theme],
  );

  const polygonStrokeColor = useCallback(
    (obj: object): string => {
      const r = obj as Resolved;
      const isFocused =
        (r.nodeId && (r.nodeId === hoveredNodeId || r.nodeId === selectedNodeId)) ||
        (r.iso && r.iso === selectedIso);
      if (isFocused) return theme.borderStrong;
      if (r.node) return colorForNode(r.node);
      return theme.border;
    },
    [theme, hoveredNodeId, selectedNodeId, selectedIso],
  );

  const polygonAltitude = useCallback(
    (obj: object): number => {
      const r = obj as Resolved;
      if (r.nodeId === hoveredNodeId && r.nodeId) return reducedMotion ? 0.05 : 0.07;
      if (r.nodeId && r.nodeId === selectedNodeId) return 0.05;
      if (r.iso && r.iso === selectedIso) return 0.04;
      if (r.nodeId) return 0.022;
      return 0.006;
    },
    [hoveredNodeId, selectedNodeId, selectedIso, reducedMotion],
  );

  const polygonLabel = useCallback(
    (obj: object): string => {
      const r = obj as Resolved;
      if (!r.node && !r.girai) return "";
      let subtitle: string;
      let line: string;
      if (r.node) {
        const isEU = r.nodeId === "ST-EU" && r.iso !== "EU";
        subtitle = isEU ? "European Union (member state)" : r.node.name;
        line = r.node.headline || plainHeadline(r.node.morphology);
        if (r.girai) line += ` · GIRAI ${r.girai.index_score.toFixed(1)} / 100`;
      } else if (r.girai) {
        subtitle = r.girai.country;
        line = `GIRAI ${r.girai.index_score.toFixed(1)} / 100 · rank ${Math.round(
          r.girai.ranking,
        )} of ${store.girai.countries.length}`;
      } else {
        return "";
      }
      const bg = themeName === "dark" ? "rgba(10,13,18,0.92)" : "rgba(255,255,255,0.95)";
      const fg = themeName === "dark" ? "#e8e8e8" : "#1a1d21";
      const sub = themeName === "dark" ? "#b8b8b8" : "#4a4d52";
      const border = theme.border;
      return `
        <div style="
          font-family: var(--font-serif), serif;
          background: ${bg};
          border: 1px solid ${border};
          padding: 10px 14px;
          max-width: 280px;
          color: ${fg};
          backdrop-filter: blur(6px);
        ">
          <div style="font-size: 15px; letter-spacing:-0.01em; margin-bottom: 4px;">
            ${escapeHtml(subtitle)}
          </div>
          <div style="font-size: 12px; line-height: 1.45; color: ${sub}; font-style: italic;">
            ${escapeHtml(line)}
          </div>
        </div>`;
    },
    [store, theme, themeName],
  );

  // rAF-coalesced hover handler
  const hoverRaf = useRef<number | null>(null);
  const handleHover = useCallback(
    (obj: object | null) => {
      const r = obj as Resolved | null;
      if (typeof document !== "undefined") {
        const interactive = !!(r && (r.nodeId || r.girai));
        document.body.style.cursor = interactive ? "pointer" : "default";
      }
      if (hoverRaf.current != null) cancelAnimationFrame(hoverRaf.current);
      hoverRaf.current = requestAnimationFrame(() => {
        setHovered(r?.nodeId ?? null);
        hoverRaf.current = null;
      });
    },
    [setHovered],
  );

  useEffect(() => {
    return () => {
      if (hoverRaf.current != null) cancelAnimationFrame(hoverRaf.current);
    };
  }, []);

  const handleClick = useCallback(
    (obj: object) => {
      const r = obj as Resolved;
      if (r.nodeId) {
        selectNode(r.nodeId, { fly: true });
        return;
      }
      if (r.iso && r.girai) selectIso(r.iso);
    },
    [selectNode, selectIso],
  );

  const globeMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(theme.sphere),
      roughness: 1,
      metalness: 0,
      emissive: new THREE.Color(theme.sphere),
      emissiveIntensity: themeName === "dark" ? 0.3 : 0.05,
    });
  }, [theme, themeName]);

  // Glyphs at predicted-node centroids (Forecasts mode only).
  const glyphData = useMemo(() => {
    if (!forecastsMode) return [] as GlyphDatum[];
    const out: GlyphDatum[] = [];
    for (const [nodeId, preds] of store.predictionsByNode) {
      const node = store.nodesById.get(nodeId);
      if (!node) continue;
      const p = preds[0];
      let lat: number | undefined;
      let lng: number | undefined;
      const feat = featureByNode.get(nodeId);
      if (nodeId !== "ST-EU" && feat) {
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
        const fb = NODE_CENTROIDS[nodeId];
        if (!fb) continue;
        lat = fb[0];
        lng = fb[1];
      }
      out.push({
        id: nodeId,
        lat,
        lng,
        kind: directionGlyph(p.direction),
        color: theme.glyphInk,
      });
    }
    return out;
  }, [forecastsMode, store, featureByNode, theme]);

  const htmlElement = useCallback(
    (d: object) => {
      const g = d as GlyphDatum;
      const svg = renderToStaticMarkup(
        <DirectionGlyph kind={g.kind} color={g.color} size={22} reducedMotion={reducedMotion} />,
      );
      const wrapper = document.createElement("div");
      wrapper.style.pointerEvents = "none";
      wrapper.style.transform = "translate(-50%,-50%)";
      wrapper.style.filter = "drop-shadow(0 0 4px rgba(0,0,0,0.6))";
      wrapper.innerHTML = svg;
      return wrapper;
    },
    [reducedMotion],
  );

  

  return (
    <Suspense fallback={null}>
      <Globe
        ref={globeRef}
        width={width}
        height={height}
        backgroundColor={theme.bg}
        showAtmosphere
        atmosphereColor={theme.atmosphere}
        atmosphereAltitude={0.12}
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
        htmlElementsData={glyphData}
        htmlLat={(d: object) => (d as GlyphDatum).lat}
        htmlLng={(d: object) => (d as GlyphDatum).lng}
        htmlAltitude={0.04}
        htmlElement={htmlElement}
      />
    </Suspense>
  );
}

export const EarthGlobe = memo(EarthGlobeImpl);
