// World → DOM CSS pixel projection.
//
// We delegate the world→internal-viewport step to kaplay's own `toScreen`
// so the camera transform always matches what's drawn on the canvas.
// Then we map internal-viewport (VIEW_W × VIEW_H) → DOM CSS pixels,
// accounting for the letterbox bars added by `stretch: true, letterbox: true`.

import { VIEW_W, VIEW_H } from "./config";
import { getKaplayContext } from "./boot";

export type ScreenPos = { x: number; y: number; visible: boolean };

const INTERNAL_ASPECT = VIEW_W / VIEW_H;

/** Project a world pixel position (e.g. a kaplay GameObj's `pos`) onto
 *  the canvas DOM, in CSS px relative to the canvas element. */
export function projectWorldPixelToScreen(
  canvas: HTMLCanvasElement,
  worldX: number,
  worldY: number,
): ScreenPos {
  const k = getKaplayContext();
  if (!k) return { x: 0, y: 0, visible: false };

  const internal = k.toScreen(k.vec2(worldX, worldY));

  const rect = canvas.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) {
    return { x: 0, y: 0, visible: false };
  }

  // Match kaplay's stretch+letterbox: fit the internal viewport into the
  // canvas DOM while preserving aspect ratio.
  const domAspect = rect.width / rect.height;
  let renderedW: number;
  let renderedH: number;
  if (domAspect > INTERNAL_ASPECT) {
    renderedH = rect.height;
    renderedW = renderedH * INTERNAL_ASPECT;
  } else {
    renderedW = rect.width;
    renderedH = renderedW / INTERNAL_ASPECT;
  }
  const scale = renderedW / VIEW_W;
  const offsetX = (rect.width - renderedW) / 2;
  const offsetY = (rect.height - renderedH) / 2;

  const x = offsetX + internal.x * scale;
  const y = offsetY + internal.y * scale;
  const margin = 64;
  const visible =
    x > -margin &&
    x < rect.width + margin &&
    y > -margin &&
    y < rect.height + margin;
  return { x, y, visible };
}
