"use client";

import { emberfall as universe } from "@/lib/data/emberfall";
import { claimMap, entityMap, sourceMap, visibleClaims } from "@/lib/lore";
import { useLore } from "@/lib/store";
import type { Claim } from "@/lib/types";
import { KIND_COLOR, KIND_LABEL, SOURCE_LABEL } from "./kinds";

function SourceChips({ claim }: { claim: Claim }) {
  const srcs = sourceMap(universe);
  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {claim.sourceIds.map((id) => {
        const src = srcs.get(id)!;
        const label = `${SOURCE_LABEL[src.kind]} · ${src.title}${src.locator ? ` (${src.locator})` : ""}`;
        const cls = "border border-line px-1.5 py-0.5 text-[10.5px] text-muted";
        return src.url ? (
          <a key={id} href={src.url} target="_blank" rel="noreferrer" className={`${cls} hover:text-ink`}>
            {label} ↗
          </a>
        ) : (
          <span key={id} className={cls}>
            {label}
          </span>
        );
      })}
    </div>
  );
}

function ClaimRow({ claim, otherId }: { claim: Claim; otherId: string }) {
  const s = useLore();
  const ents = entityMap(universe);
  const claims = claimMap(universe);
  const other = ents.get(otherId)!;
  const rival = claim.contradicts ? claims.get(claim.contradicts) : undefined;
  const rivalVisible = rival && rival.stage <= s.progress;
  const picked = s.selectedClaim === claim.id;

  return (
    <div
      className={`border-l-2 px-3 py-2 ${picked ? "border-ember bg-panel2" : "border-line"} ${
        claim.contradicts ? "!border-contra" : ""
      }`}
    >
      <button onClick={() => s.selectClaim(picked ? null : claim.id)} className="block w-full text-left">
        <div className="flex items-baseline gap-2">
          <span className="eyebrow !text-ember">{claim.predicate}</span>
          <span
            role="link"
            onClick={(e) => {
              e.stopPropagation();
              s.selectEntity(other.id);
            }}
            className="font-serif text-[15px] text-ink underline decoration-line underline-offset-4 hover:decoration-ember"
          >
            {other.name}
          </span>
        </div>
        <p className="mt-1 text-[13px] leading-snug text-ink/80">{claim.text}</p>
      </button>
      <SourceChips claim={claim} />
      {claim.contradicts && (
        <div className="mt-2 border border-contra/50 bg-contra/10 px-2 py-1.5 text-[12px] text-ink/90">
          <b className="text-contra">Contradiction</b>
          {claim.contradictionNote ? ` · ${claim.contradictionNote}` : ""}
          {rivalVisible ? (
            <>
              . Conflicts with: <i>{rival.text}</i>
            </>
          ) : (
            <>. A later source conflicts with this. It is hidden by your spoiler shield.</>
          )}
        </div>
      )}
    </div>
  );
}

export function TracePanel() {
  const s = useLore();
  const ents = entityMap(universe);

  if (!s.selectedEntity) {
    return (
      <aside className="hidden w-80 shrink-0 border-l border-line bg-panel p-5 lg:block">
        <div className="eyebrow">Trace</div>
        <p className="mt-3 font-serif text-lg leading-snug text-ink">Click anything on the board.</p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          You&apos;ll see only what it connects to: where it came from on the left of the arrow, where it leads on the
          right, and the source for every line. Everything unrelated fades out.
        </p>
        <div className="mt-5 space-y-2 text-xs text-muted">
          <div className="flex items-center gap-2">
            <span className="inline-block h-[2px] w-6 bg-canon" /> Canon claim
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-6 border-t-2 border-dashed border-contra" /> Canon contradicts itself
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-6 border-t-2 border-dashed border-theory" /> Theory (teal = unresolved)
          </div>
        </div>
      </aside>
    );
  }

  const e = ents.get(s.selectedEntity)!;
  const claims = visibleClaims(universe, s.progress);
  const cameFrom = claims.filter((c) => c.object === e.id);
  const leadsTo = claims.filter((c) => c.subject === e.id);

  return (
    <aside className="hidden w-80 shrink-0 overflow-y-auto border-l border-line bg-panel lg:block">
      <div className="border-b border-line p-5">
        <div className="flex items-center justify-between">
          <span className="eyebrow" style={{ color: KIND_COLOR[e.kind] }}>
            {KIND_LABEL[e.kind]}
            {e.region ? ` · ${e.region}` : ""}
          </span>
          <button onClick={() => s.selectEntity(null)} className="text-xs text-muted hover:text-ink">
            close ✕
          </button>
        </div>
        <h2 className="mt-1 font-serif text-2xl leading-tight text-ink">{e.name}</h2>
        <p className="mt-2 text-sm text-muted">{e.summary}</p>
      </div>

      <section className="p-5">
        <div className="eyebrow mb-2">Came from · {cameFrom.length}</div>
        {cameFrom.length === 0 && <p className="text-sm text-muted">Nothing earlier is known. This is where the thread starts.</p>}
        <div className="space-y-3">
          {cameFrom.map((c) => (
            <ClaimRow key={c.id} claim={c} otherId={c.subject} />
          ))}
        </div>
      </section>

      <section className="border-t border-line p-5">
        <div className="eyebrow mb-2">Leads to · {leadsTo.length}</div>
        {leadsTo.length === 0 && <p className="text-sm text-muted">Nothing is known to follow from this yet.</p>}
        <div className="space-y-3">
          {leadsTo.map((c) => (
            <ClaimRow key={c.id} claim={c} otherId={c.object} />
          ))}
        </div>
      </section>
    </aside>
  );
}
