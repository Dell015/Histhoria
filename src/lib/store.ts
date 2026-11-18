import { create } from "zustand";
import type { EntityKind, SourceKind, Theory, TheoryClaim } from "./types";
import { defaultUniverse, universes } from "./data/universes";

const KEY = "histhoria-v1";

interface Saved {
  progress: number;
  userTheories: Theory[];
}

function storageKey(universeId: string) {
  // Keep existing Emberfall forks and progress under their original key.
  return universeId === "emberfall" ? KEY : `${KEY}:${universeId}`;
}

function load(universeId: string): Saved | null {
  try {
    const raw = window.localStorage.getItem(storageKey(universeId));
    if (!raw) return null;
    const saved = JSON.parse(raw) as Partial<Saved>;
    const universe = universes[universeId];
    if (!universe.stages.some((stage) => stage.order === saved.progress)) return null;
    return { progress: saved.progress!, userTheories: Array.isArray(saved.userTheories) ? saved.userTheories : [] };
  } catch {
    return null;
  }
}

function save(universeId: string, s: Saved) {
  try {
    window.localStorage.setItem(storageKey(universeId), JSON.stringify(s));
  } catch {
    /* private mode or blocked storage: the app still works, it just forgets */
  }
}

interface State {
  universeId: string;
  hydrated: boolean;
  /** Highest release stage the viewer has agreed to see. */
  progress: number;
  /** A later stage the viewer clicked but has not confirmed yet. */
  pendingStage: number | null;

  view: "timeline" | "web";
  axis: "story" | "release";

  selectedEntity: string | null;
  selectedClaim: string | null;
  activeTheoryId: string | null;
  neighborhoodRoot: string | null;
  neighborhoodDepth: 1 | 2;
  focusRequest: number;
  mobilePanel: "explore" | "trace" | null;

  kinds: EntityKind[];
  sourceKinds: SourceKind[];
  region: string;
  query: string;

  userTheories: Theory[];

  hydrate: () => void;
  setUniverse: (id: string) => void;
  exploreEntity: (id: string) => void;
  showNeighborhood: (id: string | null) => void;
  setNeighborhoodDepth: (depth: 1 | 2) => void;
  setMobilePanel: (panel: State["mobilePanel"]) => void;
  requestStage: (n: number) => void;
  confirmStage: () => void;
  cancelStage: () => void;
  setView: (v: State["view"]) => void;
  setAxis: (a: State["axis"]) => void;
  selectEntity: (id: string | null) => void;
  selectClaim: (id: string | null) => void;
  setActiveTheory: (id: string | null) => void;
  toggleKind: (k: EntityKind) => void;
  toggleSourceKind: (k: SourceKind) => void;
  setRegion: (r: string) => void;
  setQuery: (q: string) => void;
  clearFilters: () => void;
  forkTheory: (source: Theory, author: string) => string;
  addTheoryClaim: (theoryId: string, claim: Omit<TheoryClaim, "id">) => void;
}

const persist = (get: () => State) => {
  const { universeId, progress, userTheories } = get();
  save(universeId, { progress, userTheories });
};

export const useLore = create<State>((set, get) => ({
  universeId: defaultUniverse.id,
  hydrated: false,
  progress: defaultUniverse.initialProgress ?? 0,
  pendingStage: null,
  view: "timeline",
  axis: "story",
  selectedEntity: null,
  selectedClaim: null,
  activeTheoryId: null,
  neighborhoodRoot: null,
  neighborhoodDepth: 1,
  focusRequest: 0,
  mobilePanel: null,
  kinds: [],
  sourceKinds: [],
  region: "",
  query: "",
  userTheories: [],

  hydrate: () => {
    const universe = universes[get().universeId];
    const saved = load(universe.id);
    set({
      hydrated: true,
      progress: saved?.progress ?? universe.initialProgress ?? 0,
      userTheories: saved?.userTheories ?? [],
    });
  },

  setUniverse: (id) => {
    const universe = universes[id];
    if (!universe || id === get().universeId) return;
    const saved = load(id);
    set({
      universeId: id, progress: saved?.progress ?? universe.initialProgress ?? 0,
      userTheories: saved?.userTheories ?? [], pendingStage: null,
      selectedEntity: null, selectedClaim: null, activeTheoryId: null,
      neighborhoodRoot: null, neighborhoodDepth: 1, mobilePanel: null,
      kinds: [], sourceKinds: [], region: "", query: "", view: "timeline", axis: "story",
    });
  },
  exploreEntity: (id) => set((s) => ({
    selectedEntity: id, selectedClaim: null, query: "", kinds: [], sourceKinds: [], region: "",
    neighborhoodRoot: s.neighborhoodRoot ? id : null,
    focusRequest: s.focusRequest + 1, mobilePanel: "trace",
  })),
  showNeighborhood: (id) => set((s) => ({
    neighborhoodRoot: id, selectedEntity: id, selectedClaim: null,
    kinds: [], sourceKinds: [], region: "", query: "", focusRequest: s.focusRequest + 1,
  })),
  setNeighborhoodDepth: (neighborhoodDepth) => set({ neighborhoodDepth }),
  setMobilePanel: (mobilePanel) => set((s) => ({ mobilePanel,
    focusRequest: mobilePanel === null && s.selectedEntity ? s.focusRequest + 1 : s.focusRequest,
  })),

  requestStage: (n) => {
    if (!universes[get().universeId].stages.some((stage) => stage.order === n)) return;
    if (n <= get().progress) {
      set({ progress: n, pendingStage: null, selectedEntity: null, selectedClaim: null, activeTheoryId: null, neighborhoodRoot: null });
      persist(get);
    } else {
      set({ pendingStage: n });
    }
  },
  confirmStage: () => {
    const n = get().pendingStage;
    if (n === null) return;
    set({ progress: n, pendingStage: null });
    persist(get);
  },
  cancelStage: () => set({ pendingStage: null }),

  setView: (view) => set({ view }),
  setAxis: (axis) => set({ axis }),
  selectEntity: (id) => set({ selectedEntity: id, selectedClaim: null, mobilePanel: id ? "trace" : null }),
  selectClaim: (id) => set({ selectedClaim: id }),
  setActiveTheory: (id) => set({ activeTheoryId: id }),

  toggleKind: (k) =>
    set((s) => ({ kinds: s.kinds.includes(k) ? s.kinds.filter((x) => x !== k) : [...s.kinds, k] })),
  toggleSourceKind: (k) =>
    set((s) => ({
      sourceKinds: s.sourceKinds.includes(k) ? s.sourceKinds.filter((x) => x !== k) : [...s.sourceKinds, k],
    })),
  setRegion: (region) => set({ region }),
  setQuery: (query) => set({ query }),
  clearFilters: () => set({ kinds: [], sourceKinds: [], region: "", query: "" }),

  forkTheory: (source, author) => {
    if (!universes[get().universeId].storyComplete) return "";
    const id = `u-${Date.now().toString(36)}`;
    const fork: Theory = {
      ...source,
      id,
      author,
      parentId: source.id,
      title: `Fork: ${source.title.replace(/^Fork:\s*/, "")}`,
      postedAtStage: get().progress,
      summary: `Forked from @${source.author}'s "${source.title.replace(/^Fork:\s*/, "")}". Edit it by adding your own claims.`,
      // A fork starts unresolved. Your reasoning has to earn its own verdicts.
      claims: source.claims.map((c, i) => ({ ...c, id: `${id}-${i}`, resolution: undefined })),
    };
    set((s) => ({ userTheories: [...s.userTheories, fork], activeTheoryId: id }));
    persist(get);
    return id;
  },

  addTheoryClaim: (theoryId, claim) => {
    if (!universes[get().universeId].storyComplete) return;
    set((s) => ({
      userTheories: s.userTheories.map((t) =>
        t.id === theoryId ? { ...t, claims: [...t.claims, { ...claim, id: `${theoryId}-${t.claims.length}` }] } : t,
      ),
    }));
    persist(get);
  },
}));

export function useUniverse() {
  return universes[useLore((s) => s.universeId)];
}
