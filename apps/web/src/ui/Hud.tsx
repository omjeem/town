"use client";

import { useEffect, useRef, useState } from "react";

import { getPlayerCharacter } from "../game/character";
import { logout } from "../game/auth";
import { CharacterAvatar } from "./CharacterAvatar";
import { HudButton } from "./HudButton";
import { ui } from "./store";
import type { HudKind } from "./store";

// Identity pill (overworld) or room name card (interior).
// Click the identity pill to open a small dropdown with Share / Logout.
export function Hud({ hud }: { hud: HudKind }) {
  if (hud.kind === "overworld") {
    const session = hud.session;
    const name = session?.user.name ?? "Guest";
    const character = getPlayerCharacter();

    if (!session) {
      // Guest — no menu, just the badge.
      return (
        <HudButton
          icon={
            <CharacterAvatar character={character} seed={name} size={20} />
          }
          title="Walk home → desk to sign in"
        >
          {name}
        </HudButton>
      );
    }

    return <IdentityMenu name={name} character={character} />;
  }

  // interior — title pill, accent stripe on the left.
  return (
    <HudButton
      icon={
        <span
          aria-hidden
          className="inline-block h-3 w-1.5"
          style={{ background: hud.accent }}
        />
      }
      title="Walk to door to leave"
    >
      {hud.title}
    </HudButton>
  );
}

// Click-to-open dropdown on the identity pill. Actions: Invite (URL +
// code modal), Share (screenshot + Twitter/WhatsApp/Download modal), and
// Logout. Closes on outside click + on Escape.
function IdentityMenu({
  name,
  character,
}: {
  name: string;
  character: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(e: PointerEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative inline-flex">
      <HudButton
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        title="Open menu"
        active={open}
        icon={<CharacterAvatar character={character} seed={name} size={20} />}
      >
        {name}
      </HudButton>
      {open ? (
        <div
          role="menu"
          className="nb-card-dark absolute left-0 top-full z-40 mt-1 flex min-w-[160px] flex-col p-1"
        >
          <button
            type="button"
            role="menuitem"
            className="w-full px-2.5 py-1.5 text-left text-xs font-bold uppercase tracking-wider text-paper hover:bg-white/5"
            onClick={() => {
              setOpen(false);
              ui.openInvite();
            }}
          >
            Invite…
          </button>
          <button
            type="button"
            role="menuitem"
            className="w-full px-2.5 py-1.5 text-left text-xs font-bold uppercase tracking-wider text-paper hover:bg-white/5"
            onClick={() => {
              setOpen(false);
              ui.openShareImage();
            }}
          >
            Share…
          </button>
          <button
            type="button"
            role="menuitem"
            className="w-full px-2.5 py-1.5 text-left text-xs font-bold uppercase tracking-wider text-paper hover:bg-white/5"
            onClick={() => {
              setOpen(false);
              void logout().then(() => {
                window.location.href = "/";
              });
            }}
          >
            Logout
          </button>
        </div>
      ) : null}
    </div>
  );
}
