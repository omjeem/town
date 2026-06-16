"use client";

import { useEffect, useState } from "react";

import { logout } from "../game/auth";
import { PALETTE } from "../game/config";

// First-time setup card — surfaced from app/page.tsx whenever the signed-in
// user has no Town row yet. Picks a town name (which becomes the URL slug)
// and bounces the browser to /{slug} on success.
//
// We slugify the typed name on the fly so the user sees the URL they're
// about to claim. They can override the slug separately if needed.
export function Onboarding({ userName }: { userName: string }) {
  const suggested = defaultName(userName);
  const [name, setName] = useState(suggested);
  const [slug, setSlug] = useState(slugify(suggested));
  const [touchedSlug, setTouchedSlug] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Host hint resolves after mount so we don't tear the SSR HTML when
  // window.location.host comes online.
  const [host, setHost] = useState("");

  useEffect(() => {
    setHost(window.location.host);
  }, []);

  // Keep the slug auto-synced to the name until the user hand-edits it.
  useEffect(() => {
    if (!touchedSlug) setSlug(slugify(name));
  }, [name, touchedSlug]);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/towns/me", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: name.trim(), slug: slug.trim() }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        const msg =
          body.error === "slug-taken"
            ? "That URL is taken. Try another."
            : body.error === "slug-invalid"
              ? "URL must be lowercase letters, numbers, or hyphens (2-32 chars)."
              : body.error === "already-onboarded"
                ? "You already have a town. Refresh the page."
                : "Something went wrong. Try again.";
        setError(msg);
        setSubmitting(false);
        return;
      }
      const { town } = (await res.json()) as { town: { slug: string } };
      window.location.href = `/${town.slug}`;
    } catch {
      setError("Network error. Try again.");
      setSubmitting(false);
    }
  }

  const canSubmit = name.trim().length >= 2 && slug.trim().length >= 2;

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#c5d0dc] p-6">
      <div className="nb-card flex w-full max-w-md flex-col gap-4 p-6">
        <div>
          <div className="text-xs font-bold uppercase tracking-wide text-[#1a1d22] opacity-60">
            Welcome
          </div>
          <h1 className="mt-1 text-2xl font-black leading-tight text-[#1a1d22]">
            Name your town
          </h1>
          <p className="mt-2 text-sm text-[#1a1d22] opacity-70">
            This is how people will find you. You can share the URL with anyone.
          </p>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold uppercase tracking-wide text-[#1a1d22] opacity-60">
            Town name
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Harshton"
            maxLength={64}
            className="nb-tile bg-[var(--paper)] px-3 py-2 text-base font-bold text-[#1a1d22] outline-none focus:translate-x-[1px] focus:translate-y-[1px]"
            autoFocus
            disabled={submitting}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold uppercase tracking-wide text-[#1a1d22] opacity-60">
            URL
          </span>
          <div
            className="nb-tile flex items-center gap-1 bg-[var(--paper)] px-3 py-2"
            style={{ background: PALETTE.h240 }}
          >
            <span className="text-sm font-bold text-[#1a1d22] opacity-50">
              {host}
            </span>
            <span className="text-sm font-bold text-[#1a1d22]">/</span>
            <input
              value={slug}
              onChange={(e) => {
                setTouchedSlug(true);
                setSlug(slugify(e.target.value));
              }}
              placeholder="harshton"
              maxLength={32}
              className="flex-1 bg-transparent text-sm font-bold text-[#1a1d22] outline-none"
              disabled={submitting}
            />
          </div>
        </label>

        {error ? (
          <div className="text-sm font-bold" style={{ color: "#b91c1c" }}>
            {error}
          </div>
        ) : null}

        <div className="mt-2 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              void logout().then(() => window.location.reload());
            }}
            className="text-xs font-bold uppercase tracking-wide text-[#1a1d22] opacity-60 hover:opacity-100"
            disabled={submitting}
          >
            Sign out
          </button>
          <button
            type="button"
            onClick={() => {
              if (canSubmit && !submitting) void submit();
            }}
            disabled={!canSubmit || submitting}
            className="nb-tile px-4 py-2 text-sm font-black uppercase tracking-wide"
            style={{
              background: canSubmit ? PALETTE.h240 : "#a4afbd",
              cursor: canSubmit && !submitting ? "pointer" : "not-allowed",
              opacity: submitting ? 0.6 : 1,
            }}
          >
            {submitting ? "Creating…" : "Create my town"}
          </button>
        </div>
      </div>
    </div>
  );
}

function defaultName(userName: string): string {
  // Strip everything after a space; capitalize first letter; tack on "ton"
  // so "Harshith Mullapudi" → "Harshton" feels less placeholder-y than the
  // raw first name.
  const first = (userName ?? "").trim().split(/\s+/)[0] ?? "town";
  if (!first) return "town";
  return first[0]!.toUpperCase() + first.slice(1).toLowerCase() + "ton";
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

