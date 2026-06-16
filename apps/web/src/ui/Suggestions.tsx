"use client";

import { useEffect, useState } from "react";

import { PALETTE } from "../game/config";
import {
  approveSuggestion,
  declineSuggestion,
} from "../game/suggestions";
import { ui } from "./store";
import type { SuggestionItem, SuggestionPayload } from "./store";

// Right-side drawer listing pending PlotSuggestions. Opened from the
// HUD's count button. Each row gets Apply / Decline; clicking either
// hits the API, removes the row locally, and re-renders.
export function Suggestions({ list }: { list: SuggestionItem[] }) {
  // Close on Escape.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") ui.closeSuggestions();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      {/* Click-outside scrim. Lets the player tap anywhere in the world
          to dismiss the drawer. */}
      <div
        className="absolute inset-0 z-40 bg-black/20"
        onClick={() => ui.closeSuggestions()}
      />

      <aside
        className="nb-card pointer-events-auto absolute right-0 top-0 z-50 flex h-full w-[380px] flex-col gap-3 overflow-hidden p-4"
        style={{ borderRadius: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between">
          <div>
            <div className="text-base font-black leading-tight text-ink">
              Suggestions
            </div>
            <div className="text-[11px] leading-tight text-ink opacity-60">
              {list.length === 0
                ? "Nothing waiting — your butler's caught up."
                : `${list.length} change${list.length === 1 ? "" : "s"} waiting on you.`}
            </div>
          </div>
          <button
            type="button"
            onClick={() => ui.closeSuggestions()}
            className="nb-card px-2 py-1 text-sm font-bold text-ink"
            title="Close (Esc)"
          >
            ×
          </button>
        </header>

        <div className="flex-1 overflow-y-auto pr-1">
          {list.length === 0 ? (
            <EmptyState />
          ) : (
            <ul className="flex flex-col gap-3">
              {list.map((s) => (
                <SuggestionCard key={s.id} suggestion={s} />
              ))}
            </ul>
          )}
        </div>
      </aside>
    </>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
      <div className="text-2xl" aria-hidden>
        ☕
      </div>
      <div className="text-sm font-bold text-ink">All quiet</div>
      <div className="text-[11px] leading-snug text-ink opacity-60">
        New suggestions land here when your butler hears something new about you.
      </div>
    </div>
  );
}

function SuggestionCard({ suggestion }: { suggestion: SuggestionItem }) {
  const [busy, setBusy] = useState<"approve" | "decline" | null>(null);
  const accent = accentFor(suggestion.kind);
  const title = titleFor(suggestion.payload);
  const detail = detailFor(suggestion.payload);

  async function onApply() {
    if (busy) return;
    setBusy("approve");
    const ok = await approveSuggestion(suggestion.id);
    if (!ok) setBusy(null);
    // On success the row is removed from the list so this card unmounts.
  }

  async function onDecline() {
    if (busy) return;
    setBusy("decline");
    const ok = await declineSuggestion(suggestion.id);
    if (!ok) setBusy(null);
  }

  return (
    <li className="nb-card flex flex-col gap-2 p-3">
      <div className="flex items-start gap-2">
        <div
          className="nb-tile h-6 w-6 shrink-0"
          style={{ background: accent }}
          aria-hidden
        />
        <div className="flex-1 min-w-0">
          <div className="text-xs font-black uppercase tracking-wide text-ink opacity-60">
            {labelFor(suggestion.kind)}
          </div>
          <div className="text-sm font-bold leading-tight text-ink">
            {title}
          </div>
        </div>
      </div>

      <p className="text-[12px] leading-snug text-ink opacity-80">
        {suggestion.reason}
      </p>

      {detail ? (
        <div className="rounded-sm bg-black/5 px-2 py-1.5 text-[11px] leading-snug text-ink opacity-80">
          {detail}
        </div>
      ) : null}

      <div className="mt-1 flex gap-2">
        <button
          type="button"
          onClick={onApply}
          disabled={busy !== null}
          className="nb-card flex-1 px-3 py-1.5 text-sm font-black text-ink disabled:opacity-50"
          style={{ background: PALETTE.h150 }}
        >
          {busy === "approve" ? "Applying…" : "Apply"}
        </button>
        <button
          type="button"
          onClick={onDecline}
          disabled={busy !== null}
          className="nb-card flex-1 px-3 py-1.5 text-sm font-black text-ink disabled:opacity-50"
        >
          {busy === "decline" ? "Declining…" : "Decline"}
        </button>
      </div>
    </li>
  );
}

function accentFor(kind: SuggestionPayload["kind"]): string {
  switch (kind) {
    case "add-building":
      return PALETTE.h60;
    case "add-npc":
      return PALETTE.h240;
    case "update-npc":
      return PALETTE.h270;
  }
}

function labelFor(kind: SuggestionPayload["kind"]): string {
  switch (kind) {
    case "add-building":
      return "New building";
    case "add-npc":
      return "New resident";
    case "update-npc":
      return "Update resident";
  }
}

function titleFor(payload: SuggestionPayload): string {
  switch (payload.kind) {
    case "add-building":
      return `Break ground on a ${payload.plotKey}`;
    case "add-npc":
      return `Add ${payload.name} at ${payload.buildingId}`;
    case "update-npc":
      return `Evolve ${payload.npcId}`;
  }
}

function detailFor(payload: SuggestionPayload): string | null {
  if (payload.kind === "add-npc") {
    return payload.description;
  }
  if (payload.kind === "update-npc") {
    if (payload.fields.description) return payload.fields.description;
    if (payload.fields.prompt) return trim(payload.fields.prompt, 160);
  }
  return null;
}

function trim(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + "…";
}
