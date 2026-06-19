"use client";

import { useState } from "react";

import { startLogin } from "../game/auth";
import { PALETTE } from "../game/config";
import { TownGame } from "./TownGame";

const PUBLIC_TOWN_URL = "/core-town?invite_code=H4C0TZ";

// Unsigned-root landing surface. The guest playground (the regular
// <TownGame /> with no props) renders in the background. A "how this
// works" card sits on top so a brand-new visitor sees the premise
// before they wander:
//
//   • Sign up — kicks off the OAuth flow.
//   • Try the demo — dismisses the card; they get the playground.
//
// The card lives outside the UI store so it doesn't pause the world —
// kaplay keeps ambient-animating behind it.
export function Landing() {
  const [open, setOpen] = useState(true);

  return (
    <>
      <TownGame />
      {open ? <WelcomeCard onDemo={() => setOpen(false)} /> : null}
    </>
  );
}

function WelcomeCard({ onDemo }: { onDemo: () => void }) {
  return (
    <div
      className="nb-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="landing-welcome-title"
    >
      <div className="nb-modal-card nb-card flex w-full max-w-xl flex-col gap-5 p-7">
        <div className="flex items-center gap-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/town_logo_dark.svg"
            alt=""
            aria-hidden
            className="h-14 w-14 shrink-0"
            draggable={false}
          />
          <h1
            id="landing-welcome-title"
            className="text-2xl leading-none text-ink"
            style={{ fontFamily: "var(--font-press-start-2p)" }}
          >
            Town
          </h1>
        </div>

        <p className="leading-relaxed text-ink opacity-80">
          Your world, as a tiny pixel town that grows itself. The things you
          care about — fitness, films, art, the side project — turn into
          buildings, and locals show up to live in them: a gym coach here, a
          film critic there, whoever your world calls for. Give them
          personalities, plug them into your tools, then share the address.
          Friends wander, meet your locals, bump into each other — and learn who
          you are faster than any profile.
        </p>

        <div className="flex flex-col gap-2">
          <div className="text-sm font-bold uppercase tracking-wide text-ink opacity-40">
            How it works
          </div>
          <ul className="flex flex-col gap-0.5 text-md leading-relaxed text-ink opacity-80">
            <li>
              <span className="font-bold">Move</span> with the arrow keys.
            </li>
            <li>
              <span className="font-bold">Press SPACE</span> at a person to
              chat.
            </li>
            <li>
              <span className="font-bold">Sign up</span> to start your own town
              — invite friends, meet theirs.
            </li>
          </ul>
        </div>

        <div className="mt-1 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => startLogin("/")}
            className="nb-tile px-4 py-2.5 text-sm font-black uppercase tracking-wide"
            style={{ background: PALETTE.h240, cursor: "pointer" }}
          >
            Own a town / Login
          </button>
          <a
            href={PUBLIC_TOWN_URL}
            className="nb-tile px-4 py-2.5 text-center text-sm font-black uppercase tracking-wide"
            style={{ background: PALETTE.h120, cursor: "pointer" }}
          >
            Explore CORE town
          </a>
          <button
            type="button"
            onClick={onDemo}
            className="nb-tile px-4 py-2.5 text-sm font-black uppercase tracking-wide"
            style={{ background: "#ffffff", cursor: "pointer" }}
          >
            Try the demo
          </button>
        </div>
      </div>
    </div>
  );
}
