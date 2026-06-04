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
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

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

export function ItalyGraph({ node, overlay }: Props) {
  const selectNode = useAtlasStore((s) => s.selectNode);
  const reducedMotion = useAtlasStore((s) => s.reducedMotion);

  const { nodes: baseNodes, edges: baseEdges } = useMemo(
    () => buildItalyGraph(overlay),
    [overlay],
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Hide the globe.
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

  // Compute neighbor set for focus+context.
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
      baseNodes.map((n) => ({
        ...n,
        selected: n.id === selectedId,
        data: { ...n.data },
        // attach a flag we read via DOM attribute
        className: selectedId
          ? neighborIds.has(n.id)
            ? "is-neighbor"
            : "is-dim"
          : undefined,
      })),
    [baseNodes, selectedId, neighborIds],
  );

  const edges: Edge[] = useMemo(
    () =>
      baseEdges.map((e) => {
        const isNeighbor =
          !!selectedId && (e.source === selectedId || e.target === selectedId);
        return {
          ...e,
          animated: false,
          style: {
            ...e.style,
            opacity: selectedId ? (isNeighbor ? 1 : 0.18) : 1,
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
      role="region"
      aria-label={`${node.name} — object graph`}
    >
      <div className="italy-graph-canvas">
        <span className="italy-graph-title">
          IT · {overlay.meta.country} · object graph
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={close}
          className="italy-graph-close h-7 w-7 text-muted-foreground hover:text-foreground"
          aria-label="Close Italy view"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
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
          fitViewOptions={{ padding: 0.18, maxZoom: 1 }}
          minZoom={0.4}
          maxZoom={1.6}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={32} size={1} color="var(--border)" />
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
