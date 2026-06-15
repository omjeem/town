// Client-side auth shim.
//
// The browser never sees an access token. We hold only what `/api/auth/me`
// returns (a small user record) in module memory. The actual OAuth round-
// trip is a top-level navigation: `startLogin()` → /api/auth/login →
// app.getcore.me/oauth/authorize → /api/auth/callback → / (with cookie set).
//
// Module loads with `session = null`. The React mount calls `refreshSession`
// once on boot to pull the current session from the server. After that,
// listeners get notified on any change.

export type User = {
  id: string;
  name: string;
  email: string;
  workspaceId: string | null;
};

export type Session = {
  user: User;
};

let session: Session | null = null;
let initialized = false;

let listeners: Array<(s: Session | null) => void> = [];

export function getSession(): Session | null {
  return session;
}

export function isInitialized(): boolean {
  return initialized;
}

function emit() {
  for (const fn of listeners) fn(session);
}

// Pull the current session from the server. Called once on app boot. Idempotent
// — subsequent calls just re-fetch and update the cache + notify listeners.
export async function refreshSession(): Promise<Session | null> {
  try {
    const res = await fetch("/api/auth/me", { cache: "no-store" });
    if (!res.ok) {
      session = null;
    } else {
      const body = (await res.json()) as { user: User | null };
      session = body.user ? { user: body.user } : null;
    }
  } catch {
    session = null;
  }
  initialized = true;
  emit();
  return session;
}

// Top-level navigation to start the OAuth handshake. `redirectAfter` lets
// the caller land back on a specific path; defaults to current path.
export function startLogin(redirectAfter?: string): void {
  if (typeof window === "undefined") return;
  const target = redirectAfter ?? window.location.pathname + window.location.search;
  const qs = new URLSearchParams({ redirect: target });
  window.location.href = `/api/auth/login?${qs.toString()}`;
}

export async function logout(): Promise<void> {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch {
    // Ignore — we'll clear local state regardless so the UI reflects logout.
  }
  session = null;
  emit();
}

export function onSessionChange(fn: (s: Session | null) => void): () => void {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((x) => x !== fn);
  };
}
