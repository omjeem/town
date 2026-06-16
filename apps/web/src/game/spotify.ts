// Spotify "now playing" poller.
//
// Polls /api/core/spotify/now-playing every POLL_MS and publishes to the
// UI store. Pauses when signed out (the endpoint would 401 anyway). The
// NowPlayingCard hides itself when `connected` is false or `playing` is
// false, so this poller just keeps state fresh.

import { ui, type NowPlayingState } from "../ui/store";
import { getSession, onSessionChange } from "./auth";

const POLL_MS = 10_000;

let timer: number | null = null;

export async function refreshNowPlaying(): Promise<void> {
  if (!getSession()) {
    ui.setNowPlaying({ connected: false, playing: false });
    return;
  }
  try {
    const res = await fetch("/api/core/spotify/now-playing", {
      cache: "no-store",
    });
    if (!res.ok) {
      ui.setNowPlaying({ connected: false, playing: false });
      return;
    }
    const body = (await res.json()) as NowPlayingState;
    ui.setNowPlaying(body);
  } catch {
    // Transient network blip — leave previous state in place.
  }
}

function start() {
  if (timer !== null) return;
  void refreshNowPlaying();
  timer = window.setInterval(() => {
    void refreshNowPlaying();
  }, POLL_MS);
}

function stop() {
  if (timer === null) return;
  window.clearInterval(timer);
  timer = null;
  ui.setNowPlaying({ connected: false, playing: false });
}

export function startNowPlayingPoller(): () => void {
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
