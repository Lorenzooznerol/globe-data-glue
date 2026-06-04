import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import type { EntityData } from "../graphModel";

const KIND_LABEL: Record<EntityData["kind"], string> = {
  baseline: "EU SUBSTRATE",
  law: "NATIONAL LAW",
  authority: "AUTHORITIES",
  criminal: "CRIMINAL LAW",
  sectors: "SECTORAL RULES",
  programme: "PROGRAMME",
  morphology: "MORPHOLOGY · INFERRED",
};

export const EntityNode = memo(({ data, selected }: NodeProps<EntityData>) => {
  const { kind, label, subLabel, meta, independence, sectors, dashed, flagToVerify } = data;
  const isLaw = kind === "law";
  return (
    <div
      className={`italy-node ${isLaw ? "italy-node--law" : ""}`}
      data-kind={kind}
      data-selected={selected ? "true" : undefined}
      data-dashed={dashed ? "true" : undefined}
    >
      <Handle type="target" position={Position.Top} className="italy-handle" />
      <span className="italy-node__kind">
        <span className="italy-node__kind-mark" aria-hidden />
        {KIND_LABEL[kind]}
      </span>
      <div className="italy-node__title">{label}</div>
      {subLabel && <div className="italy-node__sub">{subLabel}</div>}
      {meta && <div className="italy-node__meta">{meta}</div>}
      {(independence || flagToVerify) && (
        <div className="italy-node__row" style={{ marginTop: 4 }}>
          {independence && (
            <span className="italy-node__flag">indep. flag</span>
          )}
          {flagToVerify && <span className="italy-node__dot">to verify</span>}
        </div>
      )}
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
