"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

import { getKaplayContext } from "../game/boot";
import { PALETTE, TILE } from "../game/config";
import { projectWorldPixelToScreen } from "../game/projection";
import { isPending } from "../game/realtime";
import { useTownTags, type TownTag } from "./useTownTags";

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

/** Max tag pills stacked above any one player's head card. Beyond this we
 *  show the first two earned + a "+N" overflow chip rather than an
 *  ever-growing tower. Keeps the overworld readable in dense scenes; two
 *  is enough to signal "this person has earned things" without crowding
 *  the name. */
const MAX_VISIBLE_TAGS = 2;

type KaplayRemoteObj = {
  participantKey: string;
  displayName: string;
  pos: { x: number; y: number };
};

export function RemoteCards({
  canvasRef,
  townSlug,
}: {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  /** Town this canvas belongs to. Drives the head-tag poll. Optional so
   *  scenes that haven't wired tags yet (or personal towns without a
   *  catalog) skip the fetch entirely. */
  townSlug?: string;
}) {
  const [cards, setCards] = useState<Card[]>([]);
  const lastRef = useRef<string>("");
  const rafRef = useRef<number | null>(null);
  const tagsBySubject = useTownTags(townSlug);

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
        <NameCard
          key={c.key}
          card={c}
          tags={tagsBySubject[c.key] ?? EMPTY_TAGS}
        />
      ))}
    </div>
  );
}

const EMPTY_TAGS: TownTag[] = [];

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

function NameCard({ card, tags }: { card: Card; tags: TownTag[] }) {
  const bg = pickBg(card.key);
  const visible = tags.slice(0, MAX_VISIBLE_TAGS);
  const overflow = tags.length - visible.length;
  return (
    <div
      className="absolute"
      style={{
        left: card.x,
        top: card.y,
        // The whole stack sits above the head. The bottom-most element is
        // the name pill (with the triangle tail pointing at the sprite);
        // earned tag pills stack above the name in column order.
        transform: "translate(-50%, calc(-100% - 8px))",
      }}
    >
      <div className="flex flex-col items-center gap-[3px]">
        {visible.length > 0 ? (
          <div className="flex flex-row items-center gap-[3px]">
            {visible.map((t) => (
              <TagPill key={t.id} tag={t} />
            ))}
            {overflow > 0 ? (
              <span
                className="rounded-full border-2 border-ink px-1.5 py-[1px] text-[9px] font-bold leading-none"
                style={{ background: "#1a1d22", color: "#f6f3ea" }}
              >
                +{overflow}
              </span>
            ) : null}
          </div>
        ) : null}
        <div
          className="relative inline-flex items-center gap-1.5 rounded-full border-2 border-ink px-3 py-1 text-[11px] font-bold leading-none whitespace-nowrap shadow-[2px_2px_0_0_#0e1116]"
          style={{ background: bg, color: "#f6f3ea" }}
        >
          <span>{card.name}</span>
          {card.pending ? (
            <span
              aria-label="needs reply"
              className="inline-block h-2 w-2 rounded-full border border-ink"
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
    </div>
  );
}

function TagPill({ tag }: { tag: TownTag }) {
  return (
    <span
      title={tag.label}
      className="rounded-full border-2 border-ink px-1.5 py-[1px] text-[10px] font-bold leading-none"
      style={{ background: tag.color, color: "#0e1116" }}
    >
      <span className="mr-0.5">{tag.emoji}</span>
      <span>{tag.label}</span>
    </span>
  );
}
