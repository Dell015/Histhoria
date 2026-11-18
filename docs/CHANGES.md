# Histhoria change log

Add an entry for each change. Include what changed, why, verification,
known limits, and follow-up work. Record any data format or migration.

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
