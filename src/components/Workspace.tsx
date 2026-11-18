"use client";

import { useEffect } from "react";
import { Board } from "./Board";
import { LeftPanel } from "./LeftPanel";
import { TopBar } from "./TopBar";
import { TracePanel } from "./TracePanel";
import { useLore } from "@/lib/store";

export function Workspace() {
  const hydrated = useLore((s) => s.hydrated);
  const panel = useLore((s) => s.mobilePanel);
  const universeId = useLore((s) => s.universeId);
  const setPanel = useLore((s) => s.setMobilePanel);
  const hydrate = useLore((s) => s.hydrate);
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!hydrated) return <div role="status" className="flex h-dvh items-center justify-center bg-bg font-serif text-xl text-ink">Opening the story…</div>;

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <LeftPanel />
        <main aria-label="Lore board" className={`relative min-w-0 flex-1 ${panel ? "hidden lg:block" : "block"}`}>
          <Board key={universeId} />
        </main>
        <TracePanel />
      </div>
      <nav aria-label="Workspace panels" className="flex shrink-0 border-t border-line bg-panel pb-[env(safe-area-inset-bottom)] lg:hidden">
        {([{ id: null, label: "Board" }, { id: "explore", label: "Main story & explore" }, { id: "trace", label: "Trace & sources" }] as const).map((item) => (
          <button key={item.label} aria-pressed={panel === item.id} onClick={() => setPanel(item.id)}
            className={`min-h-12 flex-1 border-t-2 px-1 text-xs ${panel === item.id ? "border-ember text-ember" : "border-transparent text-muted"}`}>
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
