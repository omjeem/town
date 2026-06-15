import type { KAPLAYCtx, GameObj } from "kaplay";
import { TILE, MOVE_TIME, type Facing } from "../config";
import { getPlayerCharacter } from "../character";
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
  // Sprite key comes from game/character.ts so visitors render as a
  // different avatar than the owner.
  const spriteBaselineY = TILE - PLAYER_SPRITE_H;
  const sprite = parent.add([
    k.sprite(getPlayerCharacter()),
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
        // Snap to integer pixels every frame so the rendered position
        // doesn't toggle between fractional floors and stutter.
        parent.pos = k.vec2(
          Math.round(fromX + (toX - fromX) * t),
          Math.round(fromY + (toY - fromY) * t),
        );
        // No per-step bob — at MOVE_TIME=120ms any vertical oscillation
        // on a horizontal slide reads as a glitch rather than a stride.
        // The parent's smooth slide alone carries the motion cue.
        sprite.pos.y = spriteBaselineY;
        sprite.pos.x = 0;
        void parity; // kept for future per-step variation
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
