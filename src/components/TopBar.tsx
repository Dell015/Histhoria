"use client";

import { universes } from "@/lib/data/universes";
import { visibleClaims, visibleEntityIds } from "@/lib/lore";
import { useLore, useUniverse } from "@/lib/store";

function Seg<T extends string>({ value, options, onChange }: {
  value: T; options: { id: T; label: string }[]; onChange: (value: T) => void;
}) {
  return <div className="flex border border-line">
    {options.map((option) => <button key={option.id} aria-pressed={value === option.id}
      onClick={() => onChange(option.id)}
      className={`min-h-9 px-3 text-xs transition-colors ${value === option.id ? "bg-ember text-black" : "text-muted hover:text-ink"}`}>
      {option.label}
    </button>)}
  </div>;
}

export function TopBar() {
  const s = useLore();
  const universe = useUniverse();
  const pending = universe.stages.find((stage) => stage.order === s.pendingStage);
  const claims = visibleClaims(universe, s.progress);
  const locked = universe.claims.length - claims.length;

  return <header className="shrink-0 border-b border-line bg-panel">
    <div className="flex flex-wrap items-center gap-x-5 gap-y-3 px-4 py-3">
      <div className="flex w-full items-center justify-between gap-4 sm:w-auto sm:justify-start">
        <div className="font-serif text-xl tracking-wide text-ink">Histhoria<span className="text-ember">.</span></div>
        <label>
          <span className="sr-only">Game universe</span>
          <select value={s.universeId} onChange={(event) => s.setUniverse(event.target.value)}
            className="min-h-9 max-w-44 border border-line bg-bg px-2 text-xs text-ink">
            {Object.values(universes).map((item) => <option key={item.id} value={item.id}>
              {item.name}{item.id === "emberfall" ? " · demo" : ""}
            </option>)}
          </select>
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        <Seg value={s.view} onChange={s.setView} options={[{ id: "timeline", label: "Time stream" }, { id: "web", label: "Connection map" }]} />
        {s.view === "timeline" && <Seg value={s.axis} onChange={s.setAxis}
          options={[{ id: "story", label: "Story order" }, { id: "release", label: "Release order" }]} />}
      </div>
      <label className="flex w-full items-center justify-between gap-3 sm:ml-auto sm:w-auto">
        <span className="eyebrow">Spoiler shield</span>
        <select aria-label="Spoiler progress" value={s.pendingStage ?? s.progress}
          onChange={(event) => s.requestStage(Number(event.target.value))}
          className="min-h-9 min-w-0 max-w-60 border border-line bg-bg px-2 text-xs text-ink">
          {universe.stages.map((stage) => <option key={stage.id} value={stage.order}>{stage.label}</option>)}
        </select>
      </label>
    </div>
    {pending ? <div role="alert" className="border-t border-ember/30 bg-panel2 px-4 py-3 text-sm">
      <p className="text-ink"><strong className="text-ember">Spoiler warning.</strong> Unlocking {pending.label} reveals{" "}
        {visibleClaims(universe, pending.order).length - claims.length} facts and{" "}
        {visibleEntityIds(universe, pending.order).size - visibleEntityIds(universe, s.progress).size} names or items.</p>
      <p className="mt-1 text-xs text-muted">The shield unlocks all included story acts and attachments through this release.</p>
      <div className="mt-3 flex gap-2">
        <button onClick={s.confirmStage} className="min-h-9 bg-ember px-4 text-xs font-medium text-black">Show me</button>
        <button onClick={s.cancelStage} className="min-h-9 border border-line px-3 text-xs text-ink">Keep it hidden</button>
      </div>
    </div> : <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-2 text-[11px] text-muted">
      <span>{universe.coverage}</span>
      <span className="shrink-0 font-mono">{locked > 0 ? `${locked} facts hidden` : `${claims.length} sourced facts`}</span>
    </div>}
  </header>;
}
