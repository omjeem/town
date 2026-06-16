"use client";

import { useEffect, useRef, useState } from "react";

import { PALETTE } from "../game/config";
import { logout } from "../game/auth";
import { ui } from "./store";
import type { HudKind, InboxState } from "./store";

// Identity badge (overworld) or room name card (interior).
// Click the identity card to open a small dropdown with Share / Logout.
export function Hud({ hud, inbox }: { hud: HudKind; inbox: InboxState }) {
  if (hud.kind === "overworld") {
    const session = hud.session;
    const name = session?.user.name ?? "Guest";
    const letter = (name[0] ?? "G").toUpperCase();
    const accent = PALETTE.h240;

    if (!session) {
      // Guest — no menu, just the badge.
      return (
        <div className="flex items-center gap-3">
          <div className="nb-card flex items-center gap-3 px-3 py-2">
            <div
              className="nb-tile flex h-9 w-9 items-center justify-center text-base font-black"
              style={{ background: accent }}
            >
              {letter}
            </div>
            <div className="flex flex-col">
              <div className="text-sm font-bold leading-tight text-[#1a1d22]">
                {name}
              </div>
              <div className="text-[10px] leading-tight text-[#1a1d22] opacity-60">
                home → desk to sign in
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-3">
        <IdentityMenu name={name} letter={letter} accent={accent} />
        {inbox.count > 0 ? <InboxBadge count={inbox.count} /> : null}
      </div>
    );
  }

  // interior
  return (
    <div className="nb-card flex items-center gap-3 px-3 py-2">
      <div
        className="h-9 w-2 self-stretch"
        style={{ background: hud.accent }}
      />
      <div className="flex flex-col">
        <div className="text-sm font-bold leading-tight text-[#1a1d22]">
          {hud.title}
        </div>
        <div className="text-[10px] leading-tight text-[#1a1d22] opacity-60">
          walk to door to leave
        </div>
      </div>
    </div>
  );
}

// Click-to-open dropdown on the identity card. Actions: Invite (URL +
// code modal), Share (screenshot + Twitter/WhatsApp/Download modal), and
// Logout. Closes on outside click + on Escape.
function IdentityMenu({
  name,
  letter,
  accent,
}: {
  name: string;
  letter: string;
  accent: string;
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
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="nb-card flex items-center gap-3 px-3 py-2 text-left"
        aria-expanded={open}
        aria-haspopup="menu"
        title="Open menu"
      >
        <div
          className="nb-tile flex h-9 w-9 items-center justify-center text-base font-black"
          style={{ background: accent }}
        >
          {letter}
        </div>
        <div className="flex flex-col">
          <div className="text-sm font-bold leading-tight text-[#1a1d22]">
            {name}
          </div>
          <div className="text-[10px] leading-tight text-[#1a1d22] opacity-60">
            click for menu
          </div>
        </div>
      </button>
      {open ? (
        <div
          role="menu"
          className="nb-card absolute left-0 top-full z-40 mt-2 flex min-w-[180px] flex-col p-1"
        >
          <button
            type="button"
            role="menuitem"
            className="w-full px-3 py-2 text-left text-sm font-bold text-[#1a1d22] hover:bg-black/5"
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
            className="w-full px-3 py-2 text-left text-sm font-bold text-[#1a1d22] hover:bg-black/5"
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
            className="w-full px-3 py-2 text-left text-sm font-bold text-[#1a1d22] hover:bg-black/5"
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

function InboxBadge({ count }: { count: number }) {
  const label = count === 1 ? "1 update at home" : `${count} updates at home`;
  return (
    <div
      className="nb-card flex items-center gap-2 px-3 py-2"
      style={{ background: PALETTE.h240, color: "#1a1d22" }}
      title="Walk back to home — the world runner has updates for you."
    >
      <span aria-hidden className="text-base leading-none">
        🔔
      </span>
      <span className="text-[12px] font-bold leading-tight">{label}</span>
    </div>
  );
}
