import type { KAPLAYCtx, GameObj } from "kaplay";
import { TILE, MOVE_TIME, type Facing } from "../config";
import { ui } from "../../ui/store";

export type Tile = { tx: number; ty: number };

// The player is a parent transform anchored at its current tile's top-left.
// The sprite is taller than the tile (head extends above), so we draw it
// shifted up by (spriteH - TILE) px to plant the feet on the tile bottom.
export type Player = GameObj & {
  tile: Tile;
  facing: Facing;
};

// Postman crop height — the cropped frame is 16w x 25h, with the head
// occupying the top 9px above the tile floor.
const PLAYER_SPRITE_H = 25;

const DIRS: Record<string, { dx: number; dy: number; facing: Facing }> = {
  left:  { dx: -1, dy: 0,  facing: "left" },
  right: { dx: 1,  dy: 0,  facing: "right" },
  up:    { dx: 0,  dy: -1, facing: "up" },
  down:  { dx: 0,  dy: 1,  facing: "down" },
};

export function makePlayer(
  k: KAPLAYCtx,
  startTile: Tile,
  isBlocked: (tx: number, ty: number) => boolean,
  onArrive?: (tile: Tile) => void,
): Player {
  // The parent's pos is the tile's top-left in world pixels. Player z is
  // chosen so they render above ground and below building roofs but above
  // building bases (handled per-building in the scene).
  const parent = k.add([
    k.pos(startTile.tx * TILE, startTile.ty * TILE),
    k.z(50),
  ]) as unknown as Player;

  parent.tile = { ...startTile };
  parent.facing = "down";

  // Sprite child — offset up so feet sit on the tile bottom. We hold a
  // reference so the idle + walk animations can nudge its local position.
  const spriteBaselineY = TILE - PLAYER_SPRITE_H;
  const sprite = parent.add([
    k.sprite("player"),
    k.pos(0, spriteBaselineY),
    k.z(50),
  ]);

  let moving = false;

  // Step counter — flips sign on every move so successive footsteps
  // alternate the sway direction (left foot vs right foot lean).
  let stepParity = 1;

  // Idle "breath" — visible vertical sine bob + a subtle horizontal sway
  // so the character reads as breathing, not frozen pixel art.
  k.onUpdate(() => {
    if (moving) return;
    const t = k.time();
    sprite.pos.y = spriteBaselineY + Math.sin(t * 3.2) * 1.2;
    sprite.pos.x = Math.sin(t * 1.6) * 0.4;
  });

  const tryMove = (dirKey: keyof typeof DIRS) => {
    if (moving) return;
    // Freeze the world while any React modal is open so input destined for
    // the form/panel doesn't also walk the player.
    if (ui.isPaused()) return;
    const { dx, dy, facing } = DIRS[dirKey];
    parent.facing = facing;

    const nx = parent.tile.tx + dx;
    const ny = parent.tile.ty + dy;
    if (isBlocked(nx, ny)) return;

    moving = true;
    const fromX = parent.pos.x;
    const fromY = parent.pos.y;
    const toX = nx * TILE;
    const toY = ny * TILE;

    // Flip the step parity so this footstep leans opposite the last one.
    const parity = stepParity;
    stepParity = -stepParity;

    k.tween(
      0, 1, MOVE_TIME,
      (t) => {
        parent.pos = k.vec2(fromX + (toX - fromX) * t, fromY + (toY - fromY) * t);
        // Step bounce — two sine arcs per tile (left foot + right foot)
        // peaking ~3px above baseline. `|sin(t · 2π)|` traces zero →
        // peak → zero → peak → zero across the tile, giving the
        // double-thump cadence of a walk.
        const bounce = Math.abs(Math.sin(t * 2 * Math.PI)) * 3;
        sprite.pos.y = spriteBaselineY - bounce;
        // Horizontal sway perpendicular to the step direction, scaled by
        // the matching footstep arc so it grows and shrinks with the
        // bounce. parity flips per step so the sway alternates sides.
        const sway = Math.sin(t * Math.PI) * 1.2 * parity;
        const horiz = dy !== 0 ? sway : 0; // only sway sideways on N/S moves
        sprite.pos.x = horiz;
      },
      k.easings.linear,
    ).onEnd(() => {
      parent.tile = { tx: nx, ty: ny };
      moving = false;
      // Land back on the baseline so the idle-bob picks up cleanly from 0.
      sprite.pos.y = spriteBaselineY;
      sprite.pos.x = 0;
      onArrive?.(parent.tile);
    });
  };

  k.onKeyPress("left",  () => tryMove("left"));
  k.onKeyPress("right", () => tryMove("right"));
  k.onKeyPress("up",    () => tryMove("up"));
  k.onKeyPress("down",  () => tryMove("down"));

  k.onKeyDown("left",  () => tryMove("left"));
  k.onKeyDown("right", () => tryMove("right"));
  k.onKeyDown("up",    () => tryMove("up"));
  k.onKeyDown("down",  () => tryMove("down"));

  return parent;
}
