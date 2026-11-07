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

- Timeline (story order or release order) and Web views, pan and zoom, minimap
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
- Real universes (Valorant, Mobile Legends)
- Phone layout (panels are desktop only for now)
- Open JSON export

## Next steps, in order

1. Pick the first real universe and decide how its first slice is entered.
2. Move canon to a database with accounts, so people other than us can add.
3. Merge requests, then votes and comments.
