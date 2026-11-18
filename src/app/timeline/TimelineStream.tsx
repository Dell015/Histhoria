"use client";

import { useEffect, useRef } from "react";
import { project, type Camera, type SceneSize } from "@/lib/spatial";
import styles from "./timeline.module.css";

const tau = 2 * Math.PI;
const camera: Camera = { target: { x: 0, y: 0, z: 0 }, yaw: 0, pitch: 0.13, distance: 300 };
const tracks = [
  { amplitude: 0, depth: 0, frequency: 0, phase: 0, speed: 0.031, count: 96 },
  { amplitude: 23, depth: 56, frequency: 1.33, phase: 0.4, speed: 0.027, count: 50 },
  { amplitude: 18, depth: 43, frequency: 1.78, phase: 2.5, speed: 0.039, count: 48 },
  { amplitude: 12, depth: 39, frequency: 2.28, phase: 4.7, speed: 0.034, count: 46 },
];

const particles = tracks.map((track, trackIndex) => Array.from({ length: track.count }, (_, index) => {
  const seed = index + trackIndex * 101;
  return {
    phase: (index + ((seed * 29) % 79) / 79) / track.count,
    speed: track.speed * (0.94 + (seed % 9) * 0.016),
    drift: ((seed * 37) % 19 - 9) / 7,
    depth: ((seed * 47) % 19 - 9) / 3,
    radius: 0.45 + ((seed * 19) % 14) / 15,
    brightness: 0.23 + ((seed * 17) % 61) / 100,
  };
}));

type ScreenPoint = NonNullable<ReturnType<typeof project>>;
type TrackSampler = (position: number, drift?: number, depthDrift?: number) => ScreenPoint;

function trackOffset(index: number, position: number, time: number, width: number) {
  const core = 1.5 * Math.sin(tau * (position * 1.5 - time * 0.028))
    + 0.55 * Math.sin(tau * (position * 3.28 - time * 0.07));
  if (index === 0) return { y: core, z: 0 };

  const track = tracks[index];
  const travel = position - time * track.speed;
  // Independent frequencies and a traveling envelope keep the strands from moving in sync.
  const envelope = 0.56 + 0.37 * Math.sin(tau * (travel * 0.86 - time * 0.011) + track.phase * 1.46);
  const angle = tau * travel * track.frequency + track.phase;
  const wave = Math.sin(angle)
    + 0.28 * Math.sin(tau * (travel * 2.91 - time * 0.018) + track.phase * 0.72)
    + 0.13 * Math.sin(tau * (travel * 4.12 + time * 0.023) - track.phase);
  const scale = 0.72 + Math.min(1, width / 1100) * 0.28;
  // Taper depth at the sides so perspective doesn't pull distant ends inside the frame.
  const edge = Math.min(1, position * 7, (1 - position) * 7);
  const depthWave = Math.cos(angle + 0.27) + 0.23 * Math.sin(tau * (travel * 1.88 + time * 0.019) - track.phase);
  return { y: core + track.amplitude * scale * envelope * wave, z: track.depth * edge * envelope * depthWave };
}

function trace(ctx: CanvasRenderingContext2D, points: ScreenPoint[]) {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let index = 1; index < points.length; index++) ctx.lineTo(points[index].x, points[index].y);
}

// Split at the backbone's depth so back strands are covered where they pass behind it.
function depthSections(points: ScreenPoint[], cameraDepth: number) {
  const sections = [];
  let start = 0;
  let near = points[0].depth < cameraDepth;
  for (let index = 1; index < points.length; index++) {
    const isNear = points[index].depth < cameraDepth;
    if (isNear === near) continue;
    sections.push({ near, points: points.slice(start, index + 1) });
    start = index;
    near = isNear;
  }
  if (start < points.length - 1) sections.push({ near, points: points.slice(start) });
  return sections;
}

function sample(sampler: TrackSampler, from: number, to: number, detail: number) {
  const steps = Math.max(1, Math.ceil((to - from) * detail));
  return Array.from({ length: steps + 1 }, (_, index) => sampler(from + (to - from) * index / steps));
}

function strokeTrack(ctx: CanvasRenderingContext2D, points: ScreenPoint[], near: boolean, core: boolean) {
  trace(ctx, points);
  ctx.strokeStyle = core ? "rgba(151,192,247,0.13)" : near ? "rgba(142,183,237,0.09)" : "rgba(142,183,237,0.04)";
  ctx.lineWidth = core ? 18 : near ? 7 : 5;
  ctx.stroke();
  ctx.strokeStyle = core ? "#3d536d" : near ? "rgba(211,231,255,0.67)" : "rgba(153,181,220,0.34)";
  ctx.lineWidth = core ? 7 : near ? 1.45 : 0.9;
  ctx.stroke();
  if (!core) return;

  ctx.strokeStyle = "#8baed3";
  ctx.lineWidth = 4.4;
  ctx.stroke();
  ctx.save();
  ctx.translate(0, -1);
  trace(ctx, points);
  ctx.strokeStyle = "#daebff";
  ctx.lineWidth = 2.2;
  ctx.stroke();
  ctx.restore();
}

function streakPoints(sampler: TrackSampler, time: number, index: number, core: boolean) {
  const length = core ? 0.19 : 0.13;
  const cycle = (time / (29 + index * 2.5) + 0.18 + index * 0.26) % 1;
  const head = cycle * (1 + length * 2) - length * 0.5;
  const tail = head - length;
  const from = Math.max(0, tail);
  const to = Math.min(1, head);
  if (to <= from) return null;
  return { points: sample(sampler, from, to, 135), tail, head };
}

function strokeStreak(ctx: CanvasRenderingContext2D, points: ScreenPoint[], tail: number, head: number,
  core: boolean, near: boolean) {
  const light = ctx.createLinearGradient(tail, 0, head, 0);
  light.addColorStop(0, "rgba(190,215,255,0)");
  light.addColorStop(0.74, core ? "rgba(191,222,255,0.45)" : "rgba(179,211,255,0.35)");
  light.addColorStop(0.92, core ? "rgba(248,252,255,0.98)" : "rgba(222,239,255,0.80)");
  light.addColorStop(1, "rgba(219,236,255,0)");
  ctx.strokeStyle = light;
  ctx.globalAlpha = core || near ? 1 : 0.46;
  ctx.lineWidth = core ? 5 : near ? 2 : 1.2;
  ctx.shadowColor = "#bed9ffd9";
  ctx.shadowBlur = core ? 10 : 6;
  trace(ctx, points);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
}

function renderStream(ctx: CanvasRenderingContext2D, width: number, height: number, time: number) {
  ctx.clearRect(0, 0, width, height);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const size: SceneSize = { width, height };
  const baseScale = (Math.max(width, height) * 0.83) / camera.distance;
  const geometry = tracks.map((_, index) => {
    const sampler: TrackSampler = (position, drift = 0, depthDrift = 0) => {
      const offset = trackOffset(index, position, time, width);
      // The tube and particles share one fixed perspective. The depth range stays well in front of the near plane.
      return project({
        x: (position - 0.5) * width / baseScale,
        y: -(offset.y + drift) / baseScale,
        z: offset.z + depthDrift,
      }, camera, size)!;
    };
    const core = index === 0;
    const points = sample(sampler, 0, 1, Math.min(210, Math.ceil(width / 6)));
    const lighting = streakPoints(sampler, time, index, core);
    return {
      core,
      sections: core ? [{ near: false, points }] : depthSections(points, camera.distance),
      light: lighting && {
        sections: core ? [{ near: false, points: lighting.points }] : depthSections(lighting.points, camera.distance),
        tail: lighting.tail * width,
        head: lighting.head * width,
      },
      dots: particles[index].map((particle) => ({
        ...particle,
        point: sampler((particle.phase + time * particle.speed) % 1, particle.drift, particle.depth),
      })),
    };
  });

  // Give the backbone a shaded body between the rear and front strands.
  for (const layer of ["back", "core", "front"]) {
    for (const track of geometry) {
      if (track.core !== (layer === "core")) continue;
      const near = layer === "front";
      for (const section of track.sections) {
        if (section.near === near) strokeTrack(ctx, section.points, near, track.core);
      }
      if (track.light) {
        for (const section of track.light.sections) {
          if (section.near === near) strokeStreak(ctx, section.points, track.light.tail, track.light.head, track.core, near);
        }
      }
      for (const { point, radius, brightness } of track.dots) {
        if (!track.core && (point.depth < camera.distance) !== near) continue;
        const scale = point.scale / baseScale;
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius * scale, 0, tau);
        ctx.fillStyle = `rgba(243,249,255,${brightness * (layer === "back" ? 0.63 : 1)})`;
        ctx.fill();
      }
    }
  }
}

export function TimelineStream() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0;
    let height = 0;
    let frame = 0;
    let previous = 0;
    let time = 0;

    const draw = () => {
      if (width && height) renderStream(ctx, width, height, reducedMotion.matches ? 0 : time);
    };
    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      const ratio = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      draw();
    };
    const animate = (now: number) => {
      if (previous) time += Math.min((now - previous) / 1000, 0.05);
      previous = now;
      draw();
      frame = requestAnimationFrame(animate);
    };
    const updateMotion = () => {
      cancelAnimationFrame(frame);
      previous = 0;
      if (document.hidden || reducedMotion.matches) draw();
      else frame = requestAnimationFrame(animate);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    updateMotion();
    reducedMotion.addEventListener("change", updateMotion);
    document.addEventListener("visibilitychange", updateMotion);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      reducedMotion.removeEventListener("change", updateMotion);
      document.removeEventListener("visibilitychange", updateMotion);
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.stream} aria-hidden="true" />;
}
