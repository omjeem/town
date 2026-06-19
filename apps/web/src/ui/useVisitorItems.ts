"use client";

// Client-side cache of the calling visitor's earned item cards in this
// town. Polls /api/towns/[slug]/items every POLL_MS so the HUD badge
// counts new awards within ~10s of an NPC issuing one. Same pattern as
// useTownTags — easy to upgrade to a realtime push later without
// changing this hook's surface.

import { useEffect, useState } from "react";

const POLL_MS = 10_000;

export interface VisitorItem {
  id: string;
  templateId: string;
  templateLabel: string;
  createdAt: string;
}

export function useVisitorItems(townSlug: string | undefined): VisitorItem[] {
  const [items, setItems] = useState<VisitorItem[]>([]);

  useEffect(() => {
    if (!townSlug) {
      setItems([]);
      return;
    }
    let cancelled = false;

    async function fetchItems() {
      try {
        const res = await fetch(
          `/api/towns/${encodeURIComponent(townSlug!)}/items`,
          { cache: "no-store" },
        );
        if (!res.ok) return;
        const body = (await res.json()) as { items?: VisitorItem[] };
        if (cancelled) return;
        setItems(body.items ?? []);
      } catch {
        // Transient — keep the last good list, retry on next tick.
      }
    }

    void fetchItems();
    const iv = window.setInterval(fetchItems, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(iv);
    };
  }, [townSlug]);

  return items;
}
