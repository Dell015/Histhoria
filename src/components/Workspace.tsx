"use client";

import { useEffect, useRef } from "react";
import { Board } from "./Board";
import { MainStory, LoreSearch, Theories } from "./LeftPanel";
import { TopBar, ViewSettings } from "./TopBar";
import { TracePanel } from "./TracePanel";
import { useLore, useUniverse } from "@/lib/store";
import { visibleClaims, visibleEntityIds } from "@/lib/lore";

const panelTitles = {
  chapters: "Main story", explore: "Search lore", trace: "Lore details",
  settings: "View options", theories: "Theory branches",
};

function WorkspaceSheet() {
  const s = useLore();
  const universe = useUniverse();
  const pending = universe.stages.find((stage) => stage.order === s.pendingStage);
  const dialog = useRef<HTMLDialogElement>(null);
  const scroll = useRef<HTMLDivElement>(null);
  const { openPanel, selectedEntity } = s;
  const title = pending ? "Reveal story spoilers?" : openPanel ? panelTitles[openPanel] : null;

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (!title) {
      if (element.open) element.close();
      return;
    }
    if (!element.open) element.showModal();
    if (scroll.current) scroll.current.scrollTop = 0;
    element.querySelector<HTMLElement>("[data-sheet-focus]")?.focus({ preventScroll: true });
  }, [title]);

  useEffect(() => {
    if (openPanel === "trace" && scroll.current) scroll.current.scrollTop = 0;
  }, [openPanel, selectedEntity]);

  const dismiss = () => pending ? s.cancelStage() : s.setOpenPanel(null);
  return <dialog ref={dialog} className="atlas-sheet" aria-labelledby="atlas-sheet-title"
    onCancel={(event) => { event.preventDefault(); dismiss(); }}
    onClick={(event) => { if (event.target === event.currentTarget) dismiss(); }}>
    {title && <div className="atlas-sheet-shell">
      <div className="atlas-sheet-header">
        <h2 id="atlas-sheet-title">{title}</h2>
        <button className="atlas-button atlas-close" type="button" onClick={dismiss} aria-label="Close panel"
          data-sheet-focus={openPanel !== "explore" || pending ? "" : undefined}>×</button>
      </div>
      <div ref={scroll} className="atlas-sheet-body" key={title}>
        {pending ? <div className="atlas-confirm">
          <p>Show the story and evidence through <strong>{pending.label}</strong>?</p>
          <p className="text-muted">{visibleClaims(universe, pending.order).length - visibleClaims(universe, s.progress).length} more claims
            {" · "}{visibleEntityIds(universe, pending.order).size - visibleEntityIds(universe, s.progress).size} more entities</p>
          <div className="flex flex-wrap gap-2">
            <button className="atlas-button atlas-primary" onClick={() => {
              const first = universe.story[0];
              s.confirmStage();
              if (first && s.progress < first.stage && pending.order >= first.stage) s.exploreEntity(first.entityId, false);
              else s.setOpenPanel(null);
            }}>Reveal story</button>
            <button className="atlas-button" onClick={s.cancelStage}>Keep hidden</button>
          </div>
        </div> : openPanel === "chapters" ? <MainStory inSheet />
          : openPanel === "explore" ? <LoreSearch />
          : openPanel === "settings" ? <ViewSettings />
          : openPanel === "trace" ? <TracePanel />
          : openPanel === "theories" && universe.storyComplete ? <Theories /> : null}
      </div>
    </div>}
  </dialog>;
}

export function Workspace() {
  const hydrate = useLore((s) => s.hydrate);
  const hydrated = useLore((s) => s.hydrated);
  const universe = useUniverse();
  const view = useLore((s) => s.view);
  const setView = useLore((s) => s.setView);
  const setOpenPanel = useLore((s) => s.setOpenPanel);

  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => {
    function handleSearchShortcut(event: KeyboardEvent) {
      const element = event.target instanceof HTMLElement ? event.target : null;
      if (element?.matches("input, textarea, select") || element?.isContentEditable || useLore.getState().pendingStage !== null) return;
      if (event.key === "/" || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k")) {
        event.preventDefault();
        setOpenPanel("explore");
      }
    }
    window.addEventListener("keydown", handleSearchShortcut);
    return () => window.removeEventListener("keydown", handleSearchShortcut);
  }, [setOpenPanel]);

  if (!hydrated) return <div role="status" className="grid h-dvh place-items-center bg-bg font-serif text-xl">Opening the atlas…</div>;

  return <div className="atlas-app">
    <TopBar />
    <div className="atlas-workspace">
      <div className="atlas-intro">
        <div>
          <h1>{universe.name}</h1>
          <p>{universe.coverage.replace(/ · first slice$/, "")}</p>
        </div>
        <div className="atlas-modes" role="group" aria-label="View mode">
          <button aria-pressed={view === "timeline"} onClick={() => setView("timeline")}>Time stream</button>
          <button aria-pressed={view === "web"} onClick={() => setView("web")}>Connection map</button>
        </div>
      </div>
      <div className="atlas-content">
        <aside className="atlas-story-rail" aria-label="Main story"><MainStory /></aside>
        <main className="atlas-board" aria-label="Lore board">
          <Board key={universe.id} />
        </main>
      </div>
    </div>
    <WorkspaceSheet />
  </div>;
}
