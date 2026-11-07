"use client";

import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import type { EntityKind } from "@/lib/types";
import { KIND_COLOR, KIND_LABEL } from "./kinds";

export type LoreNodeData = {
  name: string;
  kind: EntityKind;
  role: "self" | "up" | "down" | null;
  dim: boolean;
  contradicted: boolean;
  theoryTouch: boolean;
};

export type LoreFlowNode = Node<LoreNodeData, "lore">;

export function LoreNode({ data, selected }: NodeProps<LoreFlowNode>) {
  const color = KIND_COLOR[data.kind];
  const ring =
    data.role === "self" || selected
      ? "0 0 0 2px var(--ember), 0 0 24px rgba(232,116,59,.35)"
      : data.role === "up"
        ? "0 0 0 1.5px rgba(127,166,201,.8)"
        : data.role === "down"
          ? "0 0 0 1.5px rgba(229,184,74,.8)"
          : "none";

  return (
    <div
      style={{
        width: 190,
        opacity: data.dim ? 0.22 : 1,
        boxShadow: ring,
        borderLeft: `3px solid ${color}`,
        transition: "opacity .2s, box-shadow .2s",
      }}
      className="cursor-pointer bg-panel px-3 py-2 text-left"
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <div className="flex items-center justify-between gap-2">
        <span className="eyebrow" style={{ color }}>
          {KIND_LABEL[data.kind]}
        </span>
        <span className="flex gap-1.5 text-[10px]">
          {data.contradicted && (
            <span title="This has a contradiction in canon" className="text-contra">
              ⚠
            </span>
          )}
          {data.theoryTouch && (
            <span title="Touched by the active theory" className="text-theory">
              ◆
            </span>
          )}
        </span>
      </div>
      <div className="mt-0.5 truncate font-serif text-[15px] leading-tight text-ink">{data.name}</div>
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </div>
  );
}
