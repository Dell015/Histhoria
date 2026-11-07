import type { Entity, EntityKind, Universe } from "./types";
import { entityStage } from "./lore";

export interface Pos {
  x: number;
  y: number;
}

const LANES: EntityKind[] = ["event", "person", "place", "item", "concept", "word"];
const NODE_W = 190;
const ROW_H = 74;

/**
 * Timeline: x is time, y is a lane per kind. Nodes that collide in a lane
 * are pushed into extra rows, so nothing overlaps.
 * axis "story"   = in-universe year
 * axis "release" = the order the lore reached players
 */
export function timelineLayout(u: Universe, axis: "story" | "release"): Map<string, Pos> {
  const xs = new Map<string, number>();

  if (axis === "release") {
    // Spread inside each stage so items from one patch don't stack.
    const seen = new Map<number, number>();
    for (const e of u.entities) {
      const st = entityStage(u, e.id);
      const n = seen.get(st) ?? 0;
      seen.set(st, n + 1);
      xs.set(e.id, st * 620 + n * 8);
    }
  } else {
    // Years cluster ("-305, -305, -300 ... 0 ... 15"), so spacing by year
    // would squash everything. Space by rank instead: order is preserved,
    // gaps stay readable.
    const own = new Map<string, number>();
    for (const e of u.entities) {
      const mine = u.claims
        .filter((c) => (c.subject === e.id || c.object === e.id) && c.when !== undefined)
        .map((c) => c.when as number);
      if (mine.length) own.set(e.id, Math.min(...mine));
    }
    const ranks = [...new Set(own.values())].sort((a, b) => a - b);
    const rankX = (w: number) => ranks.indexOf(w) * 250;
    for (const e of u.entities) {
      const w = own.get(e.id);
      if (w !== undefined) xs.set(e.id, rankX(w));
    }
    // Entities with no date (a word, say) sit beside what they are linked to.
    for (const e of u.entities) {
      if (xs.has(e.id)) continue;
      const near = u.claims
        .filter((c) => c.subject === e.id || c.object === e.id)
        .map((c) => xs.get(c.subject === e.id ? c.object : c.subject))
        .filter((x): x is number => x !== undefined);
      xs.set(e.id, near.length ? Math.min(...near) : 0);
    }
  }

  const out = new Map<string, Pos>();
  let y0 = 0;
  for (const kind of LANES) {
    const inLane = u.entities
      .filter((e) => e.kind === kind)
      .sort((a, b) => (xs.get(a.id)! - xs.get(b.id)!) || a.name.localeCompare(b.name));
    const rowEnds: number[] = [];
    for (const e of inLane) {
      const x = xs.get(e.id)!;
      let row = rowEnds.findIndex((end) => x >= end);
      if (row === -1) {
        row = rowEnds.length;
        rowEnds.push(0);
      }
      rowEnds[row] = x + NODE_W + 16;
      out.set(e.id, { x, y: y0 + row * ROW_H });
    }
    y0 += Math.max(1, rowEnds.length) * ROW_H + 46;
  }
  return out;
}

/**
 * Web: a small deterministic force layout. Same input, same picture,
 * so nodes never jump around when filters or spoiler progress change.
 */
export function webLayout(u: Universe): Map<string, Pos> {
  const ents: Entity[] = u.entities;
  const n = ents.length;
  const pos = ents.map((_, i) => {
    const a = (i / n) * Math.PI * 2;
    return { x: Math.cos(a) * 380, y: Math.sin(a) * 300 };
  });
  const index = new Map(ents.map((e, i) => [e.id, i]));
  const links = u.claims
    .map((c) => [index.get(c.subject)!, index.get(c.object)!] as const)
    .filter(([a, b]) => a !== undefined && b !== undefined);

  for (let step = 0; step < 320; step++) {
    const cool = 1 - step / 320;
    const fx = new Array<number>(n).fill(0);
    const fy = new Array<number>(n).fill(0);

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        let dx = pos[i].x - pos[j].x;
        let dy = pos[i].y - pos[j].y;
        const d2 = Math.max(dx * dx + dy * dy, 400);
        const d = Math.sqrt(d2);
        const f = 130000 / d2;
        dx /= d;
        dy /= d;
        fx[i] += dx * f;
        fy[i] += dy * f;
        fx[j] -= dx * f;
        fy[j] -= dy * f;
      }
    }
    for (const [a, b] of links) {
      const dx = pos[b].x - pos[a].x;
      const dy = pos[b].y - pos[a].y;
      const d = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
      const f = (d - 300) * 0.03;
      fx[a] += (dx / d) * f;
      fy[a] += (dy / d) * f;
      fx[b] -= (dx / d) * f;
      fy[b] -= (dy / d) * f;
    }
    for (let i = 0; i < n; i++) {
      fx[i] -= pos[i].x * 0.004;
      fy[i] -= pos[i].y * 0.004;
      pos[i].x += Math.max(-30, Math.min(30, fx[i])) * cool;
      pos[i].y += Math.max(-30, Math.min(30, fy[i])) * cool;
    }
  }

  // The forces get the shape right; this pass guarantees no two cards overlap.
  const W = 220;
  const H = 84;
  for (let pass = 0; pass < 80; pass++) {
    let moved = false;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = pos[j].x - pos[i].x;
        const dy = pos[j].y - pos[i].y;
        const ox = W - Math.abs(dx);
        const oy = H - Math.abs(dy);
        if (ox > 0 && oy > 0) {
          moved = true;
          // Push apart along the axis that needs the smaller shove.
          if (ox < oy) {
            const s = (dx >= 0 ? 1 : -1) * (ox / 2 + 1);
            pos[i].x -= s;
            pos[j].x += s;
          } else {
            const s = (dy >= 0 ? 1 : -1) * (oy / 2 + 1);
            pos[i].y -= s;
            pos[j].y += s;
          }
        }
      }
    }
    if (!moved) break;
  }

  return new Map(ents.map((e, i) => [e.id, { x: pos[i].x, y: pos[i].y }]));
}
