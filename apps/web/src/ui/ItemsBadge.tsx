"use client";

// Top-right "Items: N" card + modal. Sits beside PopulationBadge in
// TownGame. Clicking the card opens a modal that walks through every
// card the visitor has earned in this town, one at a time, with a
// share button per card.
//
// Always visible — including at count 0 — so the player knows the slot
// exists and can watch it tick up as they earn things. Clicks are
// no-ops while empty; the modal needs at least one item to render.

import { useCallback, useEffect, useState } from "react";

import { HudButton } from "./HudButton";
import { useUnseenItemCount } from "./useUnseenItemCount";
import type { VisitorItem } from "./useVisitorItems";

export function ItemsBadge({ townSlug }: { townSlug: string }) {
  const { items, unseenCount, markSeen } = useUnseenItemCount(townSlug);
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  // Lock background scroll while the modal is open. Acknowledge any
  // unseen items on both edges so anything that lands while the modal
  // is open is also marked seen on close — the visitor opened the
  // inventory, they've seen what's in it.
  useEffect(() => {
    if (!open) return;
    markSeen();
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
      markSeen();
    };
  }, [open, markSeen]);

  // Reset to the newest item every time the modal opens, and clamp the
  // index if the list shrunk (rare — only if an item gets deleted while
  // the modal is open).
  useEffect(() => {
    if (open) setIndex(0);
  }, [open]);
  useEffect(() => {
    if (index >= items.length) setIndex(Math.max(0, items.length - 1));
  }, [items.length, index]);

  const close = useCallback(() => setOpen(false), []);
  const prev = useCallback(
    () => setIndex((i) => (i > 0 ? i - 1 : items.length - 1)),
    [items.length],
  );
  const next = useCallback(
    () => setIndex((i) => (i + 1) % items.length),
    [items.length],
  );

  // Keyboard nav while the modal is open: ←/→ to cycle, Esc to close.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close, prev, next]);

  const isEmpty = items.length === 0;
  const hasUnseen = unseenCount > 0;

  return (
    <>
      <HudButton
        onClick={() => {
          // Empty state: button is purely informational, no modal to
          // open. Clicking it does nothing — the cursor + disabled
          // affordance below already signal that.
          if (isEmpty) return;
          markSeen();
          setOpen(true);
        }}
        disabled={isEmpty}
        variant={hasUnseen ? "primary" : "default"}
        style={{ opacity: isEmpty ? 0.5 : 1 }}
        aria-label={
          isEmpty
            ? "Items: 0. No items earned yet."
            : hasUnseen
              ? `New items: ${unseenCount}. Click to view.`
              : `Items: ${items.length}. Click to view and share.`
        }
        title={
          isEmpty
            ? "No items earned in this town yet"
            : hasUnseen
              ? `${unseenCount} new item${unseenCount === 1 ? "" : "s"} since you last looked`
              : `${items.length} item${items.length === 1 ? "" : "s"} earned in this town`
        }
      >
        {hasUnseen ? `New items: ${unseenCount}` : `Items: ${items.length}`}
      </HudButton>

      {open ? (
        <ItemsModal
          items={items}
          index={index}
          onPrev={prev}
          onNext={next}
          onClose={close}
        />
      ) : null}
    </>
  );
}

function ItemsModal({
  items,
  index,
  onPrev,
  onNext,
  onClose,
}: {
  items: VisitorItem[];
  index: number;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
}) {
  const item = items[index];
  if (!item) return null;
  const multi = items.length > 1;

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(8, 10, 14, 0.88)" }}
      onClick={onClose}
    >
      <div
        className="relative"
        style={{
          width: "min(900px, 92vw)",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between text-ink-soft">
          <div className="text-[13px] font-bold uppercase tracking-wide text-[#f6f3ea] opacity-80">
            {item.templateLabel}
            {multi ? (
              <span className="ml-2 opacity-60">
                {index + 1} of {items.length}
              </span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full border-2 border-[#0e1116] bg-white px-3 py-1 text-[11px] font-bold text-ink"
          >
            Close · Esc
          </button>
        </div>

        <div
          style={{
            background: "#000",
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/items/${item.id}/svg`}
            alt={item.templateLabel}
            width={1200}
            height={630}
            style={{
              display: "block",
              width: "100%",
              height: "auto",
              aspectRatio: "1200 / 630",
            }}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          {multi ? (
            <button
              type="button"
              onClick={onPrev}
              className="rounded-full border-2 border-[#0e1116] bg-white px-4 py-2 text-[12px] font-bold text-ink"
              aria-label="Previous item"
            >
              ← Prev
            </button>
          ) : (
            <span />
          )}

          <ShareControls item={item} />

          {multi ? (
            <button
              type="button"
              onClick={onNext}
              className="rounded-full border-2 border-[#0e1116] bg-white px-4 py-2 text-[12px] font-bold text-ink"
              aria-label="Next item"
            >
              Next →
            </button>
          ) : (
            <span />
          )}
        </div>
      </div>
    </div>
  );
}

function ShareControls({ item }: { item: VisitorItem }) {
  const [status, setStatus] = useState<"idle" | "copied" | "shared" | "error">(
    "idle",
  );

  useEffect(() => {
    setStatus("idle");
  }, [item.id]);

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/items/${item.id}`
      : `/items/${item.id}`;

  async function onShare() {
    // Prefer the native share sheet on mobile; fall back to clipboard
    // copy with a transient confirmation pill on desktop.
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({
          title: `${item.templateLabel} · Core Town`,
          url: shareUrl,
        });
        setStatus("shared");
        return;
      } catch {
        // User cancelled the sheet — quietly fall through to copy.
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setStatus("copied");
      window.setTimeout(() => setStatus("idle"), 1800);
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onShare}
        className="rounded-full border-2 border-[#0e1116] px-4 py-2 text-[12px] font-bold text-[#0e1116]"
        style={{ background: "#ffd75c" }}
      >
        Share
      </button>
      <a
        href={`/api/items/${item.id}/png`}
        download={`${item.templateId}-${item.id}.png`}
        className="rounded-full border-2 border-[#0e1116] bg-white px-3 py-2 text-[11px] font-bold text-ink"
      >
        Download
      </a>
      {status === "copied" ? (
        <span className="text-[11px] text-[#f6f3ea] opacity-80">Link copied</span>
      ) : null}
      {status === "shared" ? (
        <span className="text-[11px] text-[#f6f3ea] opacity-80">Shared</span>
      ) : null}
      {status === "error" ? (
        <span className="text-[11px] text-[#ff8a8a]">Couldn't copy — long-press the link</span>
      ) : null}
    </div>
  );
}
