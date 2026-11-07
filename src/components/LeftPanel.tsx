"use client";

import { useMemo, useState } from "react";
import { emberfall as universe } from "@/lib/data/emberfall";
import { authorStats, claimMap, entityMap, lineage, verdictOf, visibleEntityIds, visibleTheories } from "@/lib/lore";
import { useLore } from "@/lib/store";
import type { EntityKind, SourceKind, Theory } from "@/lib/types";
import { KIND_COLOR, KIND_LABEL, SOURCE_LABEL } from "./kinds";

const VERDICT_STYLE = {
  confirmed: { glyph: "✓", label: "Confirmed", cls: "text-[#8fc49a]" },
  partial: { glyph: "≈", label: "Partly right", cls: "text-partial" },
  refuted: { glyph: "✕", label: "Refuted", cls: "text-contra" },
  open: { glyph: "?", label: "Open", cls: "text-theory" },
} as const;

function Chip({ on, onClick, children, color }: { on: boolean; onClick: () => void; children: React.ReactNode; color?: string }) {
  return (
    <button
      onClick={onClick}
      style={on && color ? { borderColor: color, color } : undefined}
      className={`border px-2 py-1 text-[11px] transition-colors ${
        on ? "border-ember text-ember" : "border-line text-muted hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function Filters() {
  const s = useLore();
  const regions = [...new Set(universe.entities.map((e) => e.region).filter((r): r is string => !!r))];
  const active = s.kinds.length + s.sourceKinds.length + (s.region ? 1 : 0) + (s.query ? 1 : 0);

  return (
    <section className="border-b border-line p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="eyebrow">Filters</span>
        {active > 0 && (
          <button onClick={s.clearFilters} className="text-[11px] text-muted hover:text-ink">
            clear {active}
          </button>
        )}
      </div>
      <input
        value={s.query}
        onChange={(e) => s.setQuery(e.target.value)}
        placeholder="Search names…"
        className="w-full border border-line bg-bg px-2.5 py-1.5 text-sm text-ink outline-none placeholder:text-muted focus:border-ember"
      />
      <div className="mt-3 flex flex-wrap gap-1.5">
        {(Object.keys(KIND_LABEL) as EntityKind[]).map((k) => (
          <Chip key={k} on={s.kinds.includes(k)} onClick={() => s.toggleKind(k)} color={KIND_COLOR[k]}>
            {KIND_LABEL[k]}
          </Chip>
        ))}
      </div>
      <div className="eyebrow mb-1.5 mt-4">Only claims backed by</div>
      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(SOURCE_LABEL) as SourceKind[])
          .filter((k) => universe.sources.some((src) => src.kind === k))
          .map((k) => (
            <Chip key={k} on={s.sourceKinds.includes(k)} onClick={() => s.toggleSourceKind(k)}>
              {SOURCE_LABEL[k]}
            </Chip>
          ))}
      </div>
      <div className="eyebrow mb-1.5 mt-4">Region</div>
      <select
        value={s.region}
        onChange={(e) => s.setRegion(e.target.value)}
        className="w-full border border-line bg-bg px-2 py-1.5 text-sm text-ink outline-none focus:border-ember"
      >
        <option value="">Everywhere</option>
        {regions.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
    </section>
  );
}

function AddClaim({ theory }: { theory: Theory }) {
  const s = useLore();
  const [subject, setSubject] = useState("");
  const [predicate, setPredicate] = useState("");
  const [object, setObject] = useState("");
  const [text, setText] = useState("");

  const options = useMemo(() => {
    const unlocked = visibleEntityIds(universe, s.progress);
    return universe.entities.filter((e) => unlocked.has(e.id));
  }, [s.progress]);

  const ready = subject && object && subject !== object && predicate.trim() && text.trim();

  return (
    <div className="mt-3 border border-line bg-bg p-3">
      <div className="eyebrow mb-2">Add a claim to your theory</div>
      <div className="grid grid-cols-2 gap-2">
        <select value={subject} onChange={(e) => setSubject(e.target.value)} className="border border-line bg-panel px-1.5 py-1 text-xs text-ink">
          <option value="">from…</option>
          {options.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
        <select value={object} onChange={(e) => setObject(e.target.value)} className="border border-line bg-panel px-1.5 py-1 text-xs text-ink">
          <option value="">to…</option>
          {options.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
      </div>
      <input
        value={predicate}
        onChange={(e) => setPredicate(e.target.value)}
        placeholder="how (e.g. betrayed, hid, created)"
        className="mt-2 w-full border border-line bg-panel px-2 py-1 text-xs text-ink outline-none focus:border-ember"
      />
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        placeholder="Your reasoning, in one sentence"
        className="mt-2 w-full resize-none border border-line bg-panel px-2 py-1 text-xs text-ink outline-none focus:border-ember"
      />
      <button
        disabled={!ready}
        onClick={() => {
          s.addTheoryClaim(theory.id, {
            subject,
            predicate: predicate.trim(),
            object,
            text: text.trim(),
            basedOn: s.selectedClaim ? [s.selectedClaim] : [],
          });
          setPredicate("");
          setText("");
        }}
        className="mt-2 w-full bg-theory px-2 py-1.5 text-xs font-medium text-black disabled:opacity-30"
      >
        Draw it on the board
      </button>
      <p className="mt-1.5 text-[10.5px] text-muted">
        {s.selectedClaim ? "Linked to the canon claim you picked." : "Tip: pick a canon line first to link your reasoning to it."}
      </p>
    </div>
  );
}

function Theories() {
  const s = useLore();
  const ents = entityMap(universe);
  const claims = claimMap(universe);

  const all = useMemo(
    () => visibleTheories([...universe.theories, ...s.userTheories], s.progress),
    [s.userTheories, s.progress],
  );
  const active = all.find((t) => t.id === s.activeTheoryId) ?? null;
  const stats = useMemo(() => authorStats(universe, all, s.progress), [all, s.progress]);

  return (
    <section className="p-4">
      <div className="eyebrow mb-2">Theories · {all.length}</div>
      <div className="space-y-1.5">
        {all.map((t) => {
          const depth = lineage(all, t.id).length - 1;
          const on = t.id === s.activeTheoryId;
          return (
            <div key={t.id} style={{ paddingLeft: depth * 14 }}>
              <button
                onClick={() => s.setActiveTheory(on ? null : t.id)}
                className={`block w-full border-l-2 px-3 py-2 text-left transition-colors ${
                  on ? "border-theory bg-panel2" : "border-line hover:bg-panel2"
                }`}
              >
                <div className="font-serif text-[14px] leading-snug text-ink">{t.title}</div>
                <div className="eyebrow mt-0.5">
                  @{t.author}
                  {t.parentId ? " · fork" : ""}
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {active && (
        <div className="mt-4 border border-line p-3">
          <p className="text-[13px] leading-snug text-ink/85">{active.summary}</p>
          {active.parentId && (
            <p className="eyebrow mt-2">
              Branch of: {lineage(all, active.id).slice(0, -1).map((t) => t.title).join(" › ")}
            </p>
          )}
          <div className="mt-3 space-y-2.5">
            {active.claims.map((tc) => {
              const v = verdictOf(universe, tc, s.progress);
              const st = VERDICT_STYLE[v];
              const by = tc.resolution && v !== "open" ? claims.get(tc.resolution.byClaim) : undefined;
              return (
                <div key={tc.id} className="text-[12.5px] leading-snug">
                  <div className="flex gap-2">
                    <span className={`${st.cls} w-4 shrink-0 text-center font-mono`}>{st.glyph}</span>
                    <div>
                      <span className="text-ink">
                        {ents.get(tc.subject)?.name} <span className="text-theory">{tc.predicate}</span>{" "}
                        {ents.get(tc.object)?.name}
                      </span>
                      <div className="text-muted">{tc.text}</div>
                      {by && (
                        <div className="mt-0.5 text-[11.5px] text-muted">
                          <span className={st.cls}>{st.label}</span> by canon: {by.text}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {active.id.startsWith("u-") ? (
            <AddClaim theory={active} />
          ) : (
            <button
              onClick={() => s.forkTheory(active, "you")}
              className="mt-3 w-full border border-theory px-2 py-1.5 text-xs text-theory hover:bg-theory/10"
            >
              Fork this theory
            </button>
          )}
        </div>
      )}

      <div className="eyebrow mb-2 mt-6">Track record</div>
      <div className="space-y-1.5">
        {stats.map((a) => (
          <div key={a.author} className="flex items-baseline justify-between text-[12.5px]">
            <span className="text-ink">@{a.author}</span>
            <span className="font-mono text-muted">
              {a.hitRate === null ? "no verdicts yet" : `${Math.round(a.hitRate * 100)}%`}
              <span className="ml-2 text-[10.5px]">
                ✓{a.confirmed} ≈{a.partial} ✕{a.refuted}
              </span>
            </span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[10.5px] leading-snug text-muted">
        Confirmed counts 1, partly right counts ½. A verdict only exists when a canon claim is linked as the evidence.
      </p>
    </section>
  );
}

export function LeftPanel() {
  return (
    <aside className="hidden w-80 shrink-0 overflow-y-auto border-r border-line bg-panel lg:block">
      <Filters />
      <Theories />
    </aside>
  );
}
