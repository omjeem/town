"use client";

// Dialogue overlay — used by NPC interactions across the town.
//
// Behavior:
//   • Lines reveal one character at a time (typewriter) and auto-advance
//     to the next line with a short pause — no SPACE required between lines.
//   • SPACE or click on the card while typing → reveal the entire dialogue
//     instantly (jump to all-done).
//   • SPACE or click when all lines are revealed → fire the primary action.
//   • ESC always closes immediately.
//
// Reuses the .nb-modal-card / .nb-modal-backdrop animation classes from
// globals.css so the overlay snaps in with the same game-feel pop as the
// other modals.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ui, type DialogueState } from "./store";

// Typewriter pacing. Drives an rAF loop that reveals characters based
// on elapsed time — the old setTimeout-per-char pattern was floored by
// React re-render + scheduler overhead so wall-clock pacing drifted.
// 80 chars/sec ≈ readable-with-typewriter-feel: a 40-char line takes
// ~500ms. Click / SPACE still reveals the whole line instantly.
const CHARS_PER_SEC = 80;
const LINE_PAUSE_MS = 200;

export function Dialogue({
  dialogue,
}: {
  dialogue: NonNullable<DialogueState>;
}) {
  // Index of the line we're currently revealing.
  const [lineIdx, setLineIdx] = useState(0);
  // Index of the character we're up to within the current line.
  const [charIdx, setCharIdx] = useState(0);

  // Reset the typewriter whenever the dialogue's identity changes (a new
  // NPC opens, or the same NPC re-publishes a different body). We key on
  // dialogue.key + the lines themselves so a follow-up message starts
  // fresh even if the React tree didn't unmount.
  const linesKey = useMemo(
    () => `${dialogue.key}::${dialogue.lines.join("␞")}`,
    [dialogue.key, dialogue.lines],
  );
  const prevLinesKey = useRef(linesKey);
  useEffect(() => {
    if (prevLinesKey.current !== linesKey) {
      prevLinesKey.current = linesKey;
      setLineIdx(0);
      setCharIdx(0);
    }
  }, [linesKey]);

  const currentLine = dialogue.lines[lineIdx] ?? "";
  const isLastLine = lineIdx >= dialogue.lines.length - 1;
  const isLineDone = charIdx >= currentLine.length;
  const allDone = isLastLine && isLineDone;

  // Typewriter ticker. Uses rAF + wall-clock elapsed time to reveal
  // characters at a guaranteed pace, independent of React re-render
  // overhead. Restarts only when the LINE changes so each per-char
  // re-render doesn't re-schedule the loop.
  useEffect(() => {
    if (currentLine.length === 0) return;
    const startedAt = performance.now();
    let raf = 0;
    const tick = () => {
      const elapsed = performance.now() - startedAt;
      const next = Math.min(
        currentLine.length,
        Math.floor((elapsed * CHARS_PER_SEC) / 1000),
      );
      setCharIdx(next);
      if (next < currentLine.length) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [currentLine]);

  // Auto-advance: once a line finishes, hold for a beat and move to the
  // next one. The player never has to press SPACE between lines.
  useEffect(() => {
    if (!isLineDone || isLastLine) return;
    const t = window.setTimeout(() => {
      setLineIdx((i) => i + 1);
      setCharIdx(0);
    }, LINE_PAUSE_MS);
    return () => window.clearTimeout(t);
  }, [isLineDone, isLastLine]);

  const advance = useCallback(() => {
    if (!allDone) {
      // Reveal everything instantly — jump to the last line, fully typed.
      setLineIdx(dialogue.lines.length - 1);
      setCharIdx((dialogue.lines.at(-1) ?? "").length);
      return;
    }
    // All lines done — fire the primary action (if any), else close.
    if (dialogue.action) {
      dialogue.action.onPress();
    } else {
      ui.closeDialogue();
    }
  }, [allDone, dialogue.lines, dialogue.action]);

  // ESC closes; SPACE advances. Both bypass the kaplay world because
  // ui.isPaused() includes dialogue.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        ui.closeDialogue();
        return;
      }
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        advance();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance]);

  return (
    // Ambient overlay — non-blocking. The outer wrapper is pointer-events
    // none so the kaplay canvas underneath still receives clicks/drags,
    // and the player can keep walking (arrow keys flow through window).
    // The card itself enables pointer events so its action buttons stay
    // clickable.
    <div className="pointer-events-none fixed inset-0 z-[58] flex items-end justify-center pb-10">
      <div
        className="nb-card-dark nb-modal-card pointer-events-auto relative flex w-[min(480px,92vw)] flex-col"
        onClick={(e) => {
          e.stopPropagation();
          advance();
        }}
      >
        <div className="flex items-center justify-between border-b-2 border-paper/15 px-3 py-1.5">
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className="inline-block h-2.5 w-2.5"
              style={{ background: dialogue.accent }}
            />
            <span className="text-xs font-bold uppercase tracking-wider text-paper">
              {dialogue.speaker}
            </span>
          </div>
          <div className="text-xs uppercase tracking-wider text-paper/50">
            {allDone ? "click to choose" : "click / SPACE to skip"}
          </div>
        </div>

        <div className="min-h-[80px] space-y-1.5 px-3 py-3 text-sm leading-relaxed text-paper">
          {dialogue.lines.slice(0, lineIdx).map((l, i) => (
            <p key={i} className="text-paper/60">
              {l}
            </p>
          ))}
          <p>
            {currentLine.slice(0, charIdx)}
            {!isLineDone ? (
              <span className="ml-0.5 inline-block animate-pulse">▍</span>
            ) : null}
          </p>
        </div>

        {(dialogue.action || dialogue.secondary) && (
          <div
            className={`flex items-center justify-end gap-2 border-t-2 border-paper/15 px-3 py-2 transition-opacity ${allDone ? "opacity-100" : "opacity-30"}`}
            onClick={(e) => e.stopPropagation()}
          >
            {dialogue.secondary ? (
              <button
                type="button"
                onClick={() => allDone && dialogue.secondary?.onPress()}
                disabled={!allDone}
                className="text-xs font-bold uppercase tracking-wider text-paper/60 hover:text-paper disabled:cursor-not-allowed"
              >
                {dialogue.secondary.label}
              </button>
            ) : null}
            {dialogue.action ? (
              <button
                type="button"
                onClick={() => allDone && dialogue.action?.onPress()}
                disabled={!allDone}
                className="flex items-center gap-2 border-2 border-paper/20 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-ink disabled:cursor-not-allowed disabled:opacity-50"
                style={{ background: dialogue.accent }}
              >
                <kbd className="border-2 border-ink bg-paper px-1.5 py-0.5 text-xs font-bold uppercase tracking-wider text-ink">
                  SPACE
                </kbd>
                <span>{dialogue.action.label}</span>
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
