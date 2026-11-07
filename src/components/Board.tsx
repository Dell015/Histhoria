"use client";

import { useEffect, useMemo } from "react";
import {
  Background,
  Controls,
  MarkerType,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { emberfall as universe } from "@/lib/data/emberfall";
import { timelineLayout, webLayout } from "@/lib/layout";
import { entityMap, sourceMap, traceFrom, visibleClaims, visibleEntityIds, verdictOf } from "@/lib/lore";
import { useLore } from "@/lib/store";
import { LoreNode, type LoreFlowNode } from "./LoreNode";

const nodeTypes = { lore: LoreNode };

const VERDICT_GLYPH = { confirmed: "✓", partial: "≈", refuted: "✕", open: "?" } as const;
const VERDICT_COLOR = {
  confirmed: "#8fc49a",
  partial: "#e5b84a",
  refuted: "#e0433a",
  open: "#5fb8a8",
} as const;

function BoardInner() {
  const s = useLore();
  const { fitView } = useReactFlow();

  const positions = useMemo(
    () => (s.view === "web" ? webLayout(universe) : timelineLayout(universe, s.axis)),
    [s.view, s.axis],
  );

  const { nodes, edges } = useMemo(() => {
    const ents = entityMap(universe);
    const srcs = sourceMap(universe);
    const unlocked = visibleEntityIds(universe, s.progress);
    const q = s.query.trim().toLowerCase();

    const entityShown = (id: string) => {
      if (!unlocked.has(id)) return false;
      const e = ents.get(id)!;
      if (s.kinds.length && !s.kinds.includes(e.kind)) return false;
      if (s.region && e.region !== s.region) return false;
      if (q && !e.name.toLowerCase().includes(q) && !e.summary.toLowerCase().includes(q)) return false;
      return true;
    };

    const claims = visibleClaims(universe, s.progress).filter((c) => {
      if (!entityShown(c.subject) || !entityShown(c.object)) return false;
      if (s.sourceKinds.length) {
        return c.sourceIds.some((id) => s.sourceKinds.includes(srcs.get(id)!.kind));
      }
      return true;
    });

    const trace = s.selectedEntity ? traceFrom(claims, s.selectedEntity) : null;

    const theories = [...universe.theories, ...s.userTheories].filter((t) => t.postedAtStage <= s.progress);
    const theory = theories.find((t) => t.id === s.activeTheoryId) ?? null;
    const theoryClaims = theory
      ? theory.claims.filter((tc) => entityShown(tc.subject) && entityShown(tc.object))
      : [];
    const touched = new Set(theoryClaims.flatMap((tc) => [tc.subject, tc.object]));

    const contradicted = new Set(
      claims.filter((c) => c.contradicts).flatMap((c) => [c.subject, c.object]),
    );

    const nodes: LoreFlowNode[] = universe.entities
      .filter((e) => entityShown(e.id))
      .map((e) => {
        const role: LoreFlowNode["data"]["role"] = !trace
          ? null
          : e.id === s.selectedEntity
            ? "self"
            : trace.upstream.has(e.id)
              ? "up"
              : trace.downstream.has(e.id)
                ? "down"
                : null;
        return {
          id: e.id,
          type: "lore",
          position: positions.get(e.id) ?? { x: 0, y: 0 },
          draggable: false,
          selected: e.id === s.selectedEntity,
          data: {
            name: e.name,
            kind: e.kind,
            role,
            dim: !!trace && role === null,
            contradicted: contradicted.has(e.id),
            theoryTouch: touched.has(e.id),
          },
        };
      });

    const canonEdges: Edge[] = claims.map((c) => {
      const inTrace = !trace || trace.claimIds.has(c.id);
      const isContra = !!c.contradicts;
      const picked = s.selectedClaim === c.id;
      const color = isContra ? "#e0433a" : picked ? "#e8743b" : "#d9cfb8";
      return {
        id: c.id,
        source: c.subject,
        target: c.object,
        label: c.predicate + (isContra ? "  ⚠" : ""),
        labelStyle: { fill: isContra ? "#e0433a" : "#d9cfb8", fontSize: 11, fontFamily: "ui-monospace, monospace" },
        labelBgStyle: { fill: "#0e0c0a" },
        labelBgPadding: [4, 2],
        style: {
          stroke: color,
          strokeWidth: picked ? 2.6 : 1.5,
          strokeDasharray: isContra ? "6 4" : undefined,
          opacity: inTrace ? (trace ? 1 : 0.7) : 0.08,
        },
        markerEnd: { type: MarkerType.ArrowClosed, color },
      };
    });

    const theoryEdges: Edge[] = theoryClaims.map((tc) => {
      const v = verdictOf(universe, tc, s.progress);
      const color = VERDICT_COLOR[v];
      return {
        id: `theory-${tc.id}`,
        source: tc.subject,
        target: tc.object,
        label: `${VERDICT_GLYPH[v]} ${tc.predicate}`,
        labelStyle: { fill: color, fontSize: 11, fontFamily: "ui-monospace, monospace" },
        labelBgStyle: { fill: "#0e0c0a" },
        labelBgPadding: [4, 2],
        className: v === "open" ? "edge-theory" : undefined,
        style: {
          stroke: color,
          strokeWidth: 2,
          strokeDasharray: "8 6",
          opacity: trace ? 0.25 : 0.95,
        },
        markerEnd: { type: MarkerType.ArrowClosed, color },
      };
    });

    return { nodes, edges: [...canonEdges, ...theoryEdges] };
  }, [s.progress, s.query, s.kinds, s.region, s.sourceKinds, s.selectedEntity, s.selectedClaim, s.activeTheoryId, s.userTheories, positions]);

  // Re-frame when the arrangement or the set of unlocked lore changes,
  // not on every click.
  useEffect(() => {
    const t = window.setTimeout(() => fitView({ padding: 0.18, duration: 450 }), 60);
    return () => window.clearTimeout(t);
  }, [s.view, s.axis, s.progress, fitView]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodeClick={(_, n) => s.selectEntity(n.id)}
      onEdgeClick={(_, e) => {
        if (!e.id.startsWith("theory-")) s.selectClaim(e.id);
      }}
      onPaneClick={() => s.selectEntity(null)}
      nodesConnectable={false}
      minZoom={0.15}
      maxZoom={1.8}
      fitView
      proOptions={{ hideAttribution: true }}
    >
      <Background gap={36} size={1} color="rgba(238,228,208,0.07)" />
      <Controls showInteractive={false} />
    </ReactFlow>
  );
}

export function Board() {
  return (
    <ReactFlowProvider>
      <BoardInner />
    </ReactFlowProvider>
  );
}
