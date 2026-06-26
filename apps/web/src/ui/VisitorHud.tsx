"use client";

import { getPlayerCharacter } from "../game/character";
import { CharacterAvatar } from "./CharacterAvatar";
import { HudButton } from "./HudButton";

// HUD shown to a non-owner viewing /{slug}. One pill for the visitor
// identity (avatar + name + town being visited) and a sibling Exit
// pill that drops back to /. Same dark vocabulary as the owner Hud.
export function VisitorHud({
  townName,
  visitorName,
  townSlug,
}: {
  townName: string;
  visitorName: string;
  townSlug: string;
}) {
  const character = getPlayerCharacter();
  return (
    <>
      <HudButton
        icon={<CharacterAvatar character={character} seed={visitorName} size={20} />}
        title={`Visiting ${townName}`}
      >
        Visiting {townName}
      </HudButton>
      <HudButton href="/" title={`Leave ${townSlug}`}>
        Exit
      </HudButton>
    </>
  );
}
