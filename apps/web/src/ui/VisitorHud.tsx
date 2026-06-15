"use client";

import { PALETTE } from "../game/config";

// HUD shown to a non-owner viewing /{slug}. Same neobrutalism vocabulary
// as the owner Hud, with "Visiting" stamped above the town name and a
// small "Exit" link that drops back to /.
export function VisitorHud({
  townName,
  visitorName,
  townSlug,
}: {
  townName: string;
  visitorName: string;
  townSlug: string;
}) {
  const letter = (visitorName[0] ?? "?").toUpperCase();
  return (
    <div className="flex items-center gap-3">
      <div className="nb-card flex items-center gap-3 px-3 py-2">
        <div
          className="nb-tile flex h-9 w-9 items-center justify-center text-base font-black"
          style={{ background: PALETTE.h60 }}
        >
          {letter}
        </div>
        <div className="flex flex-col">
          <div className="text-[10px] font-bold uppercase leading-tight tracking-wide text-[#1a1d22] opacity-60">
            Visiting
          </div>
          <div className="text-sm font-bold leading-tight text-[#1a1d22]">
            {townName}
          </div>
        </div>
      </div>
      <a
        href="/"
        className="nb-card px-3 py-2 text-xs font-bold uppercase tracking-wide text-[#1a1d22]"
        title={`Leave ${townSlug}`}
      >
        Exit
      </a>
    </div>
  );
}
