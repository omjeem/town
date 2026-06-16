// Server-side postcard renderer.
//
// Mirrors the kaplay overworld draw order (ground → ponds → paths →
// decor → buildings) on a node canvas, then applies the same
// fit-width zoom + bottom trim + town-sign overlay that the in-browser
// Share modal uses. Output is a PNG buffer ready to be streamed back
// from a Route Handler.
//
// Why duplicate the draw logic instead of driving a headless browser:
// the deploy target can't reasonably pull in chromium, and we don't
// want a 1–3 s cold start per share. The duplication is bounded — the
// autotile + grass colour + town-sign overlay all share modules with
// the in-game scene + capture path:
//
//   GRASS_HEX + autotile9Slice  ←  apps/web/src/lib/plot-render.ts
//   drawTownSign + trim/margin  ←  apps/web/src/lib/postcard-sign.ts
//   loadManifest                ←  apps/web/src/lib/manifest.ts
//
// What this file owns is the order of layers, the camera projection,
// and the sprite-path conventions — currently:
//
//   ✓ ground (solid green)
//   ✓ ponds (autotiled, 9-slice)
//   ✓ paths (autotiled, 9-slice)
//   ✓ decor (sprite-at-tile)
//   ✓ buildings (bottom-center anchored)
//   ✗ building plaques (the small in-front-of-the-door signs) — skipped
//   ✗ player + remote players — postcard is static, no characters

import {
  createCanvas,
  loadImage,
  type Image,
} from "@napi-rs/canvas";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { GRASS_HEX, autotile9Slice } from "./plot-render";
import {
  SCREENSHOT_BOTTOM_TRIM_PX,
  drawCoreBadge,
  drawTownSign,
} from "./postcard-sign";
import type { Manifest, Plot } from "@town/plot";

// Output sizing — tuned so the post-trim crop lands at 1200×628, which
// hits Twitter's `summary_large_image` spec (1200×628, 1.91:1) and
// OpenGraph's recommended image size (1200×630). One image works for
// X, LinkedIn, WhatsApp, Facebook previews without per-platform
// resizing.
const VIEW_W = 1200;
const VIEW_H = 628 + SCREENSHOT_BOTTOM_TRIM_PX; // 668 — trim chops the
//                                                  fringe back to 628

// Public sprites directory. Resolved off process.cwd() so it works
// whether Next runs from apps/web or the monorepo root.
let cachedSpritesDir: string | null = null;
function publicSpritesDir(): string {
  if (cachedSpritesDir) return cachedSpritesDir;
  const candidates = [
    path.resolve(process.cwd(), "apps", "web", "public", "sprites"),
    path.resolve(process.cwd(), "public", "sprites"),
  ];
  for (const c of candidates) {
    if (existsSync(c)) {
      cachedSpritesDir = c;
      return c;
    }
  }
  // Default — let the readFile call surface a useful error later.
  cachedSpritesDir = candidates[0]!;
  return cachedSpritesDir;
}

// Sprite cache shared across requests so we don't re-decode the same
// PNG on every export.
const spriteCache = new Map<string, Image>();

async function loadSprite(rel: string): Promise<Image> {
  const cached = spriteCache.get(rel);
  if (cached) return cached;
  const buf = await readFile(path.join(publicSpritesDir(), rel));
  const img = await loadImage(buf);
  spriteCache.set(rel, img);
  return img;
}

export async function renderTownPostcard(opts: {
  plot: Plot;
  manifest: Manifest;
  townName: string;
  ownerName: string;
}): Promise<Buffer> {
  const { plot, manifest, townName, ownerName } = opts;

  const tileSize = plot.world.tileSize;
  const worldPxW = plot.world.w * tileSize;
  const worldPxH = plot.world.h * tileSize;

  // 1. Paint the full world into an offscreen canvas at native pixel
  //    density. We'll scale it into the 16:9 view canvas after.
  const world = createCanvas(worldPxW, worldPxH);
  const wctx = world.getContext("2d");
  wctx.imageSmoothingEnabled = false;

  // Ground — solid green to match the scene's `drawGround`.
  wctx.fillStyle = GRASS_HEX;
  wctx.fillRect(0, 0, worldPxW, worldPxH);

  // Ponds — autotile from the 9-slice pond_* sprites.
  const pondSet = new Set<string>();
  for (const p of plot.ponds) {
    for (let dy = 0; dy < p.h; dy++) {
      for (let dx = 0; dx < p.w; dx++) {
        pondSet.add(p.tx + dx + "," + (p.ty + dy));
      }
    }
  }
  for (const key of pondSet) {
    const [xs, ys] = key.split(",");
    const x = parseInt(xs!, 10);
    const y = parseInt(ys!, 10);
    const name = autotile9Slice(pondSet, x, y, "pond");
    try {
      const img = await loadSprite(`${name}.png`);
      wctx.drawImage(img, x * tileSize, y * tileSize);
    } catch {
      // sprite missing — leave the cell green
    }
  }

  // Paths — same 9-slice autotile flow.
  const pathSet = new Set<string>();
  for (const p of plot.paths) {
    for (const [x, y] of p.tiles) pathSet.add(x + "," + y);
  }
  for (const key of pathSet) {
    const [xs, ys] = key.split(",");
    const x = parseInt(xs!, 10);
    const y = parseInt(ys!, 10);
    const name = autotile9Slice(pathSet, x, y, "path");
    try {
      const img = await loadSprite(`${name}.png`);
      wctx.drawImage(img, x * tileSize, y * tileSize);
    } catch {
      // missing path edge — skip
    }
  }

  // Decor — scatter sprites resolved through the extras manifest.
  // The scene draws trees at a higher z than bushes/flowers; on a
  // single 2D canvas all we need is to paint trees last so they sit on
  // top of the smaller decor and the building footprints.
  const decorOrdered = [...plot.decor].sort((a, b) => {
    const at = a.group === "trees" ? 1 : 0;
    const bt = b.group === "trees" ? 1 : 0;
    return at - bt;
  });
  const manifestByGroup = manifest as unknown as Record<
    string,
    { id: string; file: string }[]
  >;
  for (const d of decorOrdered) {
    const groupEntries = manifestByGroup[d.group];
    if (!groupEntries) continue;
    const entry = groupEntries.find((e) => e.id === d.spriteId);
    if (!entry) continue;
    try {
      const img = await loadSprite("extras/" + entry.file);
      wctx.drawImage(img, d.tx * tileSize, d.ty * tileSize);
    } catch {
      // missing decor sprite — skip
    }
  }

  // Buildings — bottom-center anchored on the south edge of the
  // footprint, same anchor the scene uses.
  for (const b of plot.buildings) {
    try {
      const img = await loadSprite("catalog/" + b.exteriorSprite);
      const xPx = Math.round((b.tx + b.w / 2) * tileSize - img.width / 2);
      const yPx = Math.round((b.ty + b.h) * tileSize - img.height);
      wctx.drawImage(img, xPx, yPx);
    } catch {
      // missing building sprite — skip
    }
  }

  // 2. Project the world into the 16:9 postcard. Fit-width scale, then
  //    centered vertically (so the framing matches the client capture
  //    which puts the camera at world center).
  const scale = VIEW_W / worldPxW;
  const dstW = Math.round(worldPxW * scale);
  const dstH = Math.round(worldPxH * scale);
  const dstX = Math.round((VIEW_W - dstW) / 2);
  const dstY = Math.round((VIEW_H - dstH) / 2);

  const view = createCanvas(VIEW_W, VIEW_H);
  const vctx = view.getContext("2d");
  vctx.imageSmoothingEnabled = false;
  // Same canvas bg as kaplay so any letterbox area reads the same.
  vctx.fillStyle = "#c5d0dc";
  vctx.fillRect(0, 0, VIEW_W, VIEW_H);
  vctx.drawImage(world, dstX, dstY, dstW, dstH);

  // 3. Crop the bg strips around the world (at fit-width they're 0 on
  //    the sides; vertical bg may exist if the world is shorter than
  //    the view) and trim the bottom forest.
  const cropLeft = Math.max(0, dstX);
  const cropRight = Math.min(VIEW_W, dstX + dstW);
  const cropTop = Math.max(0, dstY);
  const cropBottomMax = Math.min(VIEW_H, dstY + dstH);
  const cropBottom = Math.max(
    cropTop + 1,
    cropBottomMax - SCREENSHOT_BOTTOM_TRIM_PX,
  );
  const cropW = cropRight - cropLeft;
  const cropH = cropBottom - cropTop;

  const out = createCanvas(cropW, cropH);
  const octx = out.getContext("2d");
  octx.imageSmoothingEnabled = false;
  octx.drawImage(view, cropLeft, cropTop, cropW, cropH, 0, 0, cropW, cropH);

  // 4. Stamp the town sign — shared with the client capture path so
  //    both surfaces produce the same overlay.
  drawTownSign(octx, cropW, cropH, townName, ownerName);

  // 5. Top-left "town · getcore.me" badge so every shared postcard
  //    carries the CORE attribution.
  drawCoreBadge(octx, cropH);

  return out.toBuffer("image/png");
}
