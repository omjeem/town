// Polls /api/towns/[slug]/dm-pending and updates realtime.ts's pending
// key set. The kaplay remote-player layer reads `isPending(key)` to
// render the "💬 reply" pill above the right characters.

import { setPendingKeys } from "./realtime";

const POLL_MS = 5_000;

let timer: number | null = null;

async function refresh(slug: string): Promise<void> {
  try {
    const res = await fetch(`/api/towns/${slug}/dm-pending`, {
      cache: "no-store",
    });
    if (!res.ok) {
      setPendingKeys([]);
      return;
    }
    const body = (await res.json()) as {
      pending: Array<{ otherKey: string; lastMessageAt: string }>;
    };
    setPendingKeys(body.pending.map((p) => p.otherKey));
  } catch {
    // Network blip — keep the previous state.
  }
}

export function startPendingPoller(slug: string): () => void {
  void refresh(slug);
  timer = window.setInterval(() => void refresh(slug), POLL_MS);
  return () => {
    if (timer !== null) {
      window.clearInterval(timer);
      timer = null;
    }
    setPendingKeys([]);
  };
}
