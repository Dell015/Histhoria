import { create } from "zustand";
import type { EntityKind, SourceKind, Theory, TheoryClaim } from "./types";

const KEY = "histhoria-v1";

interface Saved {
  progress: number;
  userTheories: Theory[];
}

function load(): Saved | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Saved) : null;
  } catch {
    return null;
  }
}

function save(s: Saved) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* private mode or blocked storage: the app still works, it just forgets */
  }
}

interface State {
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

  kinds: EntityKind[];
  sourceKinds: SourceKind[];
  region: string;
  query: string;

  userTheories: Theory[];

  hydrate: () => void;
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
  const { progress, userTheories } = get();
  save({ progress, userTheories });
};

export const useLore = create<State>((set, get) => ({
  hydrated: false,
  progress: 0,
  pendingStage: null,
  view: "timeline",
  axis: "story",
  selectedEntity: null,
  selectedClaim: null,
  activeTheoryId: null,
  kinds: [],
  sourceKinds: [],
  region: "",
  query: "",
  userTheories: [],

  hydrate: () => {
    const saved = load();
    set({
      hydrated: true,
      progress: saved?.progress ?? 0,
      userTheories: saved?.userTheories ?? [],
    });
  },

  requestStage: (n) => {
    if (n <= get().progress) {
      set({ progress: n, pendingStage: null });
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
  selectEntity: (id) => set({ selectedEntity: id, selectedClaim: null }),
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
    set((s) => ({
      userTheories: s.userTheories.map((t) =>
        t.id === theoryId ? { ...t, claims: [...t.claims, { ...claim, id: `${theoryId}-${t.claims.length}` }] } : t,
      ),
    }));
    persist(get);
  },
}));
