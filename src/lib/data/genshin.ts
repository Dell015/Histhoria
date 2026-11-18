import type { Universe } from "../types";

// First researched slice of the MAIN story, not a complete Genshin database.
// Quest dialogue is paraphrased; AZA links are explicitly community transcripts.
// All three acts shipped in 1.0. storyOrder is narrative order, never a year.
const act1 = "https://genshin.aza.gg/quest/1001?l=en";
const act2 = "https://genshin.aza.gg/quest/1002?l=en";
const act3 = "https://genshin.aza.gg/quest/1003?l=en";

export const genshin: Universe = {
  id: "genshin",
  name: "Genshin Impact",
  tagline: "Follow the Traveler through the Archon Quests, one sourced connection at a time.",
  coverage: "Mondstadt prologue · Acts I–III · first slice",
  storyComplete: false,
  initialProgress: -1,
  stages: [
    { id: "before", order: -1, label: "Not started" },
    { id: "1.0", order: 0, label: "1.0 · Mondstadt prologue" },
  ],
  story: [
    { id: "act1", title: "The Outlander Who Caught the Wind", summary: "Arrival, the dragon attack, and the Knights' response.", stage: 0, entityId: "arrival", sourceIds: ["g-arrival", "g-storm"] },
    { id: "act2", title: "For a Tomorrow Without Tears", summary: "A bard's plan to reach the dragon through the Holy Lyre.", stage: 0, entityId: "lyre-plan", sourceIds: ["g-plan", "g-tears"] },
    { id: "act3", title: "Song of the Dragon and Freedom", summary: "The rescue, its aftermath, and the road onward.", stage: 0, entityId: "rescue", sourceIds: ["g-rescue", "g-ending"] },
  ],
  sources: [
    { id: "g-arrival", kind: "quest", title: "Prologue I · Wind-Riding Knight", locator: "Amber's introduction and escort; community transcript", stage: 0, url: act1 },
    { id: "g-storm", kind: "quest", title: "Prologue I · Dragon Storm / Knights of Favonius", locator: "Dragon encounter and headquarters briefing; community transcript", stage: 0, url: act1 },
    { id: "g-plan", kind: "quest", title: "Prologue II · Venti's Plan", locator: "Cathedral plan for the Holy Lyre; community transcript", stage: 0, url: act2 },
    { id: "g-tears", kind: "quest", title: "Prologue II · Crystal Tears", locator: "Purification and restoration of the lyre; community transcript", stage: 0, url: act2 },
    { id: "g-reunion", kind: "quest", title: "Prologue II · Reunion With the Dragon", locator: "Interrupted attempt to reach Dvalin; community transcript", stage: 0, url: act2 },
    { id: "g-rescue", kind: "quest", title: "Prologue III · Calm Before the Storm / A Long Shot", locator: "Rescue party, confrontation, and escape; community transcript", stage: 0, url: act3 },
    { id: "g-ending", kind: "quest", title: "Prologue III · Ending Note", locator: "Cathedral aftermath and Venti's advice at Windrise; community transcript", stage: 0, url: act3 },
  ],
  entities: [
    { id: "arrival", name: "Arrival in Mondstadt", kind: "event", region: "Mondstadt", summary: "The Traveler reaches the city during the dragon crisis." },
    { id: "lyre-plan", name: "The plan to reach Dvalin", kind: "event", region: "Mondstadt", summary: "Venti proposes a rescue using music and purified tears." },
    { id: "rescue", name: "Dvalin's rescue", kind: "event", region: "Mondstadt", summary: "The party confronts Dvalin at his lair." },
    { id: "aftermath", name: "The cathedral aftermath", kind: "event", region: "Mondstadt", summary: "An encounter outside the cathedral changes the journey's stakes." },
    { id: "traveler", name: "The Traveler", kind: "person", summary: "The player character, searching for their separated sibling." },
    { id: "paimon", name: "Paimon", kind: "person", summary: "The Traveler's guide and traveling companion." },
    { id: "amber", name: "Amber", kind: "person", region: "Mondstadt", summary: "An Outrider of the Knights of Favonius." },
    { id: "jean", name: "Jean", kind: "person", region: "Mondstadt", summary: "Acting Grand Master of the Knights of Favonius." },
    { id: "venti", name: "Venti", kind: "person", region: "Mondstadt", summary: "A bard involved in the effort to help Dvalin." },
    { id: "diluc", name: "Diluc", kind: "person", region: "Mondstadt", summary: "An ally in the dragon rescue." },
    { id: "dvalin", name: "Dvalin / Stormterror", kind: "person", region: "Mondstadt", summary: "The dragon at the center of Mondstadt's crisis." },
    { id: "signora", name: "Signora", kind: "person", summary: "A Fatui Harbinger encountered at the prologue's end." },
    { id: "mondstadt", name: "Mondstadt", kind: "place", region: "Mondstadt", summary: "The first nation visited in the Archon Quests." },
    { id: "liyue", name: "Liyue", kind: "place", region: "Liyue", summary: "The neighboring nation named as the next destination." },
    { id: "lyre", name: "Holy Lyre der Himmel", kind: "item", region: "Mondstadt", summary: "The lyre used in Venti's attempt to reach Dvalin." },
    { id: "tears", name: "Dvalin's tears", kind: "item", summary: "Crystals that the Traveler can purify." },
    { id: "gnosis", name: "Venti's Gnosis", kind: "item", summary: "An archon's focus, discussed in the prologue's aftermath." },
    { id: "abyss", name: "The Abyss Order", kind: "concept", summary: "The hostile force interfering with the rescue." },
    { id: "knights", name: "Knights of Favonius", kind: "concept", region: "Mondstadt", summary: "The order organizing Mondstadt's defense." },
  ],
  claims: [
    { id: "g1", subject: "paimon", predicate: "travels with", object: "traveler", text: "Paimon accompanies the Traveler in the search for their sibling.", stage: 0, storyOrder: 0, sourceIds: ["g-arrival"] },
    { id: "g2", subject: "amber", predicate: "escorts", object: "traveler", text: "Amber escorts the Traveler toward Mondstadt.", stage: 0, storyOrder: 1, sourceIds: ["g-arrival"] },
    { id: "g3", subject: "traveler", predicate: "takes part in", object: "arrival", text: "The Traveler arrives as Stormterror threatens the city.", stage: 0, storyOrder: 2, sourceIds: ["g-storm"] },
    { id: "g4", subject: "arrival", predicate: "takes place in", object: "mondstadt", text: "The opening dragon encounter takes place in Mondstadt.", stage: 0, storyOrder: 2, sourceIds: ["g-storm"] },
    { id: "g5", subject: "dvalin", predicate: "attacks", object: "mondstadt", text: "Stormterror attacks Mondstadt directly.", stage: 0, storyOrder: 2, sourceIds: ["g-storm"] },
    { id: "g6", subject: "traveler", predicate: "repels", object: "dvalin", text: "The Traveler drives off the dragon during the city's attack.", stage: 0, storyOrder: 3, sourceIds: ["g-storm"] },
    { id: "g7", subject: "jean", predicate: "directs", object: "knights", text: "Jean directs the Knights' response to the dragon crisis.", stage: 0, storyOrder: 4, sourceIds: ["g-storm"] },
    { id: "g8", subject: "knights", predicate: "defend", object: "mondstadt", text: "The Knights work to protect Mondstadt from the storms.", stage: 0, storyOrder: 4, sourceIds: ["g-storm"] },
    { id: "g9", subject: "arrival", predicate: "is followed by", object: "lyre-plan", text: "After the initial defense, the story turns to Venti's rescue plan.", stage: 0, storyOrder: 5, sourceIds: ["g-storm", "g-plan"] },
    { id: "g10", subject: "venti", predicate: "proposes", object: "lyre-plan", text: "Venti proposes using the Holy Lyre to help Dvalin.", stage: 0, storyOrder: 5, sourceIds: ["g-plan"] },
    { id: "g11", subject: "lyre-plan", predicate: "uses", object: "lyre", text: "The plan relies on the Holy Lyre's Anemo power.", stage: 0, storyOrder: 5, sourceIds: ["g-plan"] },
    { id: "g12", subject: "dvalin", predicate: "shed", object: "tears", text: "The collected teardrop crystals come from Dvalin.", stage: 0, storyOrder: 6, sourceIds: ["g-tears"] },
    { id: "g13", subject: "traveler", predicate: "purifies", object: "tears", text: "The Traveler purifies the gathered teardrop crystals.", stage: 0, storyOrder: 6, sourceIds: ["g-tears"] },
    { id: "g14", subject: "tears", predicate: "restore", object: "lyre", text: "Purified tears restore the Holy Lyre's Anemo power.", stage: 0, storyOrder: 6, sourceIds: ["g-tears"] },
    { id: "g15", subject: "abyss", predicate: "disrupts", object: "lyre-plan", text: "The Abyss Order prevents the first rescue attempt from succeeding.", stage: 0, storyOrder: 7, sourceIds: ["g-reunion"] },
    { id: "g16", subject: "lyre-plan", predicate: "is followed by", object: "rescue", text: "The failed summons leads to a confrontation at Dvalin's lair.", stage: 0, storyOrder: 8, sourceIds: ["g-rescue"] },
    { id: "g17", subject: "jean", predicate: "joins", object: "rescue", text: "Jean accompanies the rescue party to the final confrontation.", stage: 0, storyOrder: 8, sourceIds: ["g-rescue"] },
    { id: "g18", subject: "diluc", predicate: "joins", object: "rescue", text: "Diluc stays with the party through Dvalin's rescue.", stage: 0, storyOrder: 8, sourceIds: ["g-rescue"] },
    { id: "g19", subject: "rescue", predicate: "frees", object: "dvalin", text: "The confrontation frees Dvalin from the venomous blood.", stage: 0, storyOrder: 9, sourceIds: ["g-rescue"] },
    { id: "g20", subject: "rescue", predicate: "is followed by", object: "aftermath", text: "After the rescue, the party returns to the cathedral.", stage: 0, storyOrder: 10, sourceIds: ["g-ending"] },
    { id: "g21", subject: "signora", predicate: "takes", object: "gnosis", text: "Signora takes Venti's Gnosis outside the cathedral.", stage: 0, storyOrder: 10, sourceIds: ["g-ending"] },
    { id: "g22", subject: "gnosis", predicate: "belonged to", object: "venti", text: "The stolen Gnosis is Venti's archon focus.", stage: 0, storyOrder: 10, sourceIds: ["g-ending"] },
    { id: "g23", subject: "aftermath", predicate: "points onward to", object: "liyue", text: "Venti advises the Traveler to continue to Liyue.", stage: 0, storyOrder: 11, sourceIds: ["g-ending"] },
  ],
  // Theory branches unlock only after the game's whole main story is mapped.
  theories: [],
};
