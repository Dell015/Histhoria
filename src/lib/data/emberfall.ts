import type { Universe } from "../types";

/**
 * EMBERFALL is an invented demo world. It exists so the board, the trace,
 * the spoiler shield and the theory branches can be built and tested without
 * misquoting any real game's lore. Real universes plug into the same shape.
 */
export const emberfall: Universe = {
  id: "emberfall",
  name: "Emberfall",
  tagline: "A demo world: one crown, two forgers, and a war that nobody agrees how it started.",
  stages: [
    { order: 0, id: "v1.0", label: "1.0 · Launch" },
    { order: 1, id: "v1.2", label: "1.2 · Lanterns" },
    { order: 2, id: "v2.0", label: "2.0 · The Unmaking" },
    { order: 3, id: "v2.4", label: "2.4 · The Last Wick" },
  ],
  sources: [
    { id: "s1", kind: "game-text", title: "Signet of Veyra (item text)", stage: 0 },
    { id: "s2", kind: "game-text", title: "The Ashen Crown (artifact text)", stage: 0 },
    { id: "s3", kind: "quest", title: "Lanterns at Dusk (Act 1 quest)", locator: "Dialogue with Sister Ilen", stage: 1 },
    { id: "s4", kind: "cutscene", title: "Chapter 3: The Unmaking", locator: "Throne room scene", stage: 2 },
    { id: "s5", kind: "manga", title: "Moth Order: Origins", locator: "Chapter 2", stage: 1 },
    { id: "s6", kind: "quest", title: "Keeper of the Last Wick", locator: "Final dialogue", stage: 3 },
    { id: "s7", kind: "dev", title: "Writers' lore Q&A", locator: "Answer 4", stage: 3 },
  ],
  entities: [
    { id: "veyra", name: "Queen Veyra", kind: "person", region: "Emberfall", summary: "Last queen of Emberfall." },
    { id: "oren", name: "Hollow King Oren", kind: "person", region: "Emberfall", summary: "Veyra's consort, remembered as the one who broke faith." },
    { id: "ilen", name: "Sister Ilen", kind: "person", region: "Lantern Vale", summary: "Survivor who carried the crown out of the ruins." },
    { id: "crown", name: "The Ashen Crown", kind: "item", summary: "A crown that burns without light." },
    { id: "wick", name: "The Last Wick", kind: "item", summary: "A flame kept alive in Lantern Vale." },
    { id: "sundering", name: "The Sundering", kind: "event", summary: "The night Emberfall fell." },
    { id: "emberfall", name: "Emberfall", kind: "place", region: "Emberfall", summary: "The fallen kingdom." },
    { id: "lantern", name: "Lantern Vale", kind: "place", region: "Lantern Vale", summary: "A valley of unlit lamps." },
    { id: "moth", name: "The Moth Order", kind: "concept", region: "Lantern Vale", summary: "Keepers who follow the flame." },
    { id: "oath", name: "The Oath", kind: "concept", summary: "A vow that bound the crown to its wearer." },
    { id: "kethra", name: "Kethra", kind: "word", summary: "An old word. Subtitles render it as \"ember-bound\"." },
  ],
  claims: [
    { id: "c1", subject: "veyra", predicate: "ruled", object: "emberfall", text: "Veyra is named as the ruler of Emberfall.", when: -300, stage: 0, sourceIds: ["s1"] },
    { id: "c2", subject: "oren", predicate: "forged", object: "crown", text: "The artifact text credits Oren with forging the crown.", when: -310, stage: 0, sourceIds: ["s2"], contradicts: "c3", contradictionNote: "retcon or unreliable text" },
    { id: "c3", subject: "veyra", predicate: "forged", object: "crown", text: "The throne-room cutscene shows Veyra, not Oren, at the forge.", when: -305, stage: 2, sourceIds: ["s4"], contradicts: "c2", contradictionNote: "retcon or unreliable text" },
    { id: "c4", subject: "crown", predicate: "set off", object: "sundering", text: "Villagers say the crown's flare marked the start of the Sundering.", when: 0, stage: 1, sourceIds: ["s3"] },
    { id: "c5", subject: "sundering", predicate: "destroyed", object: "emberfall", text: "The Sundering ended the kingdom of Emberfall.", when: 0, stage: 0, sourceIds: ["s1"] },
    { id: "c6", subject: "ilen", predicate: "carried out", object: "crown", text: "Ilen admits she carried the crown out of the ruins.", when: 2, stage: 1, sourceIds: ["s3"] },
    { id: "c7", subject: "ilen", predicate: "founded", object: "moth", text: "Ilen is credited with founding the Moth Order.", when: 10, stage: 1, sourceIds: ["s5"] },
    { id: "c8", subject: "moth", predicate: "guards", object: "lantern", text: "The Order watches over Lantern Vale.", when: 12, stage: 1, sourceIds: ["s5"] },
    { id: "c9", subject: "kethra", predicate: "is the name of", object: "oath", text: "\"Kethra\" is the old word for the Oath.", stage: 1, sourceIds: ["s3"] },
    { id: "c10", subject: "oath", predicate: "binds", object: "crown", text: "The Oath is what binds the crown to whoever wears it.", when: -305, stage: 2, sourceIds: ["s4"] },
    { id: "c11", subject: "oren", predicate: "broke", object: "oath", text: "Oren is shown breaking the Oath the night before the Sundering.", when: -1, stage: 2, sourceIds: ["s4"] },
    { id: "c12", subject: "oath", predicate: "breach caused", object: "sundering", text: "The cutscene links the Sundering directly to the broken Oath.", when: 0, stage: 2, sourceIds: ["s4"] },
    { id: "c13", subject: "wick", predicate: "burns in", object: "lantern", text: "The Last Wick burns in Lantern Vale.", when: 15, stage: 3, sourceIds: ["s6"] },
    { id: "c14", subject: "ilen", predicate: "tends", object: "wick", text: "Ilen spent her life tending the Wick.", when: 15, stage: 3, sourceIds: ["s6"] },
    { id: "c15", subject: "veyra", predicate: "swore", object: "oath", text: "Veyra swore the Oath on the day the crown was finished.", when: -305, stage: 2, sourceIds: ["s4"] },
    { id: "c16", subject: "wick", predicate: "is the core of", object: "crown", text: "Writers confirm the Wick is the flame at the crown's core.", when: -305, stage: 3, sourceIds: ["s6", "s7"] },
  ],
  theories: [
    {
      id: "t-vessel",
      title: "The crown is a vessel, not a weapon",
      author: "nyx",
      postedAtStage: 1,
      summary: "Everyone treats the crown as the cause. nyx thinks it only holds the thing that actually matters.",
      claims: [
        {
          id: "t1a", subject: "crown", predicate: "holds", object: "oath",
          text: "The crown is only a container. The Oath is the real power inside it.",
          basedOn: ["c2", "c9"],
          resolution: { verdict: "partial", byClaim: "c10" },
        },
        {
          id: "t1b", subject: "ilen", predicate: "set off", object: "sundering",
          text: "Ilen carrying the crown away is what set off the Sundering.",
          basedOn: ["c4", "c6"],
          resolution: { verdict: "refuted", byClaim: "c12" },
        },
        {
          id: "t1c", subject: "ilen", predicate: "hid the truth about", object: "crown",
          text: "Ilen knows more about the crown than she lets on.",
          basedOn: ["c6"],
        },
      ],
    },
    {
      id: "t-flame",
      title: "Fork: the flame was inside it all along",
      author: "marlo",
      parentId: "t-vessel",
      postedAtStage: 1,
      summary: "Keeps the vessel idea, drops the Ilen blame, and asks what is actually inside.",
      claims: [
        {
          id: "t2a", subject: "crown", predicate: "holds", object: "oath",
          text: "The crown is a container for the Oath.",
          basedOn: ["c2", "c9"],
          resolution: { verdict: "partial", byClaim: "c10" },
        },
        {
          id: "t2b", subject: "oren", predicate: "broke", object: "oath",
          text: "Oren is the one who broke the Oath, and that is why the story calls him hollow.",
          basedOn: ["c2", "c9"],
          resolution: { verdict: "confirmed", byClaim: "c11" },
        },
        {
          id: "t2c", subject: "wick", predicate: "is the core of", object: "crown",
          text: "The Wick Ilen carries is the same flame that was forged into the crown.",
          basedOn: ["c6", "c7"],
          resolution: { verdict: "confirmed", byClaim: "c16" },
        },
      ],
    },
  ],
};
