/**
 * Histhoria data model.
 *
 * Everything is a CLAIM. A claim is one sourced statement that connects two
 * entities ("Oren --forged--> Ashen Crown"). Canon is the set of claims backed
 * by official sources. A theory is a branch of proposed claims that sits on top
 * of canon, and each proposed claim can later be resolved by pointing at a
 * canon claim. No moderator decides "right or wrong": the linked evidence does.
 */

export type EntityKind = "person" | "place" | "item" | "event" | "concept" | "word";

export type SourceKind =
  | "game-text" // item / weapon / artifact descriptions, in-game books
  | "quest" // quest and NPC dialogue
  | "cutscene"
  | "manga" // books, comics, manga
  | "dev" // developer statement / interview
  | "official"; // official site, social post, patch notes

export interface Stage {
  /** Release order. Higher = later. Used by the spoiler shield. */
  order: number;
  id: string;
  label: string;
}

export interface Source {
  id: string;
  kind: SourceKind;
  title: string;
  /** Where inside the source (quest name, line, timestamp, page). */
  locator?: string;
  url?: string;
  /** Stage in which this source became available. */
  stage: number;
}

export interface Entity {
  id: string;
  name: string;
  kind: EntityKind;
  summary: string;
  region?: string;
}

export interface Claim {
  id: string;
  /** Entity the arrow starts from. */
  subject: string;
  /** Short verb phrase shown on the edge: "forged", "hid", "caused". */
  predicate: string;
  /** Entity the arrow points at. */
  object: string;
  /** Your own one-sentence summary (never a copy of in-game text). */
  text: string;
  /** In-universe year, if known. Negative = before year 0. */
  when?: number;
  /** Stage in which this claim became knowable. Drives the spoiler shield. */
  stage: number;
  sourceIds: string[];
  /** Set when this claim and another canon claim cannot both be true. */
  contradicts?: string;
  /** Short label for a contradiction: "plot hole", "retcon", "translation". */
  contradictionNote?: string;
}

export type Verdict = "confirmed" | "partial" | "refuted";

export interface TheoryClaim {
  id: string;
  subject: string;
  predicate: string;
  object: string;
  text: string;
  /** Canon claims this reasoning stands on. */
  basedOn: string[];
  resolution?: {
    verdict: Verdict;
    /** The canon claim that settled it. This is the evidence. */
    byClaim: string;
  };
}

export interface Theory {
  id: string;
  title: string;
  author: string;
  /** Set when this theory was forked from another one. */
  parentId?: string;
  /** Stage in which it was posted. Used to show who called it first. */
  postedAtStage: number;
  summary: string;
  claims: TheoryClaim[];
}

export interface Universe {
  id: string;
  name: string;
  tagline: string;
  stages: Stage[];
  sources: Source[];
  entities: Entity[];
  claims: Claim[];
  theories: Theory[];
}
