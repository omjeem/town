// Scripted camera control for cinematic overlays (currently: the
// Flyover intro). The default overworld scene installs a per-frame
// camera follow on the player; that follow checks `isCinematicLocked()`
// and bails when a cinematic is running so the cinematic owns
// `setCamPos` for the duration.
//
// World bounds are registered by `overworld-plot.ts` on scene boot so
// the cinematic can map "top-left → right-middle" to actual world
// coordinates without re-deriving them from the plot.

import { getKaplayContext } from "./boot";
import { VIEW_H, VIEW_W } from "./config";

interface WorldBounds {
  worldPxW: number;
  worldPxH: number;
}

let bounds: WorldBounds | null = null;
let locked = false;

export function registerWorldBounds(b: WorldBounds): void {
  bounds = b;
}

export function isCinematicLocked(): boolean {
  return locked;
}

export interface FlyoverProgress {
  /** 0..1 — how far through the scripted animation we are. */
  t: number;
}

export interface RunFlyoverOptions {
  durationMs: number;
  onProgress?: (p: FlyoverProgress) => void;
}

// Drive the camera from the left-top anchor to right-middle over
// `durationMs`. We snap the camera + scale to the start anchor on the
// very first frame — no approach phase. Pairing that snap with the
// letterbox bars appearing at the same moment hides any "cut" feel:
// the screen reframes once and the sweep is the only motion the
// viewer sees.
export function runFlyover(opts: RunFlyoverOptions): Promise<void> {
  const ctx = getKaplayContext();
  if (!ctx || !bounds) return Promise.resolve();
  const k = ctx;

  const halfW = VIEW_W / 2;
  const halfH = VIEW_H / 2;
  const { worldPxW, worldPxH } = bounds;

  // Anchor points. Pulled in slightly from the edges so the world fills
  // the frame on the wider cinematic scale instead of revealing the
  // background letterbox at the corners.
  const start = {
    x: Math.max(halfW, Math.min(worldPxW - halfW, halfW * 1.05)),
    y: Math.max(halfH, Math.min(worldPxH - halfH, halfH * 1.05)),
  };
  const end = {
    x: Math.max(halfW, Math.min(worldPxW - halfW, worldPxW - halfW * 1.05)),
    y: Math.max(halfH, Math.min(worldPxH - halfH, worldPxH / 2)),
  };

  const cinematicScale = 0.65;
  // The player-follow loop runs at 1:1 and re-pins scale=1 every
  // frame as a safety, so we restore to a known good 1.0 instead of
  // capturing getCamScale() here. Capturing was dangerous: if a
  // previous run ended mid-restore (rare timing), the next run would
  // capture the wrong "initial" and "restore" to that same wrong
  // value, locking the camera at the cinematic scale.
  const REST_SCALE = 1;

  locked = true;

  return new Promise<void>((resolve) => {
    const t0 = performance.now();
    // Pin the wider cinematic scale + start position immediately so
    // there's no visible movement on frame 0 before the sweep starts.
    k.setCamScale(cinematicScale);
    k.setCamPos(Math.round(start.x), Math.round(start.y));

    function tick() {
      const now = performance.now();
      const raw = Math.min(1, (now - t0) / opts.durationMs);
      const t = smootherstep(raw);

      const cx = start.x + (end.x - start.x) * t;
      const cy = start.y + (end.y - start.y) * t;

      k.setCamPos(Math.round(cx), Math.round(cy));

      opts.onProgress?.({ t: raw });

      if (raw >= 1) {
        locked = false;
        k.setCamScale(REST_SCALE);
        resolve();
        return;
      }
      if (!locked) {
        k.setCamScale(REST_SCALE);
        resolve();
        return;
      }
      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  });
}

// 6t^5 - 15t^4 + 10t^3 — Perlin's smootherstep. Zero velocity AND zero
// acceleration at both endpoints, so the camera glides in and out
// without the subtle "tug" smoothstep leaves at t=0 and t=1.
function smootherstep(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

// Abort an in-progress flyover. The next requestAnimationFrame tick in
// runFlyover() sees `locked === false` and resolves early.
export function cancelFlyover(): void {
  locked = false;
}
