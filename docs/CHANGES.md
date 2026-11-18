# Histhoria change log

Add an entry for each change. Include what changed, why, verification,
known limits, and follow-up work. Record any data format or migration.

## 2026-11-19 · Woven timeline stream

Replaced the parallel tracks with a thick central backbone and three thinner
waving strands. The canvas draws the glow, streaks, and 240 particles along
the same curves, so they stay together as the strands split and rejoin.
The motion pauses in background tabs and shows a static frame for reduced
motion.
Lint and production build passed. Verified the animation and centered
framing at desktop and 390px browser widths.

## 2026-11-19 · Glowing timeline tracks

Made the timeline background black and added five glowing tracks centered
on the screen. The stream has 240 particles that travel along the tracks
over 22 to 36 seconds, with separate glowing streaks moving left to right.
Production build and lint passed. Verified the centered glow and direction
at desktop and 390px browser widths.

## 2026-11-19 · Timeline particle stream

Added a thin stream of particles flowing left to right across the vertical
center of `/timeline`. CSS handles the motion and shows a static stream
when the system requests reduced motion.
Production build and lint passed. Browser checks confirmed the stream is
centered and moves right at desktop and 390px widths.

## 2026-11-19 · Blank timeline page

Added a separate `/timeline` route as a blank starting point for the timeline.
The production build passed and the route has no visible content.

## 2026-11-19 · Story-first interface

- Replaced the persistent three-column workspace with a main-story rail,
  a wider 3D board, and a chapter summary with next and previous actions.
- Added on-demand sheets for lore details, evidence, search, filters, view
  options, spoiler confirmation, and eligible theory branches.
- Applied midnight blue, ivory and amber across both views, preserving
  visual distinctions for canon side lore, contradictions, and theories.
- Added short camera transitions for story jumps and respected reduced
  motion. Kept progress, theories, claim IDs, and attachments compatible
  with existing saves. Connection map opens in overview when switching
  from the timeline, and resizing retains the intended framing.
- Verified 12 tests, TypeScript, lint, and the production build. Browser
  checks on desktop and at 390px covered spoiler cancellation and reveal,
  chapter navigation, keyboard search, orbit and focus, release order,
  and adding a link to a claim in the phone sheet.
- Inspiration and the design decisions are recorded in [Design](../DESIGN.md).
  Latest coverage remains the Mondstadt prologue.

## 2026-11-18 · 3D views and claim evidence

- Added the Time stream and Connection map in the story workspace. Both use
  the current canon, filters, shield, and eligible theory overlays.
- Added browser-local claim attachments for media, documents, and web links.
  Existing lore, progress, and theories use their original storage.
- Added an optional canon side-lore marker and tagged one existing Emberfall
  claim so the side-lore control can be tried with sourced demo content.
- Described controls, storage, behavior, and constraints in
  [3D views and evidence](3D_AND_EVIDENCE.md).
- Verified 12 tests, TypeScript, lint, and the production build. At desktop
  and 390px, verified mode switching, keyboard orbit, Emberfall's side-lore
  toggle, linked evidence and PNG persistence after reload, and an MP4
  preview that loaded a one-second test clip.
- The next main story coverage is Liyue. Shared evidence storage requires an
  accounts and storage model. Larger maps will need grouping or render limits.

## 2026-11-18 · First Genshin story slice

The initial Genshin board covers Mondstadt Prologue Acts I–III with 23 sourced
claims. Added per-game story paths and spoiler saves, search and phone
navigation, and the rule that theory creation opens after the main story is
complete. TypeScript, lint, production build, eight tests, and desktop and
390px browser checks passed. See [Genshin research](GENSHIN_RESEARCH.md).
