import { emberfall } from "./emberfall";
import { genshin } from "./genshin";
import type { Universe } from "../types";

export const universes: Record<string, Universe> = { genshin, emberfall };
export const defaultUniverse = genshin;
