"use client";

import { useEffect } from "react";
import { Board } from "./Board";
import { LeftPanel } from "./LeftPanel";
import { TopBar } from "./TopBar";
import { TracePanel } from "./TracePanel";
import { useLore } from "@/lib/store";

export function Workspace() {
  const hydrate = useLore((s) => s.hydrate);
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <div className="flex h-screen flex-col">
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <LeftPanel />
        <main className="relative min-w-0 flex-1">
          <Board />
        </main>
        <TracePanel />
      </div>
    </div>
  );
}
