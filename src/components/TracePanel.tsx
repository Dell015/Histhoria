"use client";

import { claimMap, entityMap, sourceMap, visibleClaims } from "@/lib/lore";
import { useLore, useUniverse } from "@/lib/store";
import type { Claim } from "@/lib/types";
import { KIND_COLOR, KIND_LABEL, SOURCE_LABEL } from "./kinds";
import { ClaimEvidence } from "./ClaimEvidence";

function SourceChips({ claim }: { claim: Claim }) {
  const universe = useUniverse();
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
  const universe = useUniverse();
  const ents = entityMap(universe);
  const claims = claimMap(universe);
  const other = ents.get(otherId)!;
  const rival = claim.contradicts ? claims.get(claim.contradicts) : undefined;
  const rivalVisible = rival && rival.stage <= s.progress;
  const picked = s.selectedClaim === claim.id;

  return (
    <div
      className={`atlas-claim border-l-2 px-3 py-3 ${picked ? "border-ember bg-panel2" : "border-line"} ${
        claim.contradicts ? "!border-contra" : ""
      }`}
    >
      <div className="flex flex-wrap items-baseline gap-x-2">
        <span className="eyebrow !text-ember">{claim.predicate}</span>
        {claim.track === "side" && <span className="text-[10px] text-side">Canon side lore</span>}
        <button onClick={() => s.exploreEntity(other.id)}
          className="min-h-8 text-left text-sm font-medium text-ink underline decoration-line underline-offset-4 hover:decoration-ember">
          {other.name}
        </button>
      </div>
      <button aria-pressed={picked} onClick={() => s.selectClaim(picked ? null : claim.id)} className="block w-full py-1 text-left text-[13px] leading-snug text-ink/80">
        {claim.text}
      </button>
      <SourceChips claim={claim} />
      {picked ? <ClaimEvidence key={`${universe.id}:${claim.id}`} universeId={universe.id} claimId={claim.id} />
        : <button onClick={() => s.selectClaim(claim.id)} className="mt-2 min-h-8 text-xs text-ember hover:underline">
          Evidence →
        </button>}
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
  const universe = useUniverse();
  const ents = entityMap(universe);

  if (!s.selectedEntity) {
    return <p className="p-5 text-sm text-muted">Select a point on the board to see its connections.</p>;
  }

  const e = ents.get(s.selectedEntity)!;
  const claims = visibleClaims(universe, s.progress);
  const cameFrom = claims.filter((c) => c.object === e.id);
  const leadsTo = claims.filter((c) => c.subject === e.id);

  return (
    <div aria-label="Trace and sources" className="atlas-trace">
      <div className="border-b border-line p-5 sm:p-6">
        <div>
          <span className="eyebrow" style={{ color: KIND_COLOR[e.kind] }}>
            {KIND_LABEL[e.kind]}
            {e.region ? ` · ${e.region}` : ""}
          </span>
        </div>
        <h3 className="mt-1 font-serif text-3xl leading-tight text-ink">{e.name}</h3>
        <p className="mt-2 text-sm text-muted">{e.summary}</p>
        <button onClick={() => { s.showNeighborhood(e.id); s.setOpenPanel(null); }}
          className="atlas-button mt-4">
          Focus connections <span aria-hidden="true">↗</span>
        </button>
      </div>

      <section className="p-5 sm:p-6">
        <h4 className="mb-3 text-sm font-semibold">Came from <span className="text-muted">· {cameFrom.length}</span></h4>
        {cameFrom.length === 0 && <p className="text-sm text-muted">Nothing earlier is known. This is where the thread starts.</p>}
        <div className="space-y-3">
          {cameFrom.map((c) => (
            <ClaimRow key={c.id} claim={c} otherId={c.subject} />
          ))}
        </div>
      </section>

      <section className="border-t border-line p-5 sm:p-6">
        <h4 className="mb-3 text-sm font-semibold">Leads to <span className="text-muted">· {leadsTo.length}</span></h4>
        {leadsTo.length === 0 && <p className="text-sm text-muted">Nothing is known to follow from this yet.</p>}
        <div className="space-y-3">
          {leadsTo.map((c) => (
            <ClaimRow key={c.id} claim={c} otherId={c.object} />
          ))}
        </div>
      </section>
    </div>
  );
}
