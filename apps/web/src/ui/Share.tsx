"use client";

import { useEffect, useState } from "react";

import { takeScreenshotDataUrl } from "../game/boot";
import { PALETTE } from "../game/config";
import { ui } from "./store";

// Share modal — surfaced from the identity card dropdown.
//
//   • Shows the town URL and the active share code (rotatable).
//   • Reset button mints a fresh code (invalidates the old one immediately).
//   • Download screenshot grabs the current kaplay frame as a PNG.
//
// Fetches the slug + code on mount via /api/towns/me and
// /api/towns/{slug}/share-code. Both endpoints are owner-only — the menu
// itself is only mounted on the owner side, so unauthenticated callers
// shouldn't see this.
export function Share() {
  const [slug, setSlug] = useState<string | null>(null);
  const [townName, setTownName] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [rotating, setRotating] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "url" | "code">("idle");
  const [error, setError] = useState<string | null>(null);

  // Close on Escape.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") ui.closeShare();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const meRes = await fetch("/api/towns/me", { cache: "no-store" });
        if (!meRes.ok) {
          setError("Couldn't load your town. Try again.");
          setLoading(false);
          return;
        }
        const me = (await meRes.json()) as {
          town: { slug: string; name: string } | null;
        };
        if (!me.town) {
          setError("You don't have a town yet.");
          setLoading(false);
          return;
        }
        if (cancelled) return;
        setSlug(me.town.slug);
        setTownName(me.town.name);

        const codeRes = await fetch(
          `/api/towns/${me.town.slug}/share-code`,
          { cache: "no-store" },
        );
        if (!codeRes.ok) {
          if (!cancelled) {
            setError("Couldn't load your share code.");
            setLoading(false);
          }
          return;
        }
        const codeBody = (await codeRes.json()) as { code: string };
        if (!cancelled) {
          setCode(codeBody.code);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError("Network error. Try again.");
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const townUrl =
    slug && typeof window !== "undefined"
      ? `${window.location.origin}/${slug}`
      : null;

  async function rotateCode() {
    if (!slug) return;
    if (!confirm("Reset the share code? Anyone using the current code will lose access.")) {
      return;
    }
    setRotating(true);
    try {
      const res = await fetch(`/api/towns/${slug}/share-code`, {
        method: "POST",
      });
      if (!res.ok) {
        setError("Couldn't reset the code.");
      } else {
        const body = (await res.json()) as { code: string };
        setCode(body.code);
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setRotating(false);
    }
  }

  async function copy(text: string, kind: "url" | "code") {
    try {
      await navigator.clipboard.writeText(text);
      setCopyState(kind);
      setTimeout(() => setCopyState("idle"), 1200);
    } catch {
      // Clipboard blocked — fall back to a quick prompt the user can copy from.
      prompt("Copy:", text);
    }
  }

  function downloadScreenshot() {
    const dataUrl = takeScreenshotDataUrl();
    if (!dataUrl) {
      setError("Couldn't capture a screenshot — try again from the overworld.");
      return;
    }
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${slug ?? "town"}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) ui.closeShare();
      }}
    >
      <div className="nb-card flex w-full max-w-md flex-col gap-4 p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-wide text-[#1a1d22] opacity-60">
              Share
            </div>
            <h2 className="mt-1 text-2xl font-black leading-tight text-[#1a1d22]">
              {townName ?? "Your town"}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => ui.closeShare()}
            className="text-xs font-bold uppercase tracking-wide text-[#1a1d22] opacity-60 hover:opacity-100"
          >
            Close
          </button>
        </div>

        {loading ? (
          <div className="text-sm font-bold text-[#1a1d22] opacity-60">
            Loading…
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold uppercase tracking-wide text-[#1a1d22] opacity-60">
                URL
              </span>
              <div className="nb-tile flex items-center justify-between gap-2 bg-[var(--paper)] px-3 py-2">
                <span className="truncate text-sm font-bold text-[#1a1d22]">
                  {townUrl}
                </span>
                <button
                  type="button"
                  onClick={() => townUrl && void copy(townUrl, "url")}
                  className="text-xs font-bold uppercase tracking-wide text-[#1a1d22] opacity-60 hover:opacity-100"
                >
                  {copyState === "url" ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold uppercase tracking-wide text-[#1a1d22] opacity-60">
                Share code
              </span>
              <div
                className="nb-tile flex items-center justify-between gap-2 px-3 py-3"
                style={{ background: PALETTE.h60 }}
              >
                <span className="font-mono text-2xl font-black tracking-[0.4em] text-[#1a1d22]">
                  {code ?? "------"}
                </span>
                <button
                  type="button"
                  onClick={() => code && void copy(code, "code")}
                  className="text-xs font-bold uppercase tracking-wide text-[#1a1d22] opacity-60 hover:opacity-100"
                >
                  {copyState === "code" ? "Copied" : "Copy"}
                </button>
              </div>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="text-[11px] text-[#1a1d22] opacity-60">
                  Visitors enter this code with their name.
                </span>
                <button
                  type="button"
                  onClick={() => void rotateCode()}
                  disabled={rotating}
                  className="text-xs font-bold uppercase tracking-wide text-[#1a1d22] opacity-60 hover:opacity-100"
                >
                  {rotating ? "Resetting…" : "Reset code"}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold uppercase tracking-wide text-[#1a1d22] opacity-60">
                Screenshot
              </span>
              <button
                type="button"
                onClick={() => downloadScreenshot()}
                className="nb-tile px-3 py-2 text-sm font-black uppercase tracking-wide"
                style={{ background: PALETTE.h240, cursor: "pointer" }}
              >
                Download PNG of current view
              </button>
            </div>

            {error ? (
              <div className="text-sm font-bold" style={{ color: "#b91c1c" }}>
                {error}
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
