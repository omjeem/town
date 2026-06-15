// Character (sprite key) pool used as in-world avatars.
//
//   • Owner default: "player" — the postman sprite.
//   • Visitors: random from VISITOR_CHARACTER_POOL so they're visibly
//     distinct from the owner.
//
// All sprite keys here MUST be registered with kaplay in game/boot.ts.

export const OWNER_DEFAULT_CHARACTER = "player";

export const VISITOR_CHARACTER_POOL = [
  "home_npc",
  "office_npc",
  "library_npc",
  "store_shopkeeper",
] as const;

export type CharacterKey = string;

const ALL = new Set<string>([OWNER_DEFAULT_CHARACTER, ...VISITOR_CHARACTER_POOL]);

export function isValidCharacter(key: string): boolean {
  return ALL.has(key);
}

// Deterministic-from-seed pick when one is provided (so a signed-in
// visitor always shows up wearing the same avatar across reloads). Pure
// random when no seed (guest-first visit).
export function pickVisitorCharacter(seed?: string): CharacterKey {
  const pool = VISITOR_CHARACTER_POOL;
  if (!seed) return pool[Math.floor(Math.random() * pool.length)]!;
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) | 0;
  }
  return pool[Math.abs(h) % pool.length]!;
}
