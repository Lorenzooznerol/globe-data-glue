import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import type { EntityData } from "../graphModel";

export const EntityNode = memo(({ data, selected }: NodeProps<EntityData>) => {
  const { kind, label, subLabel, meta, independence, sectors, dashed, flagToVerify } = data;
  return (
    <div
      className="italy-node italy-node--entity"
      data-kind={kind}
      data-selected={selected ? "true" : undefined}
      data-dashed={dashed ? "true" : undefined}
    >
      <Handle type="target" position={Position.Top} className="italy-handle" />
      <div className="italy-node__row">
        <span className="italy-node__label">{label}</span>
        {independence && (
          <span
            className="italy-node__flag"
            title="Independence flag (ACN is a government agency, not an independent authority)"
            aria-label="independence flag"
          />
        )}
        {flagToVerify && (
          <span
            className="italy-node__dot"
            title="Items to verify"
            aria-label="items to verify"
          />
        )}
      </div>
      {subLabel && <span className="italy-node__sub">{subLabel}</span>}
      {meta && <span className="italy-node__meta">{meta}</span>}
      {sectors && (
        <div className="italy-node__sectors">
          {sectors.map((s) => (
            <span key={s} className="italy-sector-pill">
              {s}
            </span>
          ))}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} className="italy-handle" />
    </div>
  );
});
EntityNode.displayName = "EntityNode";
