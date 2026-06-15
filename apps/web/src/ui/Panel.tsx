"use client";

import { useEffect } from "react";
import { ui, type PanelState } from "./store";

// Modal panel opened by SPACE while next to an interactable. Owns its own
// SPACE / ESC handling: SPACE fires the action button (if any), ESC closes.
// Kaplay's onKeyPress("space") is guarded by ui.isPaused() so it won't
// double-trigger while we're open.
export function Panel({ panel }: { panel: NonNullable<PanelState> }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        ui.closePanel();
      } else if (e.key === " ") {
        if (!panel.action) return;
        e.preventDefault();
        panel.action.onPress();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panel]);

  return (
    <div
      className="nb-modal-backdrop fixed inset-0 z-50 flex items-center justify-center"
      // dim the world behind the panel so the modal "owns" focus.
      style={{ background: "rgba(14, 17, 22, 0.55)" }}
      onClick={() => ui.closePanel()}
    >
      <div
        className="nb-card nb-modal-card relative w-[min(420px,92vw)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* accent header strip */}
        <div
          className="h-1.5 w-full"
          style={{ background: panel.accent }}
        />
        <div className="px-5 pt-4 pb-3">
          <div className="text-base font-black tracking-wide text-[#1a1d22]">
            {panel.title}
          </div>
          <div className="mt-3 space-y-1 font-mono text-[13px] leading-snug text-[#1a1d22]">
            {panel.lines.map((line, i) => (
              <div key={i} className={line === "" ? "h-2" : undefined}>
                {line}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between border-t-2 border-black px-4 py-3">
          <button
            type="button"
            className="text-xs font-medium uppercase text-[#1a1d22] opacity-60 hover:opacity-100"
            onClick={() => ui.closePanel()}
          >
            ESC to close
          </button>
          {panel.action ? (
            <button
              type="button"
              onClick={() => panel.action!.onPress()}
              className="nb-button flex items-center gap-2 px-3 py-1.5 text-sm font-bold"
              style={{ background: panel.accent }}
            >
              <kbd className="nb-key px-1.5 py-0.5 text-[10px] font-bold">
                SPACE
              </kbd>
              <span>{panel.action.label}</span>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
