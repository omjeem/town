"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

import { getKaplayContext } from "../game/boot";
import { PALETTE, TILE } from "../game/config";
import { projectWorldPixelToScreen } from "../game/projection";
import { isPending } from "../game/realtime";

// Floating, React-rendered name cards anchored above each remote player.
//
// We enumerate kaplay's actual "remote-player" game objects so the card
// position tracks the in-flight tween (not just the discrete tile
// position from the realtime payload). `projectWorldPixelToScreen`
// delegates the camera math to kaplay so the card always lines up with
// what the canvas is drawing.

const REMOTE_SPRITE_H = 25;

type Card = {
  key: string;
  name: string;
  x: number;
  y: number;
  pending: boolean;
};

type KaplayRemoteObj = {
  participantKey: string;
  displayName: string;
  pos: { x: number; y: number };
};

export function RemoteCards({
  canvasRef,
}: {
  canvasRef: RefObject<HTMLCanvasElement | null>;
}) {
  const [cards, setCards] = useState<Card[]>([]);
  const lastRef = useRef<string>("");
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    let stopped = false;

    function tick() {
      if (stopped) return;
      const canvas = canvasRef.current;
      const k = getKaplayContext();
      if (!canvas || !k) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const objs = (k.get("remote-player") as unknown as KaplayRemoteObj[]) ?? [];
      const next: Card[] = [];
      let digest = "";
      for (const o of objs) {
        if (!o.participantKey) continue;
        // World point we want to anchor under: top of the sprite head.
        // The sprite child is offset by (TILE - REMOTE_SPRITE_H) from
        // the parent's pos, so head world-y = parent.pos.y - 9.
        const headWorldX = o.pos.x + TILE / 2;
        const headWorldY = o.pos.y + (TILE - REMOTE_SPRITE_H);
        const screen = projectWorldPixelToScreen(canvas, headWorldX, headWorldY);
        if (!screen.visible) continue;
        const card: Card = {
          key: o.participantKey,
          name: o.displayName,
          x: Math.round(screen.x * 2) / 2,
          y: Math.round(screen.y * 2) / 2,
          pending: isPending(o.participantKey),
        };
        next.push(card);
        digest += `${card.key}:${card.x},${card.y},${card.name},${card.pending};`;
      }
      if (digest !== lastRef.current) {
        lastRef.current = digest;
        setCards(next);
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      stopped = true;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [canvasRef]);

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {cards.map((c) => (
        <NameCard key={c.key} card={c} />
      ))}
    </div>
  );
}

// Pool of pill backgrounds. We skip h90 (reserved for the pending dot)
// and stick to hues that work with cream text. The participant key is
// hashed to pick from this list so the same person always reads the
// same colour across reloads + across visitor browsers.
const CARD_BG_POOL = [
  PALETTE.h60,  // orange
  PALETTE.h120, // olive
  PALETTE.h150, // green
  PALETTE.h180, // teal
  PALETTE.h210, // sky blue
  PALETTE.h240, // CORE blue
  PALETTE.h270, // purple
  PALETTE.h300, // magenta
  PALETTE.h330, // rose
  PALETTE.h360, // red
] as const;

function pickBg(key: string): string {
  let h = 0;
  for (let i = 0; i < key.length; i++) {
    h = (h * 31 + key.charCodeAt(i)) | 0;
  }
  return CARD_BG_POOL[Math.abs(h) % CARD_BG_POOL.length]!;
}

function NameCard({ card }: { card: Card }) {
  const bg = pickBg(card.key);
  return (
    <div
      className="absolute"
      style={{
        left: card.x,
        top: card.y,
        // Sit the pill above the head with a small gap; the triangle tail
        // bridges the gap visually.
        transform: "translate(-50%, calc(-100% - 8px))",
      }}
    >
      <div
        className="relative inline-flex items-center gap-1.5 rounded-full border-2 border-[#1a1d22] px-3 py-1 text-[11px] font-bold leading-none whitespace-nowrap shadow-[2px_2px_0_0_#0e1116]"
        style={{ background: bg, color: "#f6f3ea" }}
      >
        <span>{card.name}</span>
        {card.pending ? (
          <span
            aria-label="needs reply"
            className="inline-block h-2 w-2 rounded-full border border-[#1a1d22]"
            style={{ background: PALETTE.h90 }}
          />
        ) : null}
        {/* Triangle tail pointing at the character — black outline drawn
            first, fill stacked on top so the outline shows. */}
        <span
          aria-hidden
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            top: "100%",
            width: 0,
            height: 0,
            borderLeft: "5px solid transparent",
            borderRight: "5px solid transparent",
            borderTop: "6px solid #1a1d22",
          }}
        />
        <span
          aria-hidden
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            top: "100%",
            marginTop: "-2px",
            width: 0,
            height: 0,
            borderLeft: "4px solid transparent",
            borderRight: "4px solid transparent",
            borderTop: `5px solid ${bg}`,
          }}
        />
      </div>
    </div>
  );
}
