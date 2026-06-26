"use client";

// Floating "[G] Group chat" hint. Visible when:
//   • the player is inside a house that opted into group chat
//     (currentHouse !== null in the store, set by the interior scene), and
//   • the overlay itself isn't open (the panel speaks for it then).
//
// Self-contained — reads the store directly so the layout call site
// stays a single <GroupChatPrompt /> with no props plumbing.

import { useGroupChatState } from "../client/useGroupChatState";

export function GroupChatPrompt() {
  const state = useGroupChatState();
  if (!state.currentHouse) return null;
  if (state.open) return null;
  return (
    <div className="nb-card-dark pointer-events-none fixed bottom-12 right-4 z-30 flex items-center gap-2 px-3 py-1.5">
      <span className="border-2 border-paper/20 bg-paper px-1.5 py-0.5 text-xs font-bold uppercase tracking-wider text-ink">
        G
      </span>
      <span className="text-xs font-bold uppercase tracking-wider leading-none text-paper">
        Group chat · {state.currentHouse.buildingLabel}
        <span className="ml-1 text-paper/60">
          · {state.othersHere + 1} here
        </span>
      </span>
    </div>
  );
}
