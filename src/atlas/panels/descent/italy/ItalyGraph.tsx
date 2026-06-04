import { useCallback, useEffect, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  type Edge,
  type Node,
  type NodeMouseHandler,
} from "reactflow";
import "reactflow/dist/style.css";
import "./italy-graph.css";

import type { DataStore } from "@/data/store";
import type { AtlasNode, CountryOverlay } from "@/data/types";
import { useAtlasStore } from "@/atlas/store";

import { buildItalyGraph, type EntityData } from "./graphModel";
import { EntityNode } from "./nodes/EntityNode";
import { BaselineNode } from "./nodes/BaselineNode";
import { Inspector } from "./Inspector";

interface Props {
  store: DataStore;
  node: AtlasNode;
  overlay: CountryOverlay;
}

const nodeTypes = { entity: EntityNode, baseline: BaselineNode };

/* ============================================================
   PASS-4 final critiques addressed in this file:
   • Header strip with crumb + legend gives the canvas a "console"
     frame and explains what the symbols mean (no mystery glyphs).
   • Edge labels styled via CSS, not inline (consistent typography).
   • Neighbor / inferred edges classed so CSS owns the visual states.
   ============================================================ */

export function ItalyGraph({ node, overlay }: Props) {
  const selectNode = useAtlasStore((s) => s.selectNode);
  const reducedMotion = useAtlasStore((s) => s.reducedMotion);
  const theme = useAtlasStore((s) => s.theme);

  const { nodes: baseNodes, edges: baseEdges } = useMemo(
    () => buildItalyGraph(overlay),
    [overlay],
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    document.body.setAttribute("data-descent", "on");
    return () => document.body.removeAttribute("data-descent");
  }, []);

  const close = useCallback(() => selectNode(null), [selectNode]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (selectedId) setSelectedId(null);
      else close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, close]);

  const neighborIds = useMemo(() => {
    if (!selectedId) return new Set<string>();
    const set = new Set<string>([selectedId]);
    for (const e of baseEdges) {
      if (e.source === selectedId) set.add(e.target);
      if (e.target === selectedId) set.add(e.source);
    }
    return set;
  }, [selectedId, baseEdges]);

  const nodes: Node<EntityData>[] = useMemo(
    () =>
      baseNodes.map((n) => {
        const cls: string[] = [];
        if (selectedId) {
          if (n.id === selectedId) cls.push("is-selected", "is-neighbor");
          else if (neighborIds.has(n.id)) cls.push("is-neighbor");
        }
        return {
          ...n,
          selected: n.id === selectedId,
          className: cls.join(" ") || undefined,
        };
      }),
    [baseNodes, selectedId, neighborIds],
  );

  const edges: Edge[] = useMemo(
    () =>
      baseEdges.map((e) => {
        const isNeighbor =
          !!selectedId && (e.source === selectedId || e.target === selectedId);
        const cls = [
          e.className,
          isNeighbor ? "is-neighbor" : null,
          selectedId && !isNeighbor ? "is-dim" : null,
        ]
          .filter(Boolean)
          .join(" ");
        return {
          ...e,
          className: cls || undefined,
          style: {
            ...e.style,
            opacity: selectedId ? (isNeighbor ? 1 : 0.22) : 1,
          },
        };
      }),
    [baseEdges, selectedId],
  );

  const onNodeClick: NodeMouseHandler = useCallback((_e, n) => {
    setSelectedId(n.id);
  }, []);

  const onPaneClick = useCallback(() => setSelectedId(null), []);

  const selectedEntity =
    (selectedId && nodes.find((n) => n.id === selectedId)?.data) || null;

  return (
    <div
      className="italy-graph-root"
      data-focus={selectedId ? "true" : "false"}
      data-theme-light={theme === "light" ? "true" : undefined}
      role="region"
      aria-label={`${node.name} — object graph`}
    >
      <div className="italy-graph-canvas">
        <header className="italy-header">
          <div className="italy-header__crumb">
            <span className="italy-header__id">ATLAS · IT · ITA</span>
            <span className="italy-header__sep" />
            <span className="italy-header__title">
              {overlay.meta.country} <em>— object graph</em>
            </span>
          </div>
          <div className="italy-header__legend" aria-label="provenance legend">
            <span>
              <span className="italy-prov-mark" data-level="VERIFIED" /> verified
            </span>
            <span>
              <span className="italy-prov-mark" data-level="ATTESTED" /> attested
            </span>
            <span>
              <span className="italy-prov-mark" data-level="INFERRED" /> inferred
            </span>
            <span>
              <span className="italy-prov-mark" data-level="TO_VERIFY" /> to verify
            </span>
          </div>
          <button
            type="button"
            className="italy-header__close"
            onClick={close}
            aria-label="Close Italy view"
          >
            ×
          </button>
        </header>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable
          panOnDrag
          zoomOnScroll
          fitView
          fitViewOptions={{ padding: 0.22, maxZoom: 1 }}
          minZoom={0.4}
          maxZoom={1.6}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={48} size={1} color="transparent" />
          <Controls showInteractive={false} position="bottom-left" />
        </ReactFlow>
      </div>
      <Inspector
        entity={selectedEntity}
        overlay={overlay}
        onClose={() => setSelectedId(null)}
        reducedMotion={reducedMotion}
      />
    </div>
  );
}
