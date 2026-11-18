# Histhoria: handoff for the next agent

Read this first, then `DESIGN.md` (the reasoning) and `README.md` (how to run).

## What this is

A web app where a game's lore is a board you can trace. Click any item, person,
word or event and the rest fades. You see what it came from, what it led to,
and the source for every line. On top of canon, people draw theories as
branches (fork them, add claims), and each theory claim later gets a verdict
(confirmed, partly right, refuted) when a canon claim is linked as evidence.

Personal, fan-run, free, no monetization. Games only for now (movies, history
and business are deliberately deferred). "Histhoria" is a working title.

## Rules from the owner (Randel). Follow these.

- **Never commit or push to GitHub.** Not even if asked in passing. Leave
  changes in the working tree.
- When he says "ask me questions", list ALL questions in ONE message.
- Replies short, plain, casual. Lead with the outcome. No step-by-step recaps.
  He often works late and is tired.
- He is upskilling. After a non-trivial change add 1 to 3 lines: the concept
  and why this approach beat the alternative. When there is a real trade-off,
  give two options and a one-line recommendation.
- Take design initiative. He wants a committed, distinct look, never generic.
  Current look: near-black, ember orange accent, serif names, mono eyebrow
  labels. Do not drift to template gradients or pill cards.
- Find the root cause, state it in a sentence or two, then fix. No symptom patches.
- Be honest about what was not tested. Never say "fixed" without checking.
- Start working in the first reply. Only ask when the answer changes what gets built.
- Document every change as part of the work. Update user instructions when
  behavior changes, keep the design and data notes current, and add a dated
  entry to `docs/CHANGES.md` covering decisions, affected areas, verification
  results, known limits, and remaining work. Record any schema or storage
  changes and how existing data is handled. Keep documentation with the code.

## Stack and commands

Next 16 (App Router) · React 19 · TypeScript · Tailwind 4 · zustand 4 ·
@xyflow/react 12 (React Flow) · framer-motion (installed, not used yet).

The Next.js here is newer than most training data. Before using a Next API from
memory, read the matching guide in `node_modules/next/dist/docs/`.

```bash
npm install
npm run dev            # http://localhost:3200
npx tsc --noEmit       # must be clean
npx eslint src         # must be clean
npx next build         # run before calling anything done
```

Verify UI changes in a real browser at desktop width and ~390px phone width,
with screenshots. The last session verified desktop only.

## Data model (src/lib/types.ts)

Everything is a **claim**: one sourced arrow `subject --predicate--> object`.

- `Entity`: person, place, item, event, concept or word.
- `Claim`: arrow plus a one-sentence summary written in our own words (never
  copy in-game text), `stage` (release it became knowable in), optional `when`
  (in-universe year), `sourceIds`, optional `contradicts` + `contradictionNote`.
- `Source`: kind (game-text, quest, cutscene, manga, dev, official), title,
  optional `locator` (quest, line, timestamp) and `url`.
- `Theory`: author, optional `parentId` (fork), `postedAtStage`, `claims`.
- `TheoryClaim`: same arrow shape, `basedOn` canon claim ids, optional
  `resolution { verdict, byClaim }`. `byClaim` is the evidence. No moderator
  decides right or wrong.

`stage` is the key field. It drives the spoiler shield, the release-order
timeline and "who called it first".

## Where things live

- `src/lib/data/emberfall.ts`: INVENTED demo world (so no real lore is
  misquoted). Real universes must plug into the same `Universe` shape.
- `src/lib/lore.ts`: spoiler filtering, `traceFrom` (BFS both directions),
  verdicts (hidden until evidence is unlocked), `authorStats` (hit rate:
  confirmed = 1, partial = 0.5, over resolved claims only), theory lineage.
- `src/lib/layout.ts`: `timelineLayout` (lanes per kind, rank-based x so
  clustered years do not squash) and `webLayout` (deterministic force layout
  plus an overlap-removal pass). Same input gives the same picture, so nodes
  do not jump when filters change.
- `src/lib/store.ts`: zustand. Persists `progress` and `userTheories` to
  localStorage key `histhoria-v1` (wrapped in try/catch, hydrated in a
  `useEffect` to avoid SSR mismatch).
- `src/components/Board.tsx`: builds React Flow nodes and edges from state.
  Canon edges: cream. Contradictions: red dashed. Theory edges: dashed, colored
  by verdict (teal = open).
- `TopBar.tsx` (view, axis, spoiler shield with confirm bar), `LeftPanel.tsx`
  (filters, theories, fork, add-claim form, track record), `TracePanel.tsx`
  (came from / leads to / sources / contradiction callouts), `LoreNode.tsx`.

## Decisions already made (do not reopen without asking)

- Granularity: one atomic statement per claim. If changing one word changes
  it, it is its own claim.
- Contradictions are shown, never resolved or deleted. If the rival claim is
  behind the shield, the UI says a later source conflicts without saying what.
- Theory verdicts are per claim, not per theory.
- Spoiler shield REMOVES later lore from the board (not blur), so edge labels
  cannot leak. Moving it forward shows a warning with the count revealed.
- Forks start with verdicts cleared. A fork must earn its own.
- Many universes under one platform eventually (one site is cheaper).
- Merge plan: a merge request is "add these claims to that theory", accepted
  or declined claim by claim, so there are never text conflicts.
- Open JSON export per universe: recommended, not built.
- Dark only for now. A light mode was discussed and deferred.

## Known gaps, biggest first

1. **No real lore.** Only the Emberfall demo. First real universe not chosen
   (Valorant or Mobile Legends were the leading guesses). Needs a decision from
   Randel, and a plan for entering the first slice.
2. **No backend or accounts.** Forks live only in one browser. Canon is a
   TypeScript file. Supabase is the likely fit (the Supabase connector exists).
3. **Scale.** The web layout is O(n^2) and is fine for dozens of nodes, not
   thousands. Needs a neighborhood-only mode, grouping and jump-to-search.
   Biggest technical risk.
4. **Theories cannot add new entities**, only draw arrows between existing
   ones. Theorists will want to propose things canon does not have yet.
5. **No merge requests, votes, comments or follows.**
6. **No real version history.** Claims record their release stage, but there is
   no edit log, retcon history, or earlier versions of a theory.
7. **Phone layout.** Side panels are `hidden lg:block`, so phones get the board
   only. Web-only was the scope, but phones should at least work.
8. Release stages are hard-coded per universe in data. Fine, but check it
   scales to a game with dozens of patches.
9. No tests.
10. A few colors are hard-coded hex (edge colors and label backgrounds in
    `Board.tsx`, ring colors in `LoreNode.tsx`) instead of CSS variables. Move
    them to tokens before any theming work.
11. The React Flow minimap was removed (it rendered empty and covered nodes).
    Revisit it for large boards.
12. Name is unchecked: search the USPTO directly for HISTHORIA (also HISTORIA
    and HISTORA) in classes 9, 41 and 42, and check domains and handles. The
    closest conflicts found were HISTORIA (A&E) and HISTORA.

## Suggested next step

Pick one small real slice (one region or arc of one game) and load it, then
build the neighborhood mode (gap 3) against it. That tests the core idea with
real data before any backend work. Ask Randel which game first.

## Gotchas

- `fitView` re-runs on view, axis and `progress` changes only, not on every
  click. Adding more triggers will make the camera feel jumpy.
- Node positions come from layouts computed over ALL entities, then filtered,
  so hiding things does not reshuffle the board. Keep it that way.
- `ClaimRow` in `TracePanel.tsx` has a clickable name inside a button. It works
  but is not ideal for accessibility.
- An old `next start` process can hold port 3200 after a rebuild and serve a
  broken page. Kill it by PID. Do not use `pkill -f`.

## November 18, 2026 continuation (supersedes the gap list above)

Randel chose Genshin Impact. Every game must default to its canon main story.
Add canon side lore after the backbone. Theory branches open only when the
whole game's intended main-story backbone is complete, not when a viewer
unlocks one release or finishes one region.

- Genshin is now the default: Mondstadt Prologue Acts I-III, 23 claims,
  19 entities, seven source records. Main-story coverage remains incomplete.
- Read docs/GENSHIN_RESEARCH.md before entering more lore. Sources are
  explicitly labeled community transcripts of in-game quests. Next target:
  Liyue and the connecting Traveler Archon Quests, then expand along the
  playable main quest order. Do not infer release status from old previews.
- Universe.story supplies each game's ordered main path; storyComplete gates
  theory UI and store mutations. Genshin is false, Emberfall is a complete demo.
- Claim.storyOrder adds narrative sequence without inventing years or changing
  release-stage semantics. All Mondstadt prologue acts share release 1.0.
- Progress/forks persist per universe; the existing Emberfall key is preserved.
- Search results jump to entities. One/two-link focused neighborhoods limit
  rendering; webLayout still computes over all entities and remains O(n^2).
- Phone tabs expose the story, filters and source trace. Camera requests wait
  for a visible board and measured internal nodes, avoiding invalid transforms
  while panels are hidden. Ordinary selections still do not move the camera.
- Trace entity names and claim selections are now separate keyboard buttons.
- npm test (Node 22.18+ or 24) covers source references, spoiler boundaries,
  neighborhood depth/cycles, directional traces and verdict evidence.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
