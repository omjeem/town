"use client";

import { useState } from "react";

import { startLogin } from "../game/auth";
import { PALETTE } from "../game/config";

// Gate shown when a non-owner visits /{slug} without a valid visitor
// cookie. Collects display name + the town's share code; on success the
// page reloads so the server can flip to the read-only TownGame.
//
// Guests get an extra "Sign in with CORE" affordance — they can swap to
// the owner-style login if they want their CORE identity used instead.
export function VisitorGate({
  townName,
  townSlug,
  initialName,
  signedIn,
}: {
  townName: string;
  townSlug: string;
  initialName?: string;
  signedIn: boolean;
}) {
  const [name, setName] = useState(initialName ?? "");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/towns/${townSlug}/visit`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: name.trim(), code: code.trim() }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        const msg =
          body.error === "bad-code"
            ? "Wrong code. Ask the owner for the current one."
            : body.error === "missing-code"
              ? "Enter the town code."
              : body.error === "missing-name"
                ? "Enter your name."
                : body.error === "not-found"
                  ? "This town doesn't exist."
                  : "Couldn't get you in. Try again.";
        setError(msg);
        setSubmitting(false);
        return;
      }
      // Cookie is set — reload so the server re-renders the page as a
      // visitor with a valid pass.
      window.location.reload();
    } catch {
      setError("Network error. Try again.");
      setSubmitting(false);
    }
  }

  const canSubmit = name.trim().length >= 1 && code.trim().length >= 4;

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#c5d0dc] p-6">
      <div className="nb-card flex w-full max-w-md flex-col gap-4 p-6">
        <div>
          <div className="text-xs font-bold uppercase tracking-wide text-[#1a1d22] opacity-60">
            You're invited to
          </div>
          <h1 className="mt-1 text-2xl font-black leading-tight text-[#1a1d22]">
            {townName}
          </h1>
          <p className="mt-2 text-sm text-[#1a1d22] opacity-70">
            Enter your name and the town code to take a look around.
            Read-only — no edits.
          </p>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold uppercase tracking-wide text-[#1a1d22] opacity-60">
            Your name
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane"
            maxLength={64}
            className="nb-tile bg-[var(--paper)] px-3 py-2 text-base font-bold text-[#1a1d22] outline-none focus:translate-x-[1px] focus:translate-y-[1px]"
            autoFocus
            disabled={submitting}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold uppercase tracking-wide text-[#1a1d22] opacity-60">
            Town code
          </span>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="K7M2QX"
            maxLength={8}
            spellCheck={false}
            className="nb-tile bg-[var(--paper)] px-3 py-2 font-mono text-base font-bold tracking-[0.3em] text-[#1a1d22] outline-none focus:translate-x-[1px] focus:translate-y-[1px]"
            disabled={submitting}
          />
        </label>

        {error ? (
          <div className="text-sm font-bold" style={{ color: "#b91c1c" }}>
            {error}
          </div>
        ) : null}

        <div className="mt-2 flex items-center justify-between gap-3">
          {!signedIn ? (
            <button
              type="button"
              onClick={() => startLogin(`/${townSlug}`)}
              className="text-xs font-bold uppercase tracking-wide text-[#1a1d22] opacity-60 hover:opacity-100"
              disabled={submitting}
            >
              Sign in with CORE instead
            </button>
          ) : (
            <span />
          )}
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
            {submitting ? "Checking…" : "Enter town"}
          </button>
        </div>
      </div>
    </div>
  );
}
