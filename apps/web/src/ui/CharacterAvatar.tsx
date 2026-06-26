"use client";

// Tiny pixel-art avatar for the activity feed + ticker. Each sprite is
// 16×25; we keep that aspect and render at 2x with crisp pixel scaling.
// Falls back to the owner's "player" sprite when the character key is
// missing (legacy rows that predate subjectCharacter capture).

import { OWNER_DEFAULT_CHARACTER } from "../lib/characters";

const CHARACTER_FILES: Record<string, string> = {
  player: "/sprites/player.png",
};

function spriteUrl(character: string | null | undefined): string {
  const key = character ?? OWNER_DEFAULT_CHARACTER;
  if (CHARACTER_FILES[key]) return CHARACTER_FILES[key]!;
  return `/sprites/characters/${encodeURIComponent(key)}.png`;
}

// Color a tile background from the participant's display name so the
// avatar reads as "this person" even when two visitors share the same
// character sprite.
const TILE_PALETTE = [
  "#f0e442", // yellow
  "#56b4e9", // sky
  "#cc79a7", // pink
  "#009e73", // green
  "#e69f00", // orange
  "#0072b2", // blue
] as const;

function tileColorFor(seed: string): string {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return TILE_PALETTE[Math.abs(h) % TILE_PALETTE.length]!;
}

export interface CharacterAvatarProps {
  character: string | null | undefined;
  /** Per-person colour seed — usually the display name. */
  seed: string;
  /** Pixel size of the square avatar tile. The 16×25 sprite is
   *  centred + scaled to fit. */
  size?: number;
}

export function CharacterAvatar({
  character,
  seed,
  size = 28,
}: CharacterAvatarProps) {
  const bg = tileColorFor(seed);
  // Sprite is 16×25 — anchor it inside a square tile by scaling the
  // height to the tile and letting the body crop tidily; this matches
  // how the in-canvas player renders at small zoom.
  const spriteHeight = size;
  const spriteWidth = Math.round((16 / 25) * spriteHeight);
  return (
    <div
      className="flex shrink-0 items-end justify-center overflow-hidden border-2 border-ink"
      style={{ width: size, height: size, background: bg }}
      aria-hidden
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={spriteUrl(character)}
        alt=""
        width={spriteWidth}
        height={spriteHeight}
        style={{
          imageRendering: "pixelated",
          width: spriteWidth,
          height: spriteHeight,
        }}
      />
    </div>
  );
}
