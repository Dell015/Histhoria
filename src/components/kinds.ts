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
  person: "#b5c6eb",
  place: "#93b9db",
  item: "#d6cbc4",
  event: "#ced4ed",
  concept: "#acaecc",
  word: "#adbadb",
};

export const SOURCE_LABEL: Record<SourceKind, string> = {
  "game-text": "Item / game text",
  quest: "Quest / dialogue",
  cutscene: "Cutscene",
  manga: "Manga / book",
  dev: "Dev statement",
  official: "Official post",
};
