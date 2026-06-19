"use client";

// Client-side cache of the town's active visitor tags. Polls
// /api/towns/[slug]/tags every POLL_MS and exposes a Map<subjectKey, Tag[]>
// for the overworld renderer to look up which pills to stack above each
// player's head.
//
// Polling (instead of subscribing to a realtime channel) is intentional
// for v1: the cadence is fast enough for the "I just got Roasted" moment
// to land within ~15s, while a Centrifugo grant_tag broadcast would
// require pub/sub plumbing on every NPC tool call. Easy to upgrade later
// — the hook stays the same.

import { useEffect, useState } from "react";

const POLL_MS = 15_000;

export interface TownTag {
  id: string;
  label: string;
  emoji: string;
  color: string;
  expiresAt: string | null;
}

export type TagsBySubject = Record<string, TownTag[]>;

export function useTownTags(townSlug: string | undefined): TagsBySubject {
  const [tags, setTags] = useState<TagsBySubject>({});

  useEffect(() => {
    if (!townSlug) {
      setTags({});
      return;
    }
    let cancelled = false;

    async function fetchTags() {
      try {
        const res = await fetch(
          `/api/towns/${encodeURIComponent(townSlug!)}/tags`,
          { cache: "no-store" },
        );
        if (!res.ok) return;
        const body = (await res.json()) as { tagsBySubject?: TagsBySubject };
        if (cancelled) return;
        // The server filters expired rows at fetch time, but a tag can
        // tick past its expiry between polls. Filter here too so the
        // pill drops off the head within ~250ms of expiry instead of
        // hanging on for the rest of the poll window.
        const now = Date.now();
        const filtered: TagsBySubject = {};
        for (const [key, tags] of Object.entries(body.tagsBySubject ?? {})) {
          const live = tags.filter(
            (t) => t.expiresAt === null || Date.parse(t.expiresAt) > now,
          );
          if (live.length > 0) filtered[key] = live;
        }
        setTags(filtered);
      } catch {
        // Transient network error — keep the last good map. The next
        // tick will retry; nothing else to report.
      }
    }

    void fetchTags();
    const iv = window.setInterval(fetchTags, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(iv);
    };
  }, [townSlug]);

  return tags;
}
