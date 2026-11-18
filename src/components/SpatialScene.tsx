"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { fitCamera, project, type Camera, type Point3 } from "@/lib/spatial";
import type { EntityKind } from "@/lib/types";
import { KIND_COLOR, KIND_LABEL } from "./kinds";

export type SceneNode = {
  id: string;
  name: string;
  kind: EntityKind;
  landmark?: string;
  dim: boolean;
  sideOnly: boolean;
};

export type SceneEdge = {
  id: string;
  from: string;
  to: string;
  label: string;
  color: string;
  opacity: number;
  dashed?: boolean;
  theory?: boolean;
};

type Props = {
  timeline: boolean;
  frameKey: string;
  positions: Map<string, Point3>;
  nodes: SceneNode[];
  edges: SceneEdge[];
  storyIds: string[];
  selectedEntity: string | null;
  selectedClaim: string | null;
  focusRequest: number;
  neighborhood: boolean;
  selectNode: (id: string) => void;
  selectEdge: (edge: SceneEdge) => void;
  clearSelection: () => void;
};

type ScreenPoint = NonNullable<ReturnType<typeof project>>;
const labelWidth = 144;
const clamp = (n: number, lower: number, upper: number) => Math.min(upper, Math.max(lower, n));

function edgeShape(from: ScreenPoint, to: ScreenPoint, index: number) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  if (length < 16) return null;
  const ux = dx / length;
  const uy = dy / length;
  const bend = index ? (index % 2 ? 1 : -1) * Math.ceil(index / 2) * 22 : 0;
  return {
    x1: from.x + ux * 8, y1: from.y + uy * 8,
    x2: to.x - ux * 10, y2: to.y - uy * 10,
    cx: (from.x + to.x) / 2 - uy * bend, cy: (from.y + to.y) / 2 + ux * bend,
  };
}

function distanceToEdge(x: number, y: number, shape: NonNullable<ReturnType<typeof edgeShape>>) {
  let best = Infinity;
  // Sample on-screen curves closely enough to hit narrow and parallel edges.
  const samples = Math.max(8, Math.min(80, Math.ceil(Math.hypot(shape.x2 - shape.x1, shape.y2 - shape.y1) / 8)));
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const a = 1 - t;
    const px = a * a * shape.x1 + 2 * a * t * shape.cx + t * t * shape.x2;
    const py = a * a * shape.y1 + 2 * a * t * shape.cy + t * t * shape.y2;
    best = Math.min(best, Math.hypot(px - x, py - y));
  }
  return best;
}

export function SpatialScene(props: Props) {
  const { timeline, frameKey, positions, nodes, edges, storyIds, selectedEntity, selectedClaim, focusRequest, neighborhood } = props;
  const surface = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const contacts = useRef(new Map<number, { x: number; y: number }>());
  const moved = useRef(false);
  const animation = useRef(0);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [camera, setCamera] = useState<Camera>(() => fitCamera([], timeline, { width: 640, height: 480 }));
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  useLayoutEffect(() => {
    const element = surface.current;
    if (!element) return;
    const resize = () => setSize({ width: element.clientWidth, height: element.clientHeight });
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    resize();
    return () => observer.disconnect();
  }, []);

  const fit = useMemo(() => fitCamera(nodes.flatMap((node) => {
    const point = positions.get(node.id);
    return point ? [point] : [];
  }), timeline, size), [nodes, positions, size, timeline]);

  const pending = useRef({ frameKey: "", focusRequest: -1, width: 0, height: 0, focus: false });
  useEffect(() => {
    if (!size.width || !size.height) return;
    const changedFrame = pending.current.frameKey !== frameKey;
    const movedFocus = pending.current.focusRequest !== focusRequest;
    const resized = pending.current.width !== size.width || pending.current.height !== size.height;
    if (!changedFrame && !movedFocus && !resized) return;
    const focus = movedFocus || (!changedFrame && pending.current.focus);
    const target = focus && selectedEntity && !neighborhood
      && nodes.some((node) => node.id === selectedEntity) && positions.get(selectedEntity);
    const destination = target ? { ...fit, target, distance: Math.min(fit.distance, size.width < 480 ? 440 : 540) } : fit;
    cancelAnimationFrame(animation.current);
    animation.current = requestAnimationFrame(() => {
      pending.current = { frameKey, focusRequest, width: size.width, height: size.height, focus: Boolean(target) };
      setHoveredEdge(null);
      if (changedFrame || resized || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setCamera(destination);
        return;
      }
      // Use the current orbit angle for chapter jumps. Pointer input cancels the glide.
      let previous = performance.now();
      const end = previous + 260;
      function glide(now: number) {
        const amount = now >= end ? 1 : Math.min(1, (now - previous) / Math.max(end - previous, 1) * 2.1);
        previous = now;
        setCamera((camera) => ({
          ...camera,
          target: {
            x: camera.target.x + (destination.target.x - camera.target.x) * amount,
            y: camera.target.y + (destination.target.y - camera.target.y) * amount,
            z: camera.target.z + (destination.target.z - camera.target.z) * amount,
          },
          distance: camera.distance + (destination.distance - camera.distance) * amount,
        }));
        if (amount < 1) animation.current = requestAnimationFrame(glide);
      }
      animation.current = requestAnimationFrame(glide);
    });
  }, [fit, frameKey, focusRequest, neighborhood, nodes, positions, selectedEntity, size.height, size.width]);
  useEffect(() => () => cancelAnimationFrame(animation.current), []);

  const zoom = (multiplier: number) => {
    cancelAnimationFrame(animation.current);
    setCamera((value) => ({ ...value, distance: clamp(value.distance * multiplier, 165, Math.max(3000, fit.distance * 5)) }));
  };
  const reset = () => {
    cancelAnimationFrame(animation.current);
    setCamera(fit);
  };
  useEffect(() => {
    const element = surface.current;
    if (!element) return;
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      cancelAnimationFrame(animation.current);
      const delta = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
      setCamera((value) => ({ ...value, distance: clamp(value.distance * Math.exp(clamp(delta, -140, 140) * 0.0025), 165, Math.max(3000, fit.distance * 5)) }));
    };
    element.addEventListener("wheel", wheel, { passive: false });
    return () => element.removeEventListener("wheel", wheel);
  }, [fit.distance]);

  const projected = useMemo(() => {
    const points = new Map<string, ScreenPoint>();
    for (const node of nodes) {
      const point = positions.get(node.id);
      const screen = point && project(point, camera, size);
      if (screen) points.set(node.id, screen);
    }
    return points;
  }, [camera, nodes, positions, size]);

  const lines = useMemo(() => {
    const parallel = new Map<string, number>();
    return edges.flatMap((edge) => {
      const from = projected.get(edge.from);
      const to = projected.get(edge.to);
      if (!from || !to) return [];
      const key = [edge.from, edge.to].sort().join("|");
      const index = parallel.get(key) ?? 0;
      parallel.set(key, index + 1);
      const shape = edgeShape(from, to, edge.from < edge.to ? index : index ? index + 2 : 0);
      return shape ? [{ edge, shape }] : [];
    });
  }, [edges, projected]);

  const orderedNodes = useMemo(() => {
    const visible = nodes.flatMap((node) => {
      const point = projected.get(node.id);
      if (!point || point.x < 0 || point.x > size.width || point.y < 0 || point.y > size.height) return [];
      return [{ node, point, selected: node.id === selectedEntity }];
    });
    visible.sort((a, b) => Number(b.selected) - Number(a.selected)
      || Number(!!b.node.landmark) - Number(!!a.node.landmark)
      || Number(a.node.dim) - Number(b.node.dim) || a.point.depth - b.point.depth);
    const boxes: { x: number; y: number }[] = [];
    return visible.map((item) => {
      const x = clamp(item.point.x, 80, Math.max(80, size.width - 80));
      const y = item.point.y;
      const hasSpace = !boxes.some((box) => Math.abs(box.x - x) < labelWidth && Math.abs(box.y - y) < 34);
      const showLabel = item.selected || (hasSpace && (!!item.node.landmark || (!item.node.dim && boxes.length < 14)));
      if (showLabel) boxes.push({ x, y });
      return { ...item, showLabel };
    });
  }, [nodes, projected, selectedEntity, size]);

  useEffect(() => {
    const element = canvas.current;
    if (!element || !size.width || !size.height) return;
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    const pixelsWide = Math.round(size.width * ratio);
    const pixelsHigh = Math.round(size.height * ratio);
    if (element.width !== pixelsWide) element.width = pixelsWide;
    if (element.height !== pixelsHigh) element.height = pixelsHigh;
    const ctx = element.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, size.width, size.height);
    ctx.globalAlpha = 1;

    const spine = storyIds.map((id) => positions.get(id)).filter((p): p is Point3 => !!p);
    if (timeline && spine.length) {
      const first = spine[0].x - 170;
      const last = spine[spine.length - 1].x + 170;
      function guide(a: Point3, b: Point3, color: string, width: number) {
        const from = project(a, camera, size);
        const to = project(b, camera, size);
        if (!from || !to || !ctx) return;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.stroke();
      }
      for (let z = -150; z <= 150; z += 50) guide({ x: first, y: -140, z }, { x: last, y: -140, z }, "rgba(145,172,229,.12)", 1);
      const stride = Math.max(65, (last - first) / 38);
      for (let x = first; x <= last; x += stride) guide({ x, y: -140, z: -150 }, { x, y: -140, z: 150 }, "rgba(145,172,229,.12)", 1);
      for (const point of spine) guide(point, { ...point, y: -140 }, "rgba(242,181,107,.28)", 1);
      const a = spine[0];
      const b = spine[spine.length - 1];
      guide({ ...a, x: a.x - 108 }, { ...b, x: b.x + 108 }, "rgba(242,181,107,.10)", 13);
      guide({ ...a, x: a.x - 108 }, { ...b, x: b.x + 108 }, "rgba(242,181,107,.68)", 1.5);
    }

    for (const { edge, shape } of lines) {
      const picked = selectedClaim === edge.id || hoveredEdge === edge.id;
      const angle = Math.atan2(shape.y2 - shape.cy, shape.x2 - shape.cx);
      ctx.beginPath();
      ctx.moveTo(shape.x1, shape.y1);
      ctx.quadraticCurveTo(shape.cx, shape.cy, shape.x2, shape.y2);
      ctx.strokeStyle = picked ? "#f2b56b" : edge.color;
      ctx.lineWidth = picked ? 2.3 : 1.2;
      ctx.globalAlpha = picked ? 1 : edge.opacity;
      ctx.setLineDash(edge.dashed ? [5, 5] : []);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(shape.x2, shape.y2);
      ctx.lineTo(shape.x2 - Math.cos(angle - 0.55) * 7, shape.y2 - Math.sin(angle - 0.55) * 7);
      ctx.moveTo(shape.x2, shape.y2);
      ctx.lineTo(shape.x2 - Math.cos(angle + 0.55) * 7, shape.y2 - Math.sin(angle + 0.55) * 7);
      ctx.stroke();
    }
  }, [camera, hoveredEdge, lines, positions, selectedClaim, size, storyIds, timeline]);

  function edgeAt(event: PointerEvent<HTMLDivElement>) {
    const bounds = surface.current!.getBoundingClientRect();
    let best: SceneEdge | undefined;
    let distance = 10;
    for (const { edge, shape } of lines) {
      const next = distanceToEdge(event.clientX - bounds.left, event.clientY - bounds.top, shape);
      if (next >= distance || edge.opacity < 0.12) continue;
      distance = next;
      best = edge;
    }
    return best;
  }

  function pointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || (event.target as HTMLElement).closest("button")) return;
    cancelAnimationFrame(animation.current);
    if (contacts.current.size === 0) moved.current = false;
    contacts.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  }

  function pointerMove(event: PointerEvent<HTMLDivElement>) {
    const previous = contacts.current.get(event.pointerId);
    if (!previous) {
      if (event.pointerType === "mouse") setHoveredEdge(edgeAt(event)?.id ?? null);
      return;
    }
    const dx = event.clientX - previous.x;
    const dy = event.clientY - previous.y;
    if (Math.abs(dx) + Math.abs(dy) > 1) moved.current = true;
    const partner = [...contacts.current].find(([id]) => id !== event.pointerId)?.[1];
    contacts.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (partner) {
      const before = Math.hypot(previous.x - partner.x, previous.y - partner.y);
      const after = Math.hypot(event.clientX - partner.x, event.clientY - partner.y);
      if (before > 5 && after > 5) zoom(before / after);
    } else if (event.shiftKey) {
      setCamera((value) => {
        const unit = value.distance / (Math.max(size.width, size.height) * 0.83);
        const horizontal = -dx * unit;
        const vertical = dy * unit;
        return { ...value, target: {
          x: value.target.x + horizontal * Math.cos(value.yaw) - vertical * Math.sin(value.pitch) * Math.sin(value.yaw),
          y: value.target.y + vertical * Math.cos(value.pitch),
          z: value.target.z - horizontal * Math.sin(value.yaw) - vertical * Math.sin(value.pitch) * Math.cos(value.yaw),
        } };
      });
    } else {
      setCamera((value) => ({ ...value, yaw: value.yaw - dx * 0.007, pitch: clamp(value.pitch + dy * 0.007, -1.42, 1.42) }));
    }
  }

  function pointerEnd(event: PointerEvent<HTMLDivElement>) {
    if (!contacts.current.delete(event.pointerId) || contacts.current.size > 0) return;
    setDragging(false);
    if (moved.current || event.type !== "pointerup") return;
    const edge = edgeAt(event);
    if (edge && !edge.theory) props.selectEdge(edge);
    else if (!edge) props.clearSelection();
  }

  const activeLabel = edges.find((edge) => edge.id === (hoveredEdge ?? selectedClaim))?.label;
  return <>
    <div ref={surface} role="region" aria-label={timeline ? "Interactive 3D time stream" : "Interactive 3D connection map"} tabIndex={0}
      className={`spatial-surface absolute inset-0 isolate overflow-hidden ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
      onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerEnd}
      onPointerCancel={pointerEnd} onLostPointerCapture={pointerEnd} onPointerLeave={() => setHoveredEdge(null)}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === "+" || event.key === "=") zoom(0.81);
        else if (event.key === "-") zoom(1.23);
        else if (event.key === "Home") reset();
        else if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
          cancelAnimationFrame(animation.current);
          setCamera((value) => ({
            ...value, yaw: value.yaw + (event.key === "ArrowLeft" ? 0.15 : event.key === "ArrowRight" ? -0.15 : 0),
            pitch: clamp(value.pitch + (event.key === "ArrowUp" ? -0.12 : event.key === "ArrowDown" ? 0.12 : 0), -1.42, 1.42),
          }));
        } else return;
        event.preventDefault();
      }}>
      <canvas ref={canvas} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" />
      {orderedNodes.map(({ node, point, selected, showLabel }, index) => {
        const color = node.landmark ? "#f2b56b" : node.sideOnly ? "#79c9ba" : KIND_COLOR[node.kind];
        return <button key={node.id} type="button" aria-label={node.name} aria-pressed={selected}
          title={node.name}
          style={{ left: point.x, top: point.y, zIndex: orderedNodes.length - index, color }}
          className={`spatial-node ${node.landmark ? "spatial-landmark" : ""} ${selected ? "spatial-selected" : ""} ${node.dim ? "spatial-dim" : ""}`}
          onClick={() => props.selectNode(node.id)}>
          <span aria-hidden="true" className="spatial-dot" />
          <span aria-hidden="true" className={`spatial-label ${showLabel ? "spatial-label-visible" : ""}`}>{node.landmark && <small>{node.landmark}</small>}{node.name}</span>
          <span className="sr-only">{KIND_LABEL[node.kind]}</span>
        </button>;
      })}
    </div>
    <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-wrap items-end justify-between gap-2 pointer-events-none">
      <div className="pointer-events-auto flex overflow-hidden rounded-lg border border-line bg-panel" aria-label="3D camera controls">
        <button onClick={() => zoom(0.81)} className="spatial-control" aria-label="Zoom in" title="Zoom in">+</button>
        <button onClick={() => zoom(1.23)} className="spatial-control" aria-label="Zoom out" title="Zoom out">−</button>
        <button onClick={reset} className="spatial-control px-3 text-xs" aria-label="Reset camera">Reset</button>
      </div>
      <div className="rounded bg-bg/80 px-2 py-1 text-right text-[11px] text-muted">{activeLabel || "Drag to orbit"}</div>
    </div>
  </>;
}
