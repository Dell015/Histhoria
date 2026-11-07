"use client";

import { emberfall as universe } from "@/lib/data/emberfall";
import { visibleClaims, visibleEntityIds } from "@/lib/lore";
import { useLore } from "@/lib/store";

function Seg<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex border border-line">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`px-3 py-1.5 text-xs transition-colors ${
            value === o.id ? "bg-ember text-black" : "text-muted hover:text-ink"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function TopBar() {
  const s = useLore();
  const pending = s.pendingStage;

  const revealCount = (to: number) => {
    const facts = visibleClaims(universe, to).length - visibleClaims(universe, s.progress).length;
    const ents = visibleEntityIds(universe, to).size - visibleEntityIds(universe, s.progress).size;
    return { facts, ents };
  };

  const locked = universe.claims.length - visibleClaims(universe, s.progress).length;

  return (
    <header className="border-b border-line bg-panel">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2.5">
        <div className="mr-2">
          <div className="font-serif text-lg leading-none tracking-wide text-ink">Histhoria</div>
          <div className="eyebrow mt-1">{universe.name} · demo world</div>
        </div>

        <Seg
          value={s.view}
          onChange={s.setView}
          options={[
            { id: "timeline", label: "Timeline" },
            { id: "web", label: "Web" },
          ]}
        />
        {s.view === "timeline" && (
          <Seg
            value={s.axis}
            onChange={s.setAxis}
            options={[
              { id: "story", label: "Story order" },
              { id: "release", label: "Release order" },
            ]}
          />
        )}

        <div className="ml-auto flex items-center gap-3">
          <span className="eyebrow">Spoiler shield · I&apos;ve played up to</span>
          <div className="flex border border-line">
            {universe.stages.map((st) => {
              const open = st.order <= s.progress;
              const isPending = pending === st.order;
              return (
                <button
                  key={st.id}
                  onClick={() => s.requestStage(st.order)}
                  className={`px-3 py-1.5 text-xs transition-colors ${
                    st.order === s.progress
                      ? "bg-ember text-black"
                      : isPending
                        ? "bg-panel2 text-ember"
                        : open
                          ? "text-ink hover:bg-panel2"
                          : "text-muted hover:text-ink"
                  }`}
                  title={open ? "Unlocked" : "Locked: click to unlock"}
                >
                  {open ? "" : "🔒 "}
                  {st.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {pending !== null && (
        <div className="flex flex-wrap items-center gap-3 border-t border-line bg-[#2a1610] px-4 py-2 text-sm">
          <span className="text-ember">Spoiler warning.</span>
          <span className="text-ink/90">
            Unlocking <b>{universe.stages[pending].label}</b> reveals {revealCount(pending).facts} new facts and{" "}
            {revealCount(pending).ents} new names or items, and may resolve theories you haven&apos;t seen the answer to.
          </span>
          <button onClick={s.confirmStage} className="bg-ember px-3 py-1 text-xs font-medium text-black">
            Show me
          </button>
          <button onClick={s.cancelStage} className="border border-line px-3 py-1 text-xs text-muted hover:text-ink">
            Keep it hidden
          </button>
        </div>
      )}

      {pending === null && locked > 0 && (
        <div className="eyebrow border-t border-line px-4 py-1.5">
          {locked} fact{locked === 1 ? "" : "s"} hidden by the shield
        </div>
      )}
    </header>
  );
}
