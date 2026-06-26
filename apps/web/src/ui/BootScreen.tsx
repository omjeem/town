"use client";

import { useEffect, useState } from "react";

// Fullscreen CORE OS-style boot screen + plot-loading hold. Pixel-font
// title, "booting…" subtitle, progress bar sweeping to 100% over ~1.4s,
// then "loading town…" if the kaplay scene hasn't told us
// (`worldReady`) that the plot is drawn yet. Single overlay covers the
// whole startup so there's no flash between the boot bar and an
// in-canvas loading state.

// Loading messages cycled during the boot bar sweep. Order suggests
// the rough buildup of the town: terrain → buildings → inhabitants →
// agents → meeting. The cycle keeps moving until both the sweep
// finishes and `ready` is true; the final "stepping onto Main St…"
// hold reads as "almost there" rather than freezing on the last item.
const BOOT_MESSAGES = [
  "booting…",
  "seeding the grass…",
  "drawing the roads…",
  "raising the buildings…",
  "waking the agents…",
  "settling the neighbours…",
  "opening the gates…",
  "stepping onto Main St…",
] as const;

const MESSAGE_INTERVAL_MS = 260;

export function BootScreen({
  ready,
  onDone,
}: {
  /** Flips true once the kaplay scene has fetched the plot + drawn
   *  it. BootScreen holds on screen until BOTH the sweep finishes
   *  AND this is true. */
  ready: boolean;
  onDone: () => void;
}) {
  const [progress, setProgress] = useState(0);
  const [swept, setSwept] = useState(false);
  const [messageIdx, setMessageIdx] = useState(0);

  // Sweep animation runs once on mount.
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
        setSwept(true);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, []);

  // Cycle the loading message every MESSAGE_INTERVAL_MS while the
  // overlay is up. Clamps to the last message once it lands so the
  // text "settles" instead of looping past it.
  useEffect(() => {
    const id = window.setInterval(() => {
      setMessageIdx((i) => Math.min(i + 1, BOOT_MESSAGES.length - 1));
    }, MESSAGE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);

  // Dismiss once the sweep AND ready signal have both landed. Tiny
  // breath at 100% before fading out so the user sees the bar
  // complete instead of snapping away mid-animation.
  useEffect(() => {
    if (!swept || !ready) return;
    const t = window.setTimeout(onDone, 220);
    return () => window.clearTimeout(t);
  }, [swept, ready, onDone]);

  const subtitle = BOOT_MESSAGES[messageIdx] ?? BOOT_MESSAGES[0];

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#1a1a1a] font-mono text-[#e8e4d8]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/town_logo_light.svg"
        alt="town"
        className="mb-3 h-24 w-24"
        draggable={false}
      />
      <div
        className="mb-6 text-[20px] font-semibold tracking-tight text-[#e8e4d8]"
        style={{ fontFamily: "var(--font-press-start-2p)" }}
      >
        town
      </div>
      {/* Fixed height keeps the progress bar from jumping as the
          message text gets longer / shorter on each cycle. */}
      <div className="mb-8 flex h-4 items-center text-[12px] opacity-70">
        {subtitle}
      </div>
      <div className="h-3 w-[280px] border border-white/40 bg-black/40">
        <div
          className="h-full bg-[#0381e9] transition-[width] duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
