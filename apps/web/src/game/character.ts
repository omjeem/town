// Sprite key to use when spawning the player. Set by TownGame on mount
// (owner / visitor), read by the scenes when they call makePlayer. Kept
// as a module-global because the boot/scene code isn't a React tree.
import { OWNER_DEFAULT_CHARACTER } from "../lib/characters";

let key: string = OWNER_DEFAULT_CHARACTER;

export function setPlayerCharacter(k: string): void {
  key = k;
}

export function getPlayerCharacter(): string {
  return key;
}
