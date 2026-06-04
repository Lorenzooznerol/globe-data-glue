import { memo } from "react";
import type { NodeProps } from "reactflow";
import type { EntityData } from "../graphModel";

export const BaselineNode = memo(({ data, selected }: NodeProps<EntityData>) => {
  return (
    <div
      className="italy-node italy-node--baseline"
      data-selected={selected ? "true" : undefined}
      style={{ width: 1340 }}
    >
      <span className="italy-node__label">{data.label}</span>
      {data.subLabel && <span className="italy-node__sub">{data.subLabel}</span>}
    </div>
  );
});
BaselineNode.displayName = "BaselineNode";
