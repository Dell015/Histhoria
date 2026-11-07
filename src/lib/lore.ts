import type { Claim, Entity, Source, Theory, TheoryClaim, Universe, Verdict } from "./types";

/** Everything the viewer is allowed to see at a given spoiler progress. */
export function visibleClaims(u: Universe, progress: number): Claim[] {
  return u.claims.filter((c) => c.stage <= progress);
}

export function visibleEntityIds(u: Universe, progress: number): Set<string> {
  const ids = new Set<string>();
  for (const c of visibleClaims(u, progress)) {
    ids.add(c.subject);
    ids.add(c.object);
  }
  return ids;
}

export function entityMap(u: Universe): Map<string, Entity> {
  return new Map(u.entities.map((e) => [e.id, e]));
}

export function sourceMap(u: Universe): Map<string, Source> {
  return new Map(u.sources.map((s) => [s.id, s]));
}

export function claimMap(u: Universe): Map<string, Claim> {
  return new Map(u.claims.map((c) => [c.id, c]));
}

/** The stage an entity first becomes knowable. */
export function entityStage(u: Universe, entityId: string): number {
  let min = Infinity;
  for (const c of u.claims) {
    if ((c.subject === entityId || c.object === entityId) && c.stage < min) min = c.stage;
  }
  return min === Infinity ? 0 : min;
}

export interface Trace {
  /** Entities that lead into the selected one ("came from"). */
  upstream: Set<string>;
  /** Entities the selected one leads to. */
  downstream: Set<string>;
  /** Claims along either path. */
  claimIds: Set<string>;
}

/**
 * Walk the claim arrows from one entity in both directions.
 * Subject -> object means "leads to", so upstream follows arrows backwards.
 */
export function traceFrom(claims: Claim[], entityId: string, maxDepth = 4): Trace {
  const upstream = new Set<string>();
  const downstream = new Set<string>();
  const claimIds = new Set<string>();

  const walk = (dir: "up" | "down") => {
    let frontier = [entityId];
    const seen = new Set<string>([entityId]);
    for (let depth = 0; depth < maxDepth && frontier.length; depth++) {
      const next: string[] = [];
      for (const id of frontier) {
        for (const c of claims) {
          const from = dir === "down" ? c.subject : c.object;
          const to = dir === "down" ? c.object : c.subject;
          if (from !== id) continue;
          claimIds.add(c.id);
          if (!seen.has(to)) {
            seen.add(to);
            next.push(to);
            (dir === "down" ? downstream : upstream).add(to);
          }
        }
      }
      frontier = next;
    }
  };

  walk("up");
  walk("down");
  return { upstream, downstream, claimIds };
}

/** A theory claim's resolution is only shown once its evidence is unlocked. */
export function resolutionVisible(u: Universe, tc: TheoryClaim, progress: number): boolean {
  if (!tc.resolution) return false;
  const evidence = u.claims.find((c) => c.id === tc.resolution!.byClaim);
  return !!evidence && evidence.stage <= progress;
}

export function verdictOf(u: Universe, tc: TheoryClaim, progress: number): Verdict | "open" {
  return resolutionVisible(u, tc, progress) ? tc.resolution!.verdict : "open";
}

export interface AuthorStats {
  author: string;
  confirmed: number;
  partial: number;
  refuted: number;
  open: number;
  /** Confirmed counts 1, partial counts 0.5. Null until something is resolved. */
  hitRate: number | null;
}

export function authorStats(u: Universe, theories: Theory[], progress: number): AuthorStats[] {
  const by = new Map<string, AuthorStats>();
  for (const t of theories) {
    const s = by.get(t.author) ?? { author: t.author, confirmed: 0, partial: 0, refuted: 0, open: 0, hitRate: null };
    for (const tc of t.claims) {
      const v = verdictOf(u, tc, progress);
      if (v === "open") s.open++;
      else s[v]++;
    }
    by.set(t.author, s);
  }
  for (const s of by.values()) {
    const resolved = s.confirmed + s.partial + s.refuted;
    s.hitRate = resolved ? (s.confirmed + s.partial * 0.5) / resolved : null;
  }
  return [...by.values()].sort((a, b) => (b.hitRate ?? -1) - (a.hitRate ?? -1));
}

/** A theory is visible only if the stage it was posted in is unlocked. */
export function visibleTheories(theories: Theory[], progress: number): Theory[] {
  return theories.filter((t) => t.postedAtStage <= progress);
}

export function lineage(theories: Theory[], id: string): Theory[] {
  const chain: Theory[] = [];
  let cur = theories.find((t) => t.id === id);
  while (cur) {
    chain.unshift(cur);
    cur = cur.parentId ? theories.find((t) => t.id === cur!.parentId) : undefined;
  }
  return chain;
}
