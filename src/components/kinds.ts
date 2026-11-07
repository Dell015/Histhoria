import type { EntityKind, SourceKind } from "@/lib/types";

export const KIND_LABEL: Record<EntityKind, string> = {
  person: "Person",
  place: "Place",
  item: "Item",
  event: "Event",
  concept: "Concept",
  word: "Word",
};

/** One tone per kind, all warm/earthy so the board reads as one object. */
export const KIND_COLOR: Record<EntityKind, string> = {
  person: "#e8743b",
  place: "#7fa6c9",
  item: "#e5b84a",
  event: "#d6574d",
  concept: "#a98bd1",
  word: "#8fc49a",
};

export const SOURCE_LABEL: Record<SourceKind, string> = {
  "game-text": "Item / game text",
  quest: "Quest / dialogue",
  cutscene: "Cutscene",
  manga: "Manga / book",
  dev: "Dev statement",
  official: "Official post",
};
