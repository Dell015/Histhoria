"use client";

import { useMemo, useState } from "react";
import { neighborhoodFrom, sourceMap, traceFrom, visibleClaims, verdictOf } from "@/lib/lore";
import { connectionLayout, streamLayout } from "@/lib/spatial";
import { useLore, useUniverse } from "@/lib/store";
import { SpatialScene, type SceneEdge, type SceneNode } from "./SpatialScene";

const verdictColors = { confirmed: "#8fc49a", partial: "#e5b84a", refuted: "#e0433a", open: "#5fb8a8" };

export function Board() {
  const s = useLore();
  const universe = useUniverse();
  const [showSide, setShowSide] = useState(true);
  const timeline = s.view === "timeline";
  const sideVisible = showSide || !timeline;
  const { progress, axis, query, kinds, region, sourceKinds, selectedEntity, neighborhoodRoot,
    neighborhoodDepth, activeTheoryId, userTheories } = s;
  const positions = useMemo(() => timeline ? streamLayout(universe, axis) : connectionLayout(universe), [axis, timeline, universe]);
  const { nodes, edges, storyIds, sideCount } = useMemo(() => {
    const unlocked = visibleClaims(universe, progress);
    const mainClaims = unlocked.filter((claim) => claim.track !== "side");
    const mainIds = new Set(mainClaims.flatMap((claim) => [claim.subject, claim.object]));
    const landmarks = new Map(universe.story.filter((step) => step.stage <= progress).map((step, index) =>
      [step.entityId, axis === "release" && timeline
        ? universe.stages.find((stage) => stage.order === step.stage)?.label ?? "Main story"
        : `Story ${String(index + 1).padStart(2, "0")}`]));
    const canon = sideVisible ? unlocked : mainClaims;
    const unlockedIds = new Set(canon.flatMap((claim) => [claim.subject, claim.object]));
    for (const id of landmarks.keys()) unlockedIds.add(id);
    const theory = universe.storyComplete ? [...universe.theories, ...userTheories]
      .find((item) => item.id === activeTheoryId && item.postedAtStage <= progress) : undefined;
    const theoryClaims = (theory?.claims ?? []).filter((claim) => unlockedIds.has(claim.subject) && unlockedIds.has(claim.object));
    const nearby = neighborhoodRoot ? neighborhoodFrom([...canon, ...theoryClaims], neighborhoodRoot, neighborhoodDepth) : null;
    const q = query.trim().toLowerCase();
    const shown = universe.entities.filter((entity) => unlockedIds.has(entity.id)
      && (!nearby || nearby.has(entity.id))
      && (!kinds.length || kinds.includes(entity.kind))
      && (!region || entity.region === region)
      && (!q || `${entity.name} ${entity.summary}`.toLowerCase().includes(q)));
    const shownIds = new Set(shown.map((entity) => entity.id));
    const sourceById = sourceMap(universe);
    const links = canon.filter((claim) => shownIds.has(claim.subject) && shownIds.has(claim.object)
      && (!sourceKinds.length || claim.sourceIds.some((id) => {
        const source = sourceById.get(id);
        return source && sourceKinds.includes(source.kind);
      })));
    const trace = selectedEntity && shownIds.has(selectedEntity) ? traceFrom(links, selectedEntity) : null;
    const nodes: SceneNode[] = shown.map((entity) => ({
      id: entity.id, name: entity.name, kind: entity.kind, landmark: landmarks.get(entity.id),
      sideOnly: !mainIds.has(entity.id) && !landmarks.has(entity.id),
      dim: !!trace && entity.id !== selectedEntity && !trace.upstream.has(entity.id) && !trace.downstream.has(entity.id),
    }));
    const edges: SceneEdge[] = links.map((claim) => ({
      id: claim.id, from: claim.subject, to: claim.object, label: claim.predicate,
      color: claim.contradicts ? "#e0433a" : claim.track === "side" ? "#74bcad" : "#d9cfb8",
      dashed: !!claim.contradicts,
      opacity: trace ? trace.claimIds.has(claim.id) ? 0.74 : 0.11 : 0.44,
    }));
    for (const claim of theoryClaims) {
      if (!shownIds.has(claim.subject) || !shownIds.has(claim.object)) continue;
      edges.push({
        id: `theory-${claim.id}`, from: claim.subject, to: claim.object, label: claim.predicate,
        color: verdictColors[verdictOf(universe, claim, progress)], opacity: 0.85, dashed: true, theory: true,
      });
    }
    const storyIds = [...landmarks.keys()].filter((id) => shownIds.has(id));
    if (axis === "release" && timeline) storyIds.sort((a, b) => positions.get(a)!.x - positions.get(b)!.x);
    return { nodes, edges, storyIds,
      sideCount: unlocked.length - mainClaims.length };
  }, [activeTheoryId, axis, kinds, neighborhoodDepth, neighborhoodRoot, progress, query,
    positions, region, selectedEntity, sideVisible, sourceKinds, timeline, universe, userTheories]);

  const storyIndex = storyIds.indexOf(s.selectedEntity ?? "");
  const stepBy = (n: number) => {
    const id = storyIds[storyIndex + n];
    if (!id) return;
    s.exploreEntity(id);
    s.setMobilePanel(null);
  };

  return <div className="relative h-full w-full">
    {nodes.length > 0 && <SpatialScene timeline={timeline} positions={positions} nodes={nodes} edges={edges}
      storyIds={storyIds} selectedEntity={s.selectedEntity} selectedClaim={s.selectedClaim}
      focusRequest={s.focusRequest} neighborhood={!!neighborhoodRoot}
      frameKey={`${s.view}:${axis}:${progress}:${neighborhoodRoot}:${neighborhoodDepth}:${sideVisible}`}
      selectNode={s.selectEntity} selectEdge={(edge) => {
        if (s.selectedEntity !== edge.from && s.selectedEntity !== edge.to) s.selectEntity(edge.from);
        s.selectClaim(edge.id);
        s.setMobilePanel("trace");
      }} clearSelection={() => s.selectEntity(null)} />}
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-bg/90 px-4 pb-3 pt-4">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div>
          <h2 className="font-serif text-xl leading-tight text-ink">{timeline ? "Time stream" : "Connection map"}</h2>
          <p className="mt-1 text-[11px] text-muted">{neighborhoodRoot ? "Focused connections" : timeline ? "Main story in sequence" : "Explore relationships in 3D"} · {nodes.length} entities</p>
        </div>
        <div className="pointer-events-auto flex flex-wrap gap-2">
          {timeline && sideCount > 0 && <button onClick={() => setShowSide((value) => !value)} aria-pressed={showSide}
            className="min-h-8 border border-line px-2 text-xs text-theory">Side lore · {sideCount}</button>}
          {neighborhoodRoot ? <>
            <select aria-label="Connection depth" value={neighborhoodDepth}
              onChange={(event) => s.setNeighborhoodDepth(Number(event.target.value) as 1 | 2)}
              className="min-h-8 border border-line bg-panel px-2 text-xs text-ink">
              <option value={1}>1 link</option><option value={2}>2 links</option>
            </select>
            <button onClick={() => s.showNeighborhood(null)} className="min-h-8 border border-ember px-2 text-xs text-ember">Full story</button>
          </> : selectedEntity && nodes.some((node) => node.id === selectedEntity) &&
            <button onClick={() => s.showNeighborhood(selectedEntity)} className="min-h-8 border border-ember px-2 text-xs text-ember">Focus connections</button>}
        </div>
      </div>
      {timeline && storyIds.length > 0 && !neighborhoodRoot && <div className="pointer-events-auto mt-2 inline-flex border border-line bg-panel text-xs">
        <button aria-label="Previous story step" onClick={() => stepBy(-1)} disabled={storyIndex <= 0} className="spatial-control px-2">←</button>
        <button aria-label="Next story step" onClick={() => stepBy(1)} disabled={storyIndex >= storyIds.length - 1} className="spatial-control px-2">
          {storyIndex < 0 ? "Start story" : "Next"} →
        </button>
      </div>}
    </div>
    {nodes.length === 0 && <div className="absolute inset-0 flex items-center justify-center p-6">
      <div className="max-w-sm border-l-2 border-ember bg-panel p-6">
        <h2 className="font-serif text-2xl leading-tight text-ink">{progress < 0 ? "Start with the main story." : "No matching lore"}</h2>
        <p className="mt-3 text-sm text-muted">{progress < 0
          ? "Unlock the first release when you’re ready to see its story."
          : "Clear the filters to return to the story."}</p>
        <button onClick={() => progress < 0 ? s.requestStage(universe.story[0].stage) : s.clearFilters()}
          className="mt-5 min-h-10 bg-ember px-4 text-xs font-medium text-black">
          {progress < 0 ? "Unlock the prologue" : "Clear filters"}
        </button>
      </div>
    </div>}
  </div>;
}
