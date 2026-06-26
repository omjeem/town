"use client";

// Floating "Build your own town" pill that sits just above the
// BottomBar's left edge. Rendered for visitors only — the call to
// action is meaningless if you're already standing in your own town.

import { HudButton } from "./HudButton";

export function BuildTownCta() {
  return (
    <HudButton
      href="https://town.getcore.me"
      target="_blank"
      rel="noopener noreferrer"
      title="Start your own town at town.getcore.me"
      icon={
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/town_logo_light.svg"
          alt=""
          aria-hidden
          className="h-3 w-3"
        />
      }
    >
      Build your own town
    </HudButton>
  );
}
