"use client";

import { useMemo, useState } from "react";
import { neighborhoodFrom, sourceMap, traceFrom, visibleClaims, verdictOf } from "@/lib/lore";
import { connectionLayout, streamLayout } from "@/lib/spatial";
import { useLore, useUniverse } from "@/lib/store";
import { SpatialScene, type SceneEdge, type SceneNode } from "./SpatialScene";

const verdictColors = { confirmed: "#95d2a3", partial: "#f2b56b", refuted: "#f1938b", open: "#bca7ec" };

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
        : `Chapter ${index + 1}`]));
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
      color: claim.contradicts ? "#f1938b" : claim.track === "side" ? "#79c9ba" : "#c2cadb",
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
    s.exploreEntity(id, false);
  };
  const stage = universe.stages.find((item) => item.order === progress);
  const firstStage = universe.story[0]?.stage;
  const locked = firstStage !== undefined && firstStage > progress && nodes.length === 0;
  const storyStep = universe.story.find((step) => step.entityId === storyIds[Math.max(storyIndex, 0)]);
  const canInspect = !!selectedEntity && nodes.some((node) => node.id === selectedEntity);

  if (nodes.length === 0) return <div className="atlas-empty">
    <div className="atlas-orbits" aria-hidden="true"><i /><i /><i /><b /><b /><b /></div>
    <div className="atlas-empty-copy">
      <h2>{locked ? "Start with the story" : "No matching lore"}</h2>
      <p>{locked ? "Choose when to reveal the quests, characters, and connections in this chapter." : "Clear your filters to bring the lore back into view."}</p>
      <button className="atlas-button atlas-primary" onClick={() => locked ? s.requestStage(firstStage) : s.clearFilters()}>
        {locked ? "Open main story" : "Clear filters"} <span aria-hidden="true">→</span>
      </button>
    </div>
  </div>;

  return <div className="atlas-board-layout">
    <div className="atlas-scene">
      <SpatialScene timeline={timeline} positions={positions} nodes={nodes} edges={edges}
      storyIds={storyIds} selectedEntity={s.selectedEntity} selectedClaim={s.selectedClaim}
      focusRequest={s.focusRequest} neighborhood={!!neighborhoodRoot}
      frameKey={`${s.view}:${axis}:${progress}:${neighborhoodRoot}:${neighborhoodDepth}:${sideVisible}`}
      selectNode={s.selectEntity} selectEdge={(edge) => {
        if (s.selectedEntity !== edge.from && s.selectedEntity !== edge.to) s.selectEntity(edge.from);
        s.selectClaim(edge.id);
        s.setOpenPanel("trace");
      }} clearSelection={() => s.selectEntity(null)} />
      <div className="atlas-scene-tools">
        <p className="atlas-scene-caption">{neighborhoodRoot ? "Focused connections" : timeline ? "Timeline" : "All connections"}</p>
        <div>
          {timeline && sideCount > 0 && <button onClick={() => setShowSide((value) => !value)} aria-pressed={showSide}
            className="atlas-button">Side lore{!showSide && " off"}</button>}
          {neighborhoodRoot ? <>
            <select aria-label="Connection depth" value={neighborhoodDepth}
              onChange={(event) => s.setNeighborhoodDepth(Number(event.target.value) as 1 | 2)}
              className="atlas-button">
              <option value={1}>1 link</option><option value={2}>2 links</option>
            </select>
            <button onClick={() => s.showNeighborhood(null)} className="atlas-button">Show all</button>
          </> : null}
        </div>
      </div>
    </div>
    {timeline && storyStep && !neighborhoodRoot ? <div className="atlas-story-dock">
      <div className="atlas-dock-copy" aria-live="polite">
        <p>Chapter {universe.story.indexOf(storyStep) + 1} of {universe.story.length}</p>
        <h2>{storyStep.title}</h2>
        <p>{storyStep.summary}</p>
      </div>
      <div className="atlas-dock-actions">
        <button className="atlas-button atlas-chapters-trigger" onClick={() => s.setOpenPanel("chapters")}>Chapters</button>
        {canInspect && <button className="atlas-button" onClick={() => s.setOpenPanel("trace")}>Details</button>}
        {storyIndex > 0 && <button className="atlas-button atlas-arrow" aria-label="Previous chapter" onClick={() => stepBy(-1)}>←</button>}
        {storyIndex < storyIds.length - 1 && <button className="atlas-button atlas-primary" onClick={() => stepBy(1)}>
          {storyIndex < 0 ? "Start story" : "Next chapter"} <span aria-hidden="true">→</span>
        </button>}
      </div>
    </div> : <div className="atlas-map-dock">
      <span>{canInspect ? universe.entities.find((entity) => entity.id === selectedEntity)?.name : stage?.label}</span>
      <div className="atlas-dock-actions">
        <button className="atlas-button atlas-chapters-trigger" onClick={() => s.setOpenPanel("chapters")}>Chapters</button>
        {canInspect && <button className="atlas-button" onClick={() => s.setOpenPanel("trace")}>Details</button>}
      </div>
    </div>}
  </div>;
}
