"use client";

import { useEffect, useState } from "react";

// Fullscreen CORE OS-style boot screen shown over the town canvas on
// first load. Pixel-font title, "booting…" subtitle, and a progress
// bar that sweeps to 100% over ~1.4s before dismissing itself. Visual
// language matches core-website's BootScreen.
//
// Persists "I've already booted in this session" in sessionStorage so
// the screen doesn't gate every soft navigation — refresh shows it
// again, closing/reopening the tab shows it again.

const SESSION_KEY = "core-town:booted";

export function BootScreen({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);

  // Sweep progress to 100% on mount, then dismiss.
  useEffect(() => {
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
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#1a1a1a] font-mono text-[#e8e4d8]">
      <div
        className="mb-6 text-[28px] font-semibold tracking-tight text-[#0381e9]"
        style={{ fontFamily: "var(--font-press-start-2p)" }}
      >
        CORE TOWN
      </div>
      <div className="mb-8 text-[12px] opacity-70">booting…</div>
      <div className="h-3 w-[280px] border border-white/40 bg-black/40">
        <div
          className="h-full bg-[#0381e9] transition-[width] duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
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
