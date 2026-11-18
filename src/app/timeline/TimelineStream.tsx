"use client";

import { useEffect, useRef } from "react";
import styles from "./timeline.module.css";

const tau = 2 * Math.PI;
const tracks = [
  { amplitude: 0, frequency: 0, phase: 0, speed: 0.031, count: 96 },
  { amplitude: 23, frequency: 1.33, phase: 0.4, speed: 0.027, count: 50 },
  { amplitude: 19, frequency: 1.78, phase: 2.5, speed: 0.039, count: 48 },
  { amplitude: 14, frequency: 2.28, phase: 4.7, speed: 0.034, count: 46 },
];

const particles = tracks.map((track, trackIndex) => Array.from({ length: track.count }, (_, index) => {
  const seed = index + trackIndex * 101;
  return {
    phase: (index + ((seed * 29) % 79) / 79) / track.count,
    speed: track.speed * (0.94 + (seed % 9) * 0.016),
    drift: ((seed * 37) % 19 - 9) / 7,
    radius: 0.45 + ((seed * 19) % 14) / 15,
    brightness: 0.23 + ((seed * 17) % 61) / 100,
  };
}));

function trackOffset(index: number, position: number, time: number, width: number) {
  const core = 1.5 * Math.sin(tau * (position * 1.5 - time * 0.028))
    + 0.55 * Math.sin(tau * (position * 3.28 - time * 0.07));
  if (index === 0) return core;

  const track = tracks[index];
  const travel = position - time * track.speed;
  // Independent frequencies and a traveling envelope keep the strands from moving in sync.
  const envelope = 0.56 + 0.37 * Math.sin(tau * (travel * 0.86 - time * 0.011) + track.phase * 1.46);
  const wave = Math.sin(tau * travel * track.frequency + track.phase)
    + 0.28 * Math.sin(tau * (travel * 2.91 - time * 0.018) + track.phase * 0.72)
    + 0.13 * Math.sin(tau * (travel * 4.12 + time * 0.023) - track.phase);
  const scale = 0.72 + Math.min(1, width / 1100) * 0.28;
  return core + track.amplitude * scale * envelope * wave;
}

function path(ctx: CanvasRenderingContext2D, heightAt: (x: number) => number, from: number, to: number) {
  ctx.beginPath();
  ctx.moveTo(from, heightAt(from));
  for (let x = from + 5; x < to; x += 5) ctx.lineTo(x, heightAt(x));
  ctx.lineTo(to, heightAt(to));
}

function streak(ctx: CanvasRenderingContext2D, heightAt: (x: number) => number,
  width: number, time: number, index: number, core: boolean) {
  const length = width * (core ? 0.19 : 0.13);
  const cycle = (time / (29 + index * 2.5) + 0.18 + index * 0.26) % 1;
  const head = cycle * (width + length * 2) - length * 0.5;
  const tail = head - length;
  const from = Math.max(0, tail);
  const to = Math.min(width, head);
  if (to <= from) return;

  const light = ctx.createLinearGradient(tail, 0, head, 0);
  light.addColorStop(0, "rgba(190,215,255,0)");
  light.addColorStop(0.74, core ? "rgba(191,222,255,0.45)" : "rgba(179,211,255,0.35)");
  light.addColorStop(0.92, core ? "rgba(248,252,255,0.98)" : "rgba(222,239,255,0.80)");
  light.addColorStop(1, "rgba(219,236,255,0)");
  ctx.strokeStyle = light;
  ctx.lineWidth = core ? 4.5 : 2;
  ctx.shadowColor = "#bed9ffd9";
  ctx.shadowBlur = core ? 10 : 6;
  path(ctx, heightAt, from, to);
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function renderStream(ctx: CanvasRenderingContext2D, width: number, height: number, time: number) {
  ctx.clearRect(0, 0, width, height);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Draw the surrounding strands first so the backbone reads through crossings.
  for (const index of [1, 2, 3, 0]) {
    const core = index === 0;
    const heightAt = (x: number) => height / 2 + trackOffset(index, x / width, time, width);
    path(ctx, heightAt, 0, width);
    ctx.strokeStyle = core ? "rgba(151,192,247,0.09)" : "rgba(142,183,237,0.055)";
    ctx.lineWidth = core ? 15 : 7;
    ctx.stroke();
    ctx.strokeStyle = core ? "rgba(164,205,255,0.21)" : "rgba(157,190,236,0.11)";
    ctx.lineWidth = core ? 7 : 3;
    ctx.stroke();
    ctx.strokeStyle = core ? "rgba(207,229,255,0.75)" : "rgba(191,216,252,0.50)";
    ctx.lineWidth = core ? 3.2 : 1;
    ctx.stroke();
    streak(ctx, heightAt, width, time, index, core);

    for (const particle of particles[index]) {
      const x = ((particle.phase + time * particle.speed) % 1) * width;
      const y = heightAt(x) + particle.drift;
      if (particle.brightness > 0.6) {
        ctx.beginPath();
        ctx.arc(x, y, particle.radius + 1.8, 0, tau);
        ctx.fillStyle = "rgba(187,214,255,0.08)";
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(x, y, particle.radius, 0, tau);
      ctx.fillStyle = `rgba(243,249,255,${particle.brightness})`;
      ctx.fill();
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
