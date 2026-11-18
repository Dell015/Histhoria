import type { Universe } from "./types";

export type Point3 = { x: number; y: number; z: number };
export type Camera = { target: Point3; yaw: number; pitch: number; distance: number };
export type SceneSize = { width: number; height: number };

const kinds = ["person", "place", "item", "event", "concept", "word"];
const branchLanes = [[-85, 76], [100, 48], [-75, -88], [92, -66], [-135, -18], [130, -32]];

/** Main story runs along X. Connected canon sits off the spine on Y and Z. */
export function streamLayout(universe: Universe, axis: "story" | "release") {
  const landmarks = new Map(universe.story.map((step, index) => [step.entityId, { step, index }]));
  const stepX = (index: number, stage: number) =>
    axis === "story" ? index * 290 : stage * 440 + index * 230 / Math.max(1, universe.story.length - 1);
  const positions = new Map<string, Point3>();
  const adjacent = new Map<string, string[]>();
  const first = new Map<string, { stage: number; order: number | undefined }>();
  for (const claim of universe.claims) {
    for (const [from, to] of [[claim.subject, claim.object], [claim.object, claim.subject]]) {
      const links = adjacent.get(from) ?? [];
      links.push(to);
      adjacent.set(from, links);
      const previous = first.get(from);
      const order = claim.storyOrder ?? claim.when;
      first.set(from, {
        stage: Math.min(previous?.stage ?? Infinity, claim.stage),
        order: order === undefined ? previous?.order : Math.min(previous?.order ?? Infinity, order),
      });
    }
  }
  for (const { step, index } of landmarks.values()) {
    positions.set(step.entityId, { x: stepX(index, step.stage), y: 0, z: 0 });
  }
  const stepOrders = universe.story.map((step) => first.get(step.entityId)?.order);

  // Propagate the nearest main story entry through the connected graph.
  const anchors = new Map([...landmarks].map(([id, landmark]) => [id, landmark.index]));
  const queue = [...landmarks.keys()];
  for (let cursor = 0; cursor < queue.length; cursor++) {
    for (const next of adjacent.get(queue[cursor]) ?? []) {
      if (anchors.has(next)) continue;
      anchors.set(next, anchors.get(queue[cursor])!);
      queue.push(next);
    }
  }
  const occupied = new Map<string, number>();
  for (const entity of universe.entities) {
    if (landmarks.has(entity.id)) continue;
    const timing = first.get(entity.id);
    const order = timing?.order;
    let index = anchors.get(entity.id) ?? 0;
    if (axis === "story" && order !== undefined) {
      let closest = Infinity;
      for (let i = 0; i < stepOrders.length; i++) {
        const candidate = stepOrders[i];
        if (candidate !== undefined && Math.abs(order - candidate) < closest) {
          closest = Math.abs(order - candidate);
          index = i;
        }
      }
    }
    const lane = kinds.indexOf(entity.kind);
    const [y, z] = branchLanes[lane];
    const bucket = `${index}:${lane}`;
    const offset = occupied.get(bucket) ?? 0;
    occupied.set(bucket, offset + 1);
    const stage = timing?.stage ?? universe.story[index]?.stage ?? 0;
    const anchor = stepX(index, stage);
    positions.set(entity.id, {
      x: anchor + (offset % 3 - 1) * 63 + (lane % 2) * 32,
      y: y + Math.floor(offset / 3) * Math.sign(y) * 64,
      z: z + (offset % 3) * 31,
    });
  }
  return positions;
}

/** Fixed-seed XYZ force layout for small maps. Above the cap, keep a stable sphere. */
export function connectionLayout(universe: Universe): Map<string, Point3> {
  const count = universe.entities.length;
  const radius = Math.max(165, Math.sqrt(count) * 36);
  const points = universe.entities.map((_, index) => {
    const y = 1 - 2 * (index + 0.5) / count;
    const ring = Math.sqrt(1 - y * y);
    const angle = index * Math.PI * (3 - Math.sqrt(5));
    return { x: radius * ring * Math.cos(angle), y: y * radius, z: radius * ring * Math.sin(angle) };
  });
  if (count <= 180) {
    const index = new Map(universe.entities.map((entity, i) => [entity.id, i]));
    const edges = universe.claims.flatMap(({ subject, object }) => {
      const from = index.get(subject);
      const to = index.get(object);
      return from !== undefined && to !== undefined && from !== to ? [[from, to]] : [];
    });
    for (let step = 0; step < 96; step++) {
      const forces = points.map(({ x, y, z }) => ({ x: -x * 0.012, y: -y * 0.012, z: -z * 0.012 }));
      const apply = (i: number, j: number, strength: (distance: number) => number) => {
        const difference = { x: points[j].x - points[i].x, y: points[j].y - points[i].y, z: points[j].z - points[i].z };
        const distance = Math.max(1, Math.hypot(difference.x, difference.y, difference.z));
        const scale = strength(distance) / distance;
        for (const key of ["x", "y", "z"] as const) {
          forces[i][key] += difference[key] * scale;
          forces[j][key] -= difference[key] * scale;
        }
      };
      for (let i = 0; i < count; i++) {
        for (let j = i + 1; j < count; j++) apply(i, j, (distance) => -190000 / Math.max(1600, distance ** 2));
      }
      for (const [i, j] of edges) apply(i, j, (distance) => (distance - 158) * 0.10);
      const cooling = 1 - step / 100;
      points.forEach((point, i) => {
        for (const key of ["x", "y", "z"] as const) point[key] += Math.max(-21, Math.min(21, forces[i][key])) * cooling;
      });
    }
  }
  return new Map(universe.entities.map((entity, index) => [entity.id, points[index]]));
}

export function rotatePoint(point: Point3, camera: Camera) {
  const x = point.x - camera.target.x;
  const y = point.y - camera.target.y;
  const z = point.z - camera.target.z;
  const horizontal = Math.cos(camera.yaw) * x - Math.sin(camera.yaw) * z;
  const depth = Math.sin(camera.yaw) * x + Math.cos(camera.yaw) * z;
  return {
    x: horizontal,
    y: Math.cos(camera.pitch) * y - Math.sin(camera.pitch) * depth,
    z: Math.sin(camera.pitch) * y + Math.cos(camera.pitch) * depth,
  };
}

export function project(point: Point3, camera: Camera, size: SceneSize) {
  const view = rotatePoint(point, camera);
  const depth = camera.distance - view.z;
  if (depth < 28) return null;
  const focal = Math.max(size.width, size.height) * 0.83;
  const scale = focal / depth;
  return { x: size.width / 2 + view.x * scale, y: size.height / 2 - view.y * scale, depth, scale };
}

export function fitCamera(points: Point3[], timeline: boolean, size: SceneSize): Camera {
  const min = { x: Infinity, y: Infinity, z: Infinity };
  const max = { x: -Infinity, y: -Infinity, z: -Infinity };
  for (const point of points) {
    for (const key of ["x", "y", "z"] as const) {
      min[key] = Math.min(min[key], point[key]);
      max[key] = Math.max(max[key], point[key]);
    }
  }
  const target = points.length ? {
    x: (min.x + max.x) / 2, y: (min.y + max.y) / 2, z: (min.z + max.z) / 2,
  } : { x: 0, y: 0, z: 0 };
  const camera: Camera = { target, yaw: timeline ? -0.29 : 0.32, pitch: timeline ? -0.35 : -0.14, distance: 400 };
  const focal = Math.max(size.width, size.height) * 0.83;
  const spaceX = Math.max(65, size.width / 2 - (size.width < 450 ? 55 : 83));
  const spaceY = Math.max(65, size.height / 2 - 85);
  for (const point of points) {
    const view = rotatePoint(point, camera);
    camera.distance = Math.max(camera.distance, view.z + focal * Math.max(Math.abs(view.x) / spaceX, Math.abs(view.y) / spaceY));
  }
  return camera;
}
