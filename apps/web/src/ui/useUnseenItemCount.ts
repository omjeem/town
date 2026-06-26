"use client";

// Tracks how many of the visitor's earned items are "new" since they
// last opened the inventory. Wraps useVisitorItems with a localStorage
// cursor so the count survives reloads but resets the moment the
// visitor acknowledges them by clicking the top-right badge.
//
// First read seeds the cursor to "now" — without this, a visitor who
// already had items before this feature shipped would see every old
// card light up as new on first paint.

import { useCallback, useEffect, useMemo, useState } from "react";

import { useVisitorItems, type VisitorItem } from "./useVisitorItems";

function storageKey(slug: string): string {
  return `town-items-seen:${slug}`;
}

function readCursor(slug: string): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(storageKey(slug));
    if (!raw) return 0;
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

function writeCursor(slug: string, value: number): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(slug), String(value));
  } catch {
    // Private mode / quota — degrade to in-memory only.
  }
}

export interface UnseenItems {
  items: VisitorItem[];
  unseenCount: number;
  markSeen: () => void;
}

export function useUnseenItemCount(townSlug: string | undefined): UnseenItems {
  const items = useVisitorItems(townSlug);
  const [cursor, setCursor] = useState<number>(() =>
    townSlug ? readCursor(townSlug) : 0,
  );
  const [seeded, setSeeded] = useState(false);

  // Reset bookkeeping when the slug changes (e.g. visiting a different
  // town in the same tab).
  useEffect(() => {
    if (!townSlug) {
      setSeeded(false);
      return;
    }
    setCursor(readCursor(townSlug));
    setSeeded(false);
  }, [townSlug]);

  // First time we see a non-empty list, baseline the cursor to the
  // newest item's createdAt so the existing inventory doesn't flash
  // as "new". Empty inventories stay un-seeded so the cursor jumps
  // forward the moment the first item lands.
  useEffect(() => {
    if (!townSlug || seeded) return;
    if (items.length === 0) return;
    const newest = items.reduce((max, it) => {
      const t = Date.parse(it.createdAt);
      return Number.isFinite(t) && t > max ? t : max;
    }, 0);
    if (newest > cursor) {
      setCursor(newest);
      writeCursor(townSlug, newest);
    }
    setSeeded(true);
  }, [townSlug, items, cursor, seeded]);

  const unseenCount = useMemo(() => {
    if (!seeded) return 0;
    let n = 0;
    for (const it of items) {
      const t = Date.parse(it.createdAt);
      if (Number.isFinite(t) && t > cursor) n++;
    }
    return n;
  }, [items, cursor, seeded]);

  const markSeen = useCallback(() => {
    if (!townSlug) return;
    const now = Date.now();
    setCursor(now);
    writeCursor(townSlug, now);
    setSeeded(true);
  }, [townSlug]);

  return { items, unseenCount, markSeen };
}
