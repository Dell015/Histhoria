# Genshin main-story research

Research date: November 18, 2026. This is a bounded first pass, not a complete
catalog of the current game.

## Product direction from Randel

Every game opens on its canon main story. Add canon side lore as branches
afterward. Open theory creation only once the game's main-story backbone is
complete. Finishing one region, or unlocking a spoiler shield, does not mark
the entire game's story complete.

`Universe.story` is the ordered entry path. `storyComplete` is a dataset
readiness flag, not a player's quest-completion flag. Genshin is false;
Emberfall remains a complete, invented demo for testing existing theory tools.

## Backbone and expansion order

The official [Teyvat storyline preview, Travail](https://www.youtube.com/watch?v=TAlKhARUcoY)
establishes the original regional roadmap: Mondstadt, Liyue, Inazuma, Sumeru,
Fontaine, Natlan, Snezhnaya, and the Khaenri'ah thread. It is a launch-era
preview, not a current quest index or proof that a chapter is complete.

Build by playable Archon Quest order, with the Traveler/sibling thread and
interludes kept in the main path. Do not treat regional order alone as a
complete list of main quests. Next research target: Liyue Acts I–III, then
the connecting Traveler quests. Check actual quest prerequisites before
placing interludes. Verify later releases separately rather than extrapolating
from Travail or marking previewed content as released.

## Implemented first slice

Mondstadt Prologue Acts I–III: 19 entities, 23 atomic claims, seven source
records, and three main-story entry points. No canon side-lore expansion and
no invented Genshin theories.

| Act | Quest text checked | Inspection link |
| --- | --- | --- |
| I · The Outlander Who Caught the Wind | Wind-Riding Knight; Dragon Storm; Knights of Favonius | [Community quest transcript](https://genshin.aza.gg/quest/1001?l=en) |
| II · For a Tomorrow Without Tears | Venti's Plan; Crystal Tears; Reunion With the Dragon | [Community quest transcript](https://genshin.aza.gg/quest/1002?l=en) |
| III · Song of the Dragon and Freedom | Calm Before the Storm; A Long Shot; Ending Note | [Community quest transcript](https://genshin.aza.gg/quest/1003?l=en) |

The underlying primary work is the in-game Archon Quest dialogue. These links
are third-party transcripts, explicitly labeled in the app; they are not
official HoYoverse pages. The [official Mondstadt character page](https://genshin.hoyoverse.com/en/character/mondstadt?char=11&lang=en)
was also cross-checked for the initial cast's roles. The full live game was
not replayed during this research. All summaries are original paraphrases.

## Spoilers and chronology

All three prologue acts were available in release 1.0. Preserve that single
release stage. `storyOrder` records narrative sequence without inventing
in-universe dates. Story navigation preserves the act order separately.

Genshin starts at “Not started,” with no entity nodes or quest titles shown.
Unlocking 1.0 requires confirmation and explicitly reveals the entire included
prologue. This is release-level protection; it cannot yet shield individual
quests inside one release. Quest-level protection should be a separate
progress field if added later, not a redefinition of `Claim.stage`.

## Entry policy for subsequent slices

Add canon claims with a specific quest/source locator and known release.
Keep speculation out of canon. Attribute uncertain explanations to their
speaker instead of promoting them to objective facts. Connect later canon
branches to a main-story entity or event with sourced arrows. Only set
`storyComplete` once the intended full main-story scope has been researched
and entered; leave it false while releases or connecting chapters are missing.
