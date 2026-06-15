// Inbox poller — keeps the unread VoiceInboxMessage count fresh.
//
// Drives:
//   • The overworld HUD badge ("🔔 N waiting at home")
//   • The HOME NPC greeting branch (zero vs N updates)
//
// Polls /api/core/inbox every POLL_MS while a session is active. Pauses
// when not signed in (CORE would 401 anyway). One global timer so it
// shares state across components.

import { ui } from "../ui/store";
import { getSession, onSessionChange } from "./auth";

const POLL_MS = 20_000;

let timer: number | null = null;
let lastFetchedAt = 0;

export type InboxFetchResult = {
  count: number;
  // Server-side `items` aren't exposed publicly — we only surface count
  // for the badge / greeting. Use refreshInbox().items if needed later.
  items: Array<{
    id: string;
    message: string;
    taskId: string | null;
    channelType: string | null;
    createdAt: string;
  }>;
} | null;

export async function refreshInbox(): Promise<InboxFetchResult> {
  if (!getSession()) {
    ui.setInbox({ count: 0, fetchedAt: new Date().toISOString() });
    return null;
  }
  try {
    const res = await fetch("/api/core/inbox?limit=20", { cache: "no-store" });
    if (!res.ok) {
      // 401 = session went stale; just publish zero and let the next
      // session change re-trigger.
      ui.setInbox({ count: 0, fetchedAt: new Date().toISOString() });
      return null;
    }
    const body = (await res.json()) as InboxFetchResult;
    if (!body) return null;
    lastFetchedAt = Date.now();
    ui.setInbox({
      count: body.count ?? 0,
      fetchedAt: new Date(lastFetchedAt).toISOString(),
    });
    return body;
  } catch {
    return null;
  }
}

function start() {
  if (timer !== null) return;
  void refreshInbox();
  timer = window.setInterval(() => {
    void refreshInbox();
  }, POLL_MS);
}

function stop() {
  if (timer === null) return;
  window.clearInterval(timer);
  timer = null;
  ui.setInbox({ count: 0, fetchedAt: new Date().toISOString() });
}

// Wire the poller's lifetime to the auth state. Called once from
// TownGame's mount effect.
export function startInboxPoller() {
  if (typeof window === "undefined") return () => {};
  if (getSession()) start();
  const unsub = onSessionChange((s) => {
    if (s) start();
    else stop();
  });
  return () => {
    unsub();
    stop();
  };
}
