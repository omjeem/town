"use client";

// Town Radio — pixel-art pill that sits above the BottomBar. Click
// toggles play/pause directly; the small ▾ on the right opens a
// popover with the 5-track list and prev / next controls.
//
// All audio state lives in the useTownRadio singleton so the popover
// and the pill stay in sync, and re-mounting either does not stop
// playback.

import { useEffect, useRef, useState } from "react";

import { useTownRadio } from "./useTownRadio";

export function TownRadio() {
  const radio = useTownRadio();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(e: PointerEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const playIcon = radio.playing ? "⏸" : "▶";

  return (
    <div ref={rootRef} className="relative">
      <div className="nb-card-dark flex h-7 items-stretch overflow-hidden text-paper">
        <button
          type="button"
          onClick={() => radio.toggle()}
          className="flex items-center gap-1.5 px-2.5 text-xs font-bold uppercase tracking-wider hover:bg-white/5"
          aria-label={radio.playing ? "Pause town radio" : "Play town radio"}
          title={radio.current.title}
        >
          <span aria-hidden className="font-mono text-[10px] leading-none">
            {playIcon}
          </span>
          <span className="truncate">Town Radio</span>
          <span className="text-paper/50">
            {radio.index + 1}/{radio.tracks.length}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label="Open track list"
          aria-expanded={open}
          className="flex items-center border-l-2 border-paper/15 px-2 text-xs font-bold uppercase tracking-wider hover:bg-white/5"
        >
          ▾
        </button>
      </div>

      {open ? <TrackPopover /> : null}
    </div>
  );
}

function TrackPopover() {
  const radio = useTownRadio();

  return (
    <div
      role="dialog"
      aria-label="Town radio playlist"
      className="nb-card-dark absolute left-0 z-40 mb-2 flex flex-col text-paper"
      style={{ bottom: "100%", width: 280 }}
    >
      <div className="flex items-center justify-between gap-2 border-b-2 border-paper/15 px-3 py-2">
        <span className="text-xs font-bold uppercase tracking-wider">
          Now playing
        </span>
        <span className="text-xs uppercase tracking-wider text-paper/50">
          {radio.index + 1}/{radio.tracks.length}
        </span>
      </div>

      <ul className="flex flex-col">
        {radio.tracks.map((t, i) => {
          const active = i === radio.index;
          return (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => radio.select(i)}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs uppercase tracking-wider hover:bg-white/5 ${
                  active ? "bg-white/10 text-paper" : "text-paper/70"
                }`}
              >
                <span aria-hidden className="font-mono text-[10px] leading-none w-3">
                  {active ? (radio.playing ? "⏸" : "▶") : i + 1}
                </span>
                <span className="flex-1 truncate font-bold">{t.title}</span>
                <span className="truncate text-paper/40">{t.author}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {radio.error ? (
        <div className="border-t-2 border-paper/15 px-3 py-2 text-xs text-red-300">
          Track unavailable — skip to the next one.
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-2 border-t-2 border-paper/15 px-3 py-2">
        <button
          type="button"
          onClick={() => radio.prev()}
          className="border-2 border-paper/30 px-2 py-1 text-xs font-bold uppercase tracking-wider hover:bg-white/10"
        >
          ⏮ Prev
        </button>
        <button
          type="button"
          onClick={() => radio.toggle()}
          className="border-2 border-paper/30 px-3 py-1 text-xs font-bold uppercase tracking-wider hover:bg-white/10"
        >
          {radio.playing ? "Pause" : "Play"}
        </button>
        <button
          type="button"
          onClick={() => radio.next()}
          className="border-2 border-paper/30 px-2 py-1 text-xs font-bold uppercase tracking-wider hover:bg-white/10"
        >
          Next ⏭
        </button>
      </div>
    </div>
  );
}
