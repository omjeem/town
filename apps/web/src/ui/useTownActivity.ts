"use client";

// Shared activity feed for the bottom bar. Owns one poll against
// /api/towns/[slug]/activity and exposes the latest rows to both the
// rolling ticker and the "Town activity" popover so we don't open
// two HTTP polls for the same data.

import { useEffect, useState } from "react";

const POLL_INTERVAL_MS = 20_000;
const LIMIT = 50;

export type ActivityKind =
  | "visit"
  | "npc_chat"
  | "tag_awarded"
  | "item_awarded"
  | "group_chat_started";

export interface ActivityRow {
  id: string;
  kind: ActivityKind;
  subjectKey: string;
  subjectName: string;
  subjectCharacter: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export type ActivityStatus = "loading" | "ready" | "error";

export interface UseTownActivity {
  items: ActivityRow[];
  status: ActivityStatus;
}

export function useTownActivity(
  townSlug: string | undefined,
): UseTownActivity {
  const [items, setItems] = useState<ActivityRow[]>([]);
  const [status, setStatus] = useState<ActivityStatus>("loading");

  useEffect(() => {
    if (!townSlug) {
      setItems([]);
      setStatus("loading");
      return;
    }
    let cancelled = false;
    const ctrl = new AbortController();

    const fetchOnce = async () => {
      try {
        const res = await fetch(
          `/api/towns/${encodeURIComponent(townSlug)}/activity?limit=${LIMIT}`,
          { signal: ctrl.signal, cache: "no-store" },
        );
        if (!res.ok) {
          if (!cancelled) setStatus("error");
          return;
        }
        const body = (await res.json()) as { items?: ActivityRow[] };
        if (cancelled) return;
        setItems(body.items ?? []);
        setStatus("ready");
      } catch (e) {
        if ((e as { name?: string }).name === "AbortError") return;
        if (!cancelled) setStatus("error");
      }
    };

    void fetchOnce();
    const id = window.setInterval(fetchOnce, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      ctrl.abort();
      window.clearInterval(id);
    };
  }, [townSlug]);

  return { items, status };
}
