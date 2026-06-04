import { memo } from "react";
import type { NodeProps } from "reactflow";
import type { EntityData } from "../graphModel";

export const BaselineNode = memo(({ data, selected }: NodeProps<EntityData>) => {
  return (
    <div
      className="italy-node italy-node--baseline"
      data-kind="baseline"
      data-selected={selected ? "true" : undefined}
      style={{ width: 1340 }}
    >
      <span className="italy-node__kind">
        <span className="italy-node__kind-mark" aria-hidden />
        EU SUBSTRATE
      </span>
      <span className="italy-node__title">{data.label}</span>
      {data.subLabel && <span className="italy-node__sub">{data.subLabel}</span>}
    </div>
  );
});
BaselineNode.displayName = "BaselineNode";
