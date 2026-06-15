// Realtime client (Centrifugo).
//
// Two responsibilities:
//   1. Connect to Centrifugo with a token fetched from
//      /api/towns/[slug]/realtime-token, then subscribe to the positions
//      channel so we can render every other player in the town.
//   2. Publish our own position whenever the local player crosses a tile,
//      and expose presence + position updates to subscribers (the kaplay
//      scene + the proximity / chat UI).
//
// Connection lifecycle is keyed off the React mount in TownGame. We only
// fire the realtime layer for the owner + visitor-with-cookie cases —
// guests-on-/ (root playground) don't get one.

import { Centrifuge, type PublicationContext, type SubscribedContext } from "centrifuge";

const LOG = "[realtime]";

export type RemotePlayer = {
  participantKey: string;
  name: string;
  character: string;
  tx: number;
  ty: number;
  facing: "up" | "down" | "left" | "right";
  // Local clock when we last received an update for this player. Used to
  // expire stale ghosts (someone closed the tab without a clean leave).
  lastSeen: number;
};

type PositionPayload = {
  k: string;          // participantKey
  n: string;          // name
  ch: string;         // character sprite key
  tx: number;
  ty: number;
  f: RemotePlayer["facing"];
};

type Listener = () => void;

let centrifuge: Centrifuge | null = null;
let positionsSub: ReturnType<Centrifuge["newSubscription"]> | null = null;
let self: Pick<RemotePlayer, "participantKey" | "name" | "character"> | null = null;
let activeSlug: string | null = null;
// Latest position the scene asked us to publish. Cached so that if the
// sub wasn't yet `subscribed` when the scene first called us (race on
// boot), we can re-publish it as soon as the channel opens.
let lastSent:
  | { tx: number; ty: number; facing: RemotePlayer["facing"] }
  | null = null;
const remotes = new Map<string, RemotePlayer>();
const listeners = new Set<Listener>();

export function getActiveTownSlug(): string | null {
  return activeSlug;
}

// Module-level accessors so the kaplay scene (which isn't React) can
// reach the live state without holding a handle.
export function publishLocalPosition(input: {
  tx: number;
  ty: number;
  facing: RemotePlayer["facing"];
}): void {
  publishLocal(input.tx, input.ty, input.facing);
}

export function getRemotePlayers(): RemotePlayer[] {
  return Array.from(remotes.values());
}

export function onRemotesChange(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function getSelfIdentity(): Pick<
  RemotePlayer,
  "participantKey" | "name" | "character"
> | null {
  return self;
}

// Per-other-player "is awaiting a reply from me" flag. Populated by
// TownGame's pending poller; remotePlayer.ts reads this to draw a 💬
// badge above the matching sprite.
const pending = new Set<string>();
const pendingListeners = new Set<Listener>();

export function setPendingKeys(keys: string[]): void {
  let changed = keys.length !== pending.size;
  if (!changed) {
    for (const k of keys) {
      if (!pending.has(k)) {
        changed = true;
        break;
      }
    }
  }
  if (!changed) return;
  pending.clear();
  for (const k of keys) pending.add(k);
  for (const fn of pendingListeners) fn();
}

export function isPending(key: string): boolean {
  return pending.has(key);
}

export function onPendingChange(fn: Listener): () => void {
  pendingListeners.add(fn);
  return () => {
    pendingListeners.delete(fn);
  };
}

const STALE_MS = 30_000;

function notify() {
  for (const l of listeners) l();
}

function applyPublication(data: unknown) {
  if (!data || typeof data !== "object") return;
  const p = data as PositionPayload;
  if (typeof p.k !== "string") return;
  if (p.k === self?.participantKey) {
    // Our own echo — Centrifugo broadcasts to all subscribers including
    // the publisher. Drop quietly.
    return;
  }
  console.log(`${LOG} remote update key=${p.k} name=${p.n} tile=${p.tx},${p.ty}`);
  remotes.set(p.k, {
    participantKey: p.k,
    name: p.n,
    character: p.ch,
    tx: p.tx,
    ty: p.ty,
    facing: p.f,
    lastSeen: performance.now(),
  });
  notify();
}

function expireStale() {
  const now = performance.now();
  let changed = false;
  for (const [key, p] of remotes) {
    if (now - p.lastSeen > STALE_MS) {
      remotes.delete(key);
      changed = true;
    }
  }
  if (changed) notify();
}

let staleTimer: number | null = null;

export type RealtimeBootInput = {
  slug: string;
};

export type RealtimeHandle = {
  stop(): void;
};

export async function startRealtime({
  slug,
}: RealtimeBootInput): Promise<RealtimeHandle | null> {
  console.log(`${LOG} startRealtime slug=${slug}`);

  let bootstrap: {
    token: string;
    url: string;
    participantKey: string;
    displayName: string;
    character: string;
    positionsChannel: string;
  };
  try {
    const res = await fetch(`/api/towns/${slug}/realtime-token`, {
      cache: "no-store",
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.warn(
        `${LOG} /realtime-token status=${res.status} body=${body.slice(0, 200)}`,
      );
      return null;
    }
    bootstrap = await res.json();
    console.log(
      `${LOG} token ok participantKey=${bootstrap.participantKey} channel=${bootstrap.positionsChannel} url=${bootstrap.url}`,
    );
  } catch (e) {
    console.warn(`${LOG} /realtime-token fetch threw`, e);
    return null;
  }

  const url = bootstrap.url;
  if (!url) {
    console.warn(
      `${LOG} server returned empty url — set CENTRIFUGO_PUBLIC_URL on the web container`,
    );
    return null;
  }

  self = {
    participantKey: bootstrap.participantKey,
    name: bootstrap.displayName,
    character: bootstrap.character,
  };
  activeSlug = slug;

  const c = new Centrifuge(url, {
    token: bootstrap.token,
    getToken: async () => {
      const r = await fetch(`/api/towns/${slug}/realtime-token`, {
        cache: "no-store",
      });
      if (!r.ok) throw new Error("realtime-token refresh failed");
      const body = await r.json();
      return body.token as string;
    },
  });
  centrifuge = c;

  c.on("connecting", (ctx) => console.log(`${LOG} centrifuge connecting`, ctx));
  c.on("connected", (ctx) => console.log(`${LOG} centrifuge connected`, ctx));
  c.on("disconnected", (ctx) =>
    console.warn(`${LOG} centrifuge disconnected`, ctx),
  );
  c.on("error", (ctx) => console.warn(`${LOG} centrifuge error`, ctx));

  const sub = c.newSubscription(bootstrap.positionsChannel);
  positionsSub = sub;

  sub.on("publication", (ctx: PublicationContext) => {
    applyPublication(ctx.data);
  });
  sub.on("subscribed", (ctx: SubscribedContext) => {
    console.log(`${LOG} subscribed to ${bootstrap.positionsChannel}`, ctx);
    if (lastSent) {
      publishLocal(lastSent.tx, lastSent.ty, lastSent.facing);
    }
  });
  sub.on("subscribing", () =>
    console.log(`${LOG} subscribing to ${bootstrap.positionsChannel}`),
  );
  sub.on("unsubscribed", (ctx) =>
    console.warn(`${LOG} unsubscribed from ${bootstrap.positionsChannel}`, ctx),
  );
  sub.on("error", (ctx) =>
    console.warn(`${LOG} subscription error`, ctx),
  );

  sub.subscribe();
  c.connect();

  if (staleTimer === null) {
    staleTimer = window.setInterval(expireStale, 5000);
  }

  return { stop };
}

function publishLocal(
  tx: number,
  ty: number,
  facing: RemotePlayer["facing"],
): void {
  lastSent = { tx, ty, facing };
  if (!positionsSub || !self) {
    console.log(
      `${LOG} publishLocal queued (sub not ready) tx=${tx} ty=${ty}`,
    );
    return;
  }
  const payload: PositionPayload = {
    k: self.participantKey,
    n: self.name,
    ch: self.character,
    tx,
    ty,
    f: facing,
  };
  positionsSub.publish(payload).then(
    () => {
      console.log(`${LOG} publish ok tx=${tx} ty=${ty}`);
    },
    (err) => {
      console.warn(`${LOG} publish failed`, err);
    },
  );
}

function stop(): void {
  positionsSub?.unsubscribe();
  positionsSub?.removeAllListeners();
  positionsSub = null;
  centrifuge?.disconnect();
  centrifuge = null;
  self = null;
  activeSlug = null;
  lastSent = null;
  remotes.clear();
  if (staleTimer !== null) {
    window.clearInterval(staleTimer);
    staleTimer = null;
  }
  notify();
}
