# Histhoria: design decisions

Working title. A board where a game's lore can be traced line by line, with
forkable theories on top of canon. Fan-run, free, games first.

## What it is for

Show a player only what they need about a thing, and make it easy to see what
connects to what. Selecting anything fades the rest of the board and shows
**what it came from** and **what it led to**, with a source on every line.

## The model: everything is a claim

```
Entity   a person, place, item, event, concept or word
Claim    one sourced arrow:  subject --predicate--> object
Source   where the claim comes from (quest, cutscene, item text, manga, dev)
Theory   a branch of proposed claims that sits on top of canon
```

- **Canon** is the set of claims backed by official sources.
- A **theory claim** has the same shape as a canon claim, so a theory can be
  drawn on the same board and compared directly.
- A **fork** copies a theory's claims into a new theory with `parentId` set.
- Each claim stores the **release stage** it became knowable in. That one field
  drives the spoiler shield, the version history and "who called it first".

## Answers to the open questions

**Granularity (Q14).** A claim is one atomic statement ("Oren forged the
crown"), not a whole event and not a whole quest. A source has an optional
`locator` (quest, dialogue line, timestamp) so a single word can still be
pointed at. Rule of thumb: if changing one word changes the claim, it is its
own claim.

**Contradictions (Q10, Q12).** A canon claim can point at another with
`contradicts`. The board draws both in red dashes and the trace panel shows
both with a label ("retcon", "plot hole", "translation"). Nothing is deleted
or "fixed". If the rival claim is behind the spoiler shield, the panel says a
later source conflicts, without saying what.

**Who judges a theory (Q20).** Nobody. A verdict only exists when a canon claim
is linked as evidence (`resolution.byClaim`). The date comes free: the evidence
claim has a release stage, and the theory has `postedAtStage`, so "called it
before it dropped" is just two numbers. The fix for "what if people disagree
whether the evidence settles it": the evidence link is public, and a verdict
can be challenged by forking the theory and linking different evidence.

**Partly confirmed (Q21).** Scored per claim, not per theory. A theory is a
bundle, and the bundle is usually partly right. Verdicts are `confirmed`,
`partial` or `refuted`. A theorist's hit rate counts confirmed as 1 and partial
as 0.5, over resolved claims only.

**Spoilers (Q6, Q30).** The viewer sets how far they have played. Anything
from a later stage is removed from the board, not blurred, so it cannot leak
through an edge label. Moving the shield forward shows a warning with the
number of facts it will reveal. Theory verdicts stay hidden until their
evidence is unlocked. The timeline can be ordered by story or by release.

**Open data (Q37).** Yes, recommended: one JSON file per universe. It costs
almost nothing (the data already is JSON), and it is what lets people trust the
sources and build on them. Not built yet.

**Merging (Q17).** Fork is built. Merge is not. Plan: a merge request is
"add these claims to that theory", accepted or declined by the owner, claim by
claim, so no one ever has to resolve text conflicts.

## What is built

### 3D views and evidence

Both views project the same filtered lore onto a canvas with keyboard
accessible HTML nodes. The time stream places main-story steps along its
horizontal axis and moves related entities into depth. Sourced claims marked
`track: "side"` are optional in the stream and included in the connection
map. The spatial guide is navigation and claim arrows are the relationships.
The map uses stable three-dimensional positions so filters keep spatial
context. The Emberfall demo exercises side lore using an existing sourced
claim. Genshin content still follows the main-story-first plan.

Attachments have their own records indexed by universe and canon claim. They
are personal supplemental evidence. Curated citations remain in `sourceIds`.
Browser storage holds the actual file bytes and avoids putting video or image
data into localStorage. The app never fetches previews from saved link URLs.
See `docs/3D_AND_EVIDENCE.md` and `docs/CHANGES.md`.

### November 18 continuation

The owner clarified the product order: each game's canon main story is the
default backbone, canon side lore branches come afterward, and theory tools
open only after the main-story backbone is complete. This is content readiness,
not a viewer's spoiler progress. `Universe.storyComplete` enforces the gate in
both the UI and store mutations. Genshin remains incomplete and has no seeded
theories. Emberfall is the complete invented demo.

Added Genshin's Mondstadt prologue as the first researched main-story slice,
ordered story entry points per universe, explicit search navigation, one/two-link
neighborhoods, separate universe saves, and phone panel navigation. Narrative
sequence uses `storyOrder`; release stage keeps its original meaning. The
Genshin shield currently unlocks the whole included 1.0 prologue together.
See `docs/GENSHIN_RESEARCH.md` for source provenance and expansion order.

- Time stream (story or release order) and connection map, with orbit and zoom
- Click to trace: upstream and downstream, everything else fades
- Filters: kind, source type, region, search
- Spoiler shield with confirm-before-reveal
- Contradiction display
- Theories: overlay on the board, per-claim verdicts, fork, add your own
  claims, track record
- Invented demo world (Emberfall), so no real game's lore is misquoted

## What is not built

- Accounts, votes, comments (need a backend; Supabase is the likely fit)
- Merge requests
- Editing canon (right now canon is a TypeScript file)
- Full Genshin main-story coverage and additional real universes
- Quest-level spoiler progress inside a single release
- Open JSON export

## Next steps, in order

1. Continue researching and entering Genshin's main Archon Quest path; Liyue
   and the connecting Traveler quests are next. Keep theory creation closed.
2. Complete the intended main-story scope, then attach sourced canon side lore.
3. Open theory branches after the main-story backbone is complete. Backend,
   accounts, and collaboration remain future work.
