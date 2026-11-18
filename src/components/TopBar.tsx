"use client";

import { universes } from "@/lib/data/universes";
import { useLore, useUniverse } from "@/lib/store";

export function TopBar() {
  const s = useLore();
  const filterCount = s.kinds.length + s.sourceKinds.length + Number(Boolean(s.region)) + Number(Boolean(s.query.trim()));

  return <header className="atlas-header">
    <div className="atlas-header-inner">
      <div className="atlas-identity">
        <span className="atlas-mark" aria-hidden="true"><i /><i /></span>
        <span className="atlas-wordmark">Histhoria</span>
        <div className="atlas-header-divider" />
        <label className="atlas-game">
          <span className="sr-only">Game universe</span>
          <select value={s.universeId} onChange={(event) => s.setUniverse(event.target.value)}>
            {Object.values(universes).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
      </div>
      <div className="atlas-header-actions">
        <button className="atlas-button atlas-search" onClick={() => s.setOpenPanel("explore")} aria-label="Search lore"
          aria-keyshortcuts="Control+K Meta+K /">
          <span className="search-icon" aria-hidden="true" />
          <span className="hidden sm:inline">Search lore</span>
          {filterCount > 0 && <span className="search-filter-count">{filterCount}</span>}
          <kbd className="hidden sm:inline" aria-hidden="true">/</kbd>
        </button>
        <button className="atlas-button atlas-more" onClick={() => s.setOpenPanel("settings")} aria-label="View options">
          <span aria-hidden="true">···</span>
        </button>
      </div>
    </div>
  </header>;
}

export function ViewSettings() {
  const s = useLore();
  const universe = useUniverse();
  return <div className="atlas-settings">
    <label>
      <strong>Spoiler shield</strong>
      <span>Set how far you’ve played.</span>
      <select aria-label="Spoiler progress" value={s.progress} onChange={(event) => s.requestStage(Number(event.target.value))}>
        {universe.stages.map((stage) => <option key={stage.id} value={stage.order}>{stage.label}</option>)}
      </select>
    </label>
    <label>
      <strong>Time stream order</strong>
      <span>Choose how the timeline is arranged.</span>
      <select aria-label="Time stream order" value={s.axis} onChange={(event) => s.setAxis(event.target.value as typeof s.axis)}>
        <option value="story">Story order</option>
        <option value="release">Release order</option>
      </select>
    </label>
    {universe.storyComplete && <button className="atlas-button" onClick={() => s.setOpenPanel("theories")}>Theory branches →</button>}
  </div>;
}
