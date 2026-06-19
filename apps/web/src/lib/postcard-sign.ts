// Town-sign overlay shared between the client-side capture (kaplay
// frame → browser Canvas2D) and the server-side renderer (node canvas
// via @napi-rs/canvas).
//
// Both Canvas2D APIs share the surface we use here (font, fillStyle,
// strokeStyle, lineWidth, textAlign, textBaseline, fillRect,
// strokeRect, fillText, measureText), so the function takes a small
// structural type instead of pulling DOM lib types into the server
// build.

export const SIGN_MARGIN_PX = 10;

// The browser's CanvasRenderingContext2D and @napi-rs/canvas's
// SKRSContext2D both implement the Canvas 2D subset we use here, but
// their TypeScript declarations diverge on a few property types
// (different CanvasGradient classes, etc.). We take `unknown` at the
// boundary and assert a minimal local interface inside the function
// so we still get type checks on the body without forcing callers to
// cast.
type Ctx2DLike = {
  font: string;
  fillStyle: string;
  strokeStyle: string;
  lineWidth: number;
  lineJoin: CanvasLineJoin;
  textAlign: CanvasTextAlign;
  textBaseline: CanvasTextBaseline;
  fillRect(x: number, y: number, w: number, h: number): void;
  strokeRect(x: number, y: number, w: number, h: number): void;
  measureText(text: string): { width: number };
  fillText(text: string, x: number, y: number): void;
  beginPath(): void;
  closePath(): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  fill(): void;
  stroke(): void;
};

/** Stamp the bottom-right town sign onto the postcard. Wooden stakes,
 *  paper panel, thick black border, hard-offset drop shadow — same
 *  neobrutalism language as the in-game UI cards. */
export function drawTownSign(
  rawCtx: unknown,
  canvasW: number,
  canvasH: number,
  townName: string,
  ownerName: string,
): void {
  const ctx = rawCtx as Ctx2DLike;
  const title = ownerName.trim() ? `${townName}  ·  ${ownerName}` : townName;
  // Sign points left (its tip is on the left side), so the inline
  // arrow points left too — towards the town in the picture.
  const distance = "←  2 miles";

  const titleFontPx = Math.max(14, Math.round(canvasH * 0.038));
  const subFontPx = Math.max(11, Math.round(canvasH * 0.028));
  const padX = Math.round(titleFontPx * 0.9);
  const padY = Math.round(titleFontPx * 0.55);
  const lineGap = Math.round(padY * 0.4);

  const titleFont = `900 ${titleFontPx}px ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
  const subFont = `700 ${subFontPx}px ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;

  ctx.font = titleFont;
  const titleW = ctx.measureText(title).width;
  ctx.font = subFont;
  const subW = ctx.measureText(distance).width;
  const contentW = Math.max(titleW, subW);

  // Rectangle body that holds the text, plus a chevron on the left
  // that turns the sign into a road-direction marker pointing towards
  // the village.
  const bodyW = Math.round(contentW + padX * 2);
  const signH = Math.round(titleFontPx + subFontPx + padY * 2 + lineGap);
  const pointDepth = Math.round(signH * 0.45);
  const totalW = bodyW + pointDepth;

  const postW = Math.max(3, Math.round(bodyW * 0.04));
  const postH = Math.round(signH * 0.38);
  const totalH = signH + postH;

  const signX = canvasW - totalW - SIGN_MARGIN_PX; // leftmost point (tip)
  const signY = canvasH - totalH - SIGN_MARGIN_PX;
  const bodyX = signX + pointDepth; // left edge of the rectangle body
  const shadowOffset = Math.max(2, Math.round(signH * 0.07));

  // Stakes — under the rectangle body, not the chevron.
  const bodyCenterX = bodyX + bodyW / 2;
  const postGap = Math.round(bodyW * 0.32);
  const postLeftX = Math.round(bodyCenterX - postGap / 2 - postW / 2);
  const postRightX = Math.round(bodyCenterX + postGap / 2 - postW / 2);
  const postY = signY + signH;

  ctx.fillStyle = "#0e1116";
  ctx.fillRect(postLeftX + shadowOffset, postY + shadowOffset, postW, postH);
  ctx.fillRect(postRightX + shadowOffset, postY + shadowOffset, postW, postH);
  ctx.fillStyle = "#7a5638";
  ctx.fillRect(postLeftX, postY, postW, postH);
  ctx.fillRect(postRightX, postY, postW, postH);
  ctx.strokeStyle = "#1a1d22";
  ctx.lineWidth = Math.max(1, Math.round(signH * 0.03));
  ctx.strokeRect(postLeftX, postY, postW, postH);
  ctx.strokeRect(postRightX, postY, postW, postH);

  // Direction-sign polygon: chevron tip on the left, rectangle body on
  // the right. Drawn as a Path2D so the shadow / fill / stroke share
  // the same shape.
  const borderW = Math.max(2, Math.round(signH * 0.05));
  ctx.lineJoin = "miter";
  const drawSignPath = (dx: number, dy: number) => {
    ctx.beginPath();
    ctx.moveTo(signX + dx, signY + signH / 2 + dy);
    ctx.lineTo(signX + pointDepth + dx, signY + dy);
    ctx.lineTo(signX + totalW + dx, signY + dy);
    ctx.lineTo(signX + totalW + dx, signY + signH + dy);
    ctx.lineTo(signX + pointDepth + dx, signY + signH + dy);
    ctx.closePath();
  };

  // Hard-offset drop shadow (no blur) to match the in-game cards.
  drawSignPath(shadowOffset, shadowOffset);
  ctx.fillStyle = "#0e1116";
  ctx.fill();

  // Paper fill + black border.
  drawSignPath(0, 0);
  ctx.fillStyle = "#f6f3ea";
  ctx.fill();
  ctx.strokeStyle = "#1a1d22";
  ctx.lineWidth = borderW;
  ctx.stroke();

  // Text — centered within the rectangle body (not the chevron).
  ctx.fillStyle = "#1a1d22";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.font = titleFont;
  ctx.fillText(title, bodyCenterX, signY + padY);
  ctx.font = subFont;
  ctx.fillText(
    distance,
    bodyCenterX,
    signY + padY + titleFontPx + lineGap,
  );
}

/** Stamp a "Population: N" pill in the top-right corner. Mirrors the
 *  in-game PopulationBadge so the postcard reads the same as the live
 *  HUD. Population is the static-snapshot residents of the town: the
 *  owner + every authored NPC. Visitors aren't counted (they come and
 *  go; the postcard is a fixed artifact). Same neobrutalism vocabulary
 *  as drawCoreBadge — paper fill, black border, drop shadow. */
export function drawPopulationBadge(
  rawCtx: unknown,
  canvasW: number,
  canvasH: number,
  population: number,
): void {
  const ctx = rawCtx as Ctx2DLike;

  const text = `Population: ${population}`;
  const fontPx = Math.max(11, Math.round(canvasH * 0.024));
  const padX = Math.round(fontPx * 0.9);
  const padY = Math.round(fontPx * 0.5);

  const font = `800 ${fontPx}px ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
  ctx.font = font;
  const textW = ctx.measureText(text).width;

  const w = Math.round(textW + padX * 2);
  const h = Math.round(fontPx + padY * 2);
  const x = canvasW - w - SIGN_MARGIN_PX;
  const y = SIGN_MARGIN_PX;
  const shadowOffset = Math.max(2, Math.round(h * 0.12));

  ctx.fillStyle = "#0e1116";
  ctx.fillRect(x + shadowOffset, y + shadowOffset, w, h);

  ctx.fillStyle = "#f6f3ea";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "#1a1d22";
  ctx.lineWidth = Math.max(2, Math.round(h * 0.08));
  ctx.strokeRect(x, y, w, h);

  ctx.fillStyle = "#1a1d22";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = font;
  ctx.fillText(text, x + w / 2, y + h / 2);
}

/** Stamp a small "town · getcore.me" attribution pill in the top-left
 *  corner. Same neobrutalism vocabulary as drawTownSign — paper fill,
 *  black border, hard-offset drop shadow — but a fraction of the size
 *  so it reads as a watermark, not a label. */
export function drawCoreBadge(
  rawCtx: unknown,
  canvasH: number,
): void {
  const ctx = rawCtx as Ctx2DLike;

  const text = "town · getcore.me";
  const fontPx = Math.max(11, Math.round(canvasH * 0.024));
  const padX = Math.round(fontPx * 0.9);
  const padY = Math.round(fontPx * 0.5);

  const font = `800 ${fontPx}px ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
  ctx.font = font;
  const textW = ctx.measureText(text).width;

  const w = Math.round(textW + padX * 2);
  const h = Math.round(fontPx + padY * 2);
  const x = SIGN_MARGIN_PX;
  const y = SIGN_MARGIN_PX;
  const shadowOffset = Math.max(2, Math.round(h * 0.12));

  // Drop shadow.
  ctx.fillStyle = "#0e1116";
  ctx.fillRect(x + shadowOffset, y + shadowOffset, w, h);

  // Paper body + black border.
  ctx.fillStyle = "#f6f3ea";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "#1a1d22";
  ctx.lineWidth = Math.max(2, Math.round(h * 0.08));
  ctx.strokeRect(x, y, w, h);

  // Text.
  ctx.fillStyle = "#1a1d22";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = font;
  ctx.fillText(text, x + w / 2, y + h / 2);
}
