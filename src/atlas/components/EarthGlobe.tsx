import { lazy, memo, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GlobeMethods } from "react-globe.gl";
import * as THREE from "three";
import { geoCentroid } from "d3-geo";

import type { DataStore } from "@/data/store";
import type { AtlasNode, GiraiCountry } from "@/data/types";
import { useCountries } from "@/atlas/useCountries";
import { useAtlasStore } from "@/atlas/store";
import { useLandingStore, isLandingActive } from "@/atlas/landing/landingStore";
import { aggregateCountryCoverage, coverageOpacity, nodeMatches, nodesByIso } from "@/atlas/landing/derive";
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
    controls.autoRotateSpeed = 0.12;
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

  // Nodes (countries) that have a forecast — get the accent fill in Forecasts mode.
  const forecastNodeIds = useMemo(() => {
    const s = new Set<string>();
    for (const [nid] of store.predictionsByNode) {
      if (featureByNode.has(nid)) s.add(nid);
    }
    return s;
  }, [store, featureByNode]);

  // Nodes with a morphology timeline — pulse briefly on entering Forecasts mode.
  const migrationNodeIds = useMemo(() => {
    const s = new Set<string>();
    for (const n of store.atlas.nodes) {
      if ((n.morphology_timeline ?? []).length >= 2 && featureByNode.has(n.node_id)) {
        s.add(n.node_id);
      }
    }
    return s;
  }, [store, featureByNode]);

  // Pulse animation token + decay
  const migrationToken = useAtlasStore((s) => s.migrationToken);
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    if (reducedMotion || !forecastsMode) {
      setPulse(0);
      return;
    }
    setPulse(1);
    const t1 = setTimeout(() => setPulse(0.55), 500);
    const t2 = setTimeout(() => setPulse(0), 1400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [migrationToken, forecastsMode, reducedMotion]);

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
    g.pointOfView({ lat, lng, altitude: 1.6 }, reducedMotion ? 0 : 1600);
  }, [flyToken, selectedNodeId, reducedMotion, featureByNode]);

  const polygonCapColor = useCallback(
    (obj: object): string => {
      const r = obj as Resolved;
      if (forecastsMode) {
        if (r.nodeId && forecastNodeIds.has(r.nodeId)) {
          const focused = r.nodeId === hoveredNodeId || r.nodeId === selectedNodeId;
          return focused ? theme.accentStrong : theme.accent;
        }
        return theme.countryBase;
      }
      if (!r.iso) return theme.countryBase;
      const base = capColorByIso.get(r.iso) ?? theme.countryBase;
      if (r.nodeId && r.nodeId === hoveredNodeId && r.girai) {
        return giraiColor(theme, Math.min(100, r.girai.index_score + 10));
      }
      return base;
    },
    [forecastsMode, forecastNodeIds, theme, capColorByIso, hoveredNodeId, selectedNodeId],
  );

  const polygonSideColor = useCallback(
    (obj: object): string => {
      const r = obj as Resolved;
      if (forecastsMode) {
        if (r.nodeId && forecastNodeIds.has(r.nodeId)) return theme.accent;
        return theme.countryBase;
      }
      if (r.node) return hexToRgba(colorForNode(r.node), 0.45);
      return theme.countryBase;
    },
    [forecastsMode, forecastNodeIds, theme],
  );

  const polygonStrokeColor = useCallback(
    (obj: object): string => {
      const r = obj as Resolved;
      const isFocused =
        (r.nodeId && (r.nodeId === hoveredNodeId || r.nodeId === selectedNodeId)) ||
        (r.iso && r.iso === selectedIso);
      // Uniform hairline borders in every mode; bolder on focus.
      return isFocused ? theme.borderStrong : theme.border;
    },
    [theme, hoveredNodeId, selectedNodeId, selectedIso],
  );

  const polygonAltitude = useCallback(
    (obj: object): number => {
      const r = obj as Resolved;
      if (r.nodeId === hoveredNodeId && r.nodeId) return reducedMotion ? 0.05 : 0.07;
      if (r.nodeId && r.nodeId === selectedNodeId) return 0.05;
      if (r.iso && r.iso === selectedIso) return 0.04;
      if (forecastsMode && r.nodeId) {
        if (migrationNodeIds.has(r.nodeId) && pulse > 0) {
          return 0.03 + 0.05 * pulse;
        }
        if (forecastNodeIds.has(r.nodeId)) return 0.03;
        return 0.006;
      }
      if (r.nodeId) return 0.022;
      return 0.006;
    },
    [hoveredNodeId, selectedNodeId, selectedIso, reducedMotion, forecastsMode, forecastNodeIds, migrationNodeIds, pulse],
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
        if (forecastsMode && r.nodeId && forecastNodeIds.has(r.nodeId)) {
          const preds = store.predictionsByNode.get(r.nodeId);
          line = preds && preds[0] ? plainPrediction(preds[0]) : (r.node.headline || "");
        } else {
          line = r.node.headline || plainHeadline(r.node.morphology);
          if (r.girai && !forecastsMode) line += ` · GIRAI ${r.girai.index_score.toFixed(1)} / 100`;
        }
      } else if (r.girai) {
        if (forecastsMode) return "";
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
    [store, theme, themeName, forecastsMode, forecastNodeIds],
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

  /* ============================================================
   * Landing layers (Language-Explorer pattern).
   * Only mounted in `overview` mode. In `girai`/`forecasts` the
   * existing polygon-only behavior is preserved.
   * ============================================================ */
  const landingFilters = useLandingStore();
  const landingMode = mode === "overview";
  const landingActive = landingMode && isLandingActive(landingFilters);

  // Country centroids resolved from features (covers far more than NODE_CENTROIDS).
  const isoCentroid = useMemo(() => {
    const m = new Map<string, [number, number]>();
    for (const f of features) {
      const iso = (f.properties.ADM0_A3 || f.properties.ISO_A3) as string | undefined;
      if (!iso || iso === "-99" || m.has(iso)) continue;
      try {
        const [lng, lat] = geoCentroid(f as never);
        if (Number.isFinite(lat) && Number.isFinite(lng)) m.set(iso, [lat, lng]);
      } catch {
        /* ignore */
      }
    }
    return m;
  }, [features]);

  const coverageByIso = useMemo(() => {
    const list = aggregateCountryCoverage(store.atlas.nodes);
    const m = new Map<string, (typeof list)[number]>();
    for (const c of list) m.set(c.iso3, c);
    return m;
  }, [store]);

  const matchingIsoSet = useMemo(() => {
    if (!landingActive) return null;
    const isos = new Set<string>();
    const matched = store.atlas.nodes.filter((n) => nodeMatches(n, landingFilters));
    for (const iso of nodesByIso(matched).keys()) isos.add(iso);
    return isos;
  }, [store, landingFilters, landingActive]);

  type CountryDot = {
    iso: string;
    lat: number;
    lng: number;
    band: "high" | "mid" | "low" | "hollow";
    total: number;
    coverage: number;
  };

  const countryDots = useMemo<CountryDot[]>(() => {
    if (!landingMode) return [];
    const dots: CountryDot[] = [];
    for (const [iso, cov] of coverageByIso) {
      const c = isoCentroid.get(iso);
      if (!c) continue;
      dots.push({
        iso,
        lat: c[0],
        lng: c[1],
        band: cov.band,
        total: cov.total,
        coverage: cov.coverage,
      });
    }
    return dots;
  }, [landingMode, coverageByIso, isoCentroid]);

  const filledDots = useMemo(
    () => countryDots.filter((d) => d.band !== "hollow"),
    [countryDots],
  );
  const hollowDots = useMemo(
    () => countryDots.filter((d) => d.band === "hollow"),
    [countryDots],
  );

  const dotOpacity = useCallback(
    (d: CountryDot): number => {
      const base = coverageOpacity(d.band) || 1;
      if (!matchingIsoSet) return base;
      return matchingIsoSet.has(d.iso) ? base : 0.08;
    },
    [matchingIsoSet],
  );

  const dotRadius = useCallback((d: CountryDot): number => {
    // 0.18deg → ~3.5px-equiv; cap by total nodes
    return 0.18 + Math.min(0.12, Math.log2(1 + d.total) * 0.035);
  }, []);

  const dotColor = useCallback(
    (d: CountryDot): string => {
      const o = dotOpacity(d);
      // White ink, opacity encodes coverage (high=1, mid=.65, low=.4) × match dim
      return `rgba(248,250,252,${o})`;
    },
    [dotOpacity],
  );

  const dotLabel = useCallback((obj: object): string => {
    const d = obj as CountryDot;
    const girai = store.giraiByIso.get(d.iso);
    const name = girai?.country ?? d.iso;
    const pct = Math.round(d.coverage * 100);
    return `<div style="font-family:'Hanken Grotesk Variable',sans-serif;background:rgba(10,13,18,0.92);color:#f5f7fa;padding:7px 12px;border:1px solid rgba(255,255,255,0.18);font-size:12px;letter-spacing:-0.005em;backdrop-filter:blur(8px);">
      <span style="font-weight:500">${escapeHtml(name)}</span>
      <span style="opacity:.55"> · ${d.total} ${d.total === 1 ? "node" : "nodes"} · cov ${pct}%</span>
    </div>`;
  }, [store]);

  const handleDotClick = useCallback(
    (obj: object) => {
      const d = obj as CountryDot;
      selectIso(d.iso);
    },
    [selectIso],
  );

  // Hollow rings rendered as DOM overlays — crisp at every zoom, no Three needed.
  const hollowElement = useCallback(
    (obj: object): HTMLElement => {
      const d = obj as CountryDot;
      const el = document.createElement("div");
      const dim = matchingIsoSet && !matchingIsoSet.has(d.iso) ? 0.08 : 0.55;
      const sz = 9 + Math.min(4, Math.log2(1 + d.total) * 1.2);
      el.style.cssText = [
        `width:${sz}px`,
        `height:${sz}px`,
        "border-radius:50%",
        `border:1px solid rgba(248,250,252,${dim})`,
        "background:transparent",
        "transform:translate(-50%,-50%)",
        "pointer-events:auto",
        "cursor:pointer",
      ].join(";");
      el.title = (store.giraiByIso.get(d.iso)?.country ?? d.iso) + " · opaque";
      el.addEventListener("click", () => selectIso(d.iso));
      return el;
    },
    [matchingIsoSet, store, selectIso],
  );

  // When landing mode + active, push polygons way down — globe becomes "ghost atlas".
  const polygonCapColorWithLanding = useCallback(
    (obj: object): string => {
      if (landingMode) {
        // Ghost atlas: very faint fill for ALL polygons; matching iso gets a touch more visibility.
        const r = obj as Resolved;
        const baseAlpha = landingActive ? 0.05 : 0.07;
        const liftAlpha = matchingIsoSet && r.iso && matchingIsoSet.has(r.iso) ? 0.14 : baseAlpha;
        return `rgba(180,190,200,${liftAlpha})`;
      }
      return polygonCapColor(obj);
    },
    [landingMode, landingActive, matchingIsoSet, polygonCapColor],
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
        polygonCapColor={polygonCapColorWithLanding}
        polygonSideColor={polygonSideColor}
        polygonStrokeColor={polygonStrokeColor}
        polygonAltitude={landingMode ? () => 0.004 : polygonAltitude}
        polygonsTransitionDuration={reducedMotion ? 0 : 420}
        polygonLabel={landingMode ? () => "" : polygonLabel}
        onPolygonHover={landingMode ? undefined : handleHover}
        onPolygonClick={landingMode ? undefined : handleClick}

        pointsData={landingMode ? filledDots : []}
        pointLat={(d: object) => (d as CountryDot).lat}
        pointLng={(d: object) => (d as CountryDot).lng}
        pointAltitude={() => 0.012}
        pointRadius={(d: object) => dotRadius(d as CountryDot)}
        pointColor={(d: object) => dotColor(d as CountryDot)}
        pointResolution={12}
        pointsMerge={false}
        pointsTransitionDuration={reducedMotion ? 0 : 350}
        pointLabel={dotLabel}
        onPointClick={handleDotClick}

        htmlElementsData={landingMode ? hollowDots : []}
        htmlLat={(d: object) => (d as CountryDot).lat}
        htmlLng={(d: object) => (d as CountryDot).lng}
        htmlAltitude={() => 0.012}
        htmlElement={hollowElement}
      />
    </Suspense>
  );
}

export const EarthGlobe = memo(EarthGlobeImpl);
