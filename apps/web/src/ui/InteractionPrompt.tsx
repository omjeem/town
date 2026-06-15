"use client";

import type { PromptState } from "./store";

// Floating "[SPACE] <action>" prompt anchored to the bottom-center of the
// viewport while the player is adjacent to an interactable.
export function InteractionPrompt({ prompt }: { prompt: NonNullable<PromptState> }) {
  return (
    <div
      className="nb-card flex items-center gap-3 px-3 py-2"
      style={{
        // accent border feels like a directional cue without re-coloring
        // the whole card — preserves the neobrutalism black border.
        boxShadow: `3px 3px 0 0 #0e1116, inset 0 -3px 0 0 ${prompt.accent}`,
      }}
    >
      <kbd className="nb-key flex h-6 items-center justify-center px-2 text-[11px] font-bold">
        SPACE
      </kbd>
      <span className="text-sm font-semibold text-[#1a1d22]">{prompt.label}</span>
    </div>
  );
}
