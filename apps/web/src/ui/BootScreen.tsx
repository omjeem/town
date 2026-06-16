"use client";

import { useEffect, useState } from "react";

// Fullscreen CORE OS-style boot screen shown over the town canvas on
// first load. Lifted from core-website's BootScreen so the visual
// language stays consistent between the marketing site and the town
// app — same dark bg, pixel-font title, "PRESS ANY KEY TO BOOT"
// affordance, and a progress bar that sweeps to 100% over ~1.4s.
//
// Persists "I've already booted in this session" in sessionStorage so
// the screen doesn't gate every soft navigation — refresh shows it
// again, closing/reopening the tab shows it again.

const SESSION_KEY = "core-town:booted";

export function BootScreen({ onDone }: { onDone: () => void }) {
  const [started, setStarted] = useState(false);
  const [progress, setProgress] = useState(0);

  // Wait for the first interaction before starting — matches the
  // marketing site's behaviour and gives the user a moment to read
  // the title.
  useEffect(() => {
    if (started) return;
    const begin = () => setStarted(true);
    window.addEventListener("keydown", begin, { once: true });
    window.addEventListener("pointerdown", begin, { once: true });
    return () => {
      window.removeEventListener("keydown", begin);
      window.removeEventListener("pointerdown", begin);
    };
  }, [started]);

  // Once started, sweep the progress bar then dismiss.
  useEffect(() => {
    if (!started) return;
    let raf = 0;
    let cancelled = false;
    const start = performance.now();
    const DURATION = 1400;

    const tick = (now: number) => {
      if (cancelled) return;
      const pct = Math.min(100, ((now - start) / DURATION) * 100);
      setProgress(pct);
      if (pct < 100) {
        raf = requestAnimationFrame(tick);
      } else {
        try {
          sessionStorage.setItem(SESSION_KEY, "1");
        } catch {
          // ignore
        }
        // Brief breath so the user sees "100%" before fade.
        window.setTimeout(onDone, 220);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [started, onDone]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#1a1a1a] font-mono text-[#e8e4d8]">
      <div
        className="mb-6 text-[28px] font-semibold tracking-tight text-[#e67333]"
        style={{ fontFamily: "var(--font-press-start-2p)" }}
      >
        CORE TOWN
      </div>

      {!started ? (
        <>
          <div
            className="animate-pulse text-[11px] opacity-80"
            style={{ fontFamily: "var(--font-press-start-2p)" }}
          >
            PRESS ANY KEY TO BOOT
          </div>
          <div className="mt-3 text-[9px] opacity-40">
            ▸ click anywhere · press space · tap screen
          </div>
        </>
      ) : (
        <>
          <div className="mb-8 text-[12px] opacity-70">booting…</div>
          <div className="h-3 w-[280px] border border-white/40 bg-black/40">
            <div
              className="h-full bg-[#e67333] transition-[width] duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        </>
      )}
    </div>
  );
}

export function hasBooted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}
