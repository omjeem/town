"use client";

// Memory Explorer overlay — LIBRARY → reading-table interaction.
//
// Three steps stack in a single panel so back navigation feels natural:
//   1. labels  — virtualized, searchable list of CORE labels
//   2. docs    — virtualized, searchable list of documents in a label
//                (label-filtered listing for browse; CORE's
//                /documents/search when the user types a query)
//   3. doc     — full document content
//
// All CORE traffic goes through /api/core/* Route Handlers so the bearer
// token stays server-side.

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ui } from "./store";
import { PALETTE } from "../game/config";

type Label = {
  id: string;
  name: string;
  description: string | null;
  color: string;
};

type DocumentRow = {
  id: string;
  title: string;
  source: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  labelIds: string[];
};

type DocumentFull = DocumentRow & {
  content: string;
};

type Step =
  | { kind: "labels" }
  | { kind: "docs"; label: Label }
  | { kind: "doc"; label: Label; documentId: string };

const ACCENT = PALETTE.h270; // library purple

export function Explorer() {
  const [step, setStep] = useState<Step>({ kind: "labels" });

  // ESC handling: pop one step, or close if we're at the top.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      setStep((s) => {
        if (s.kind === "doc") return { kind: "docs", label: s.label };
        if (s.kind === "docs") return { kind: "labels" };
        ui.closeExplorer();
        return s;
      });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div
      className="nb-modal-backdrop fixed inset-0 z-[55] flex items-center justify-center"
      style={{ background: "rgba(14, 17, 22, 0.7)" }}
      onClick={() => ui.closeExplorer()}
    >
      <div
        className="nb-card nb-modal-card relative flex h-[80vh] w-[min(720px,92vw)] flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1.5 w-full" style={{ background: ACCENT }} />

        <Header step={step} onBack={(s) => setStep(s)} />

        <div className="min-h-0 flex-1 overflow-hidden">
          {step.kind === "labels" ? (
            <LabelsStep onPick={(label) => setStep({ kind: "docs", label })} />
          ) : null}
          {step.kind === "docs" ? (
            <DocsStep
              label={step.label}
              onPick={(doc) =>
                setStep({ kind: "doc", label: step.label, documentId: doc.id })
              }
            />
          ) : null}
          {step.kind === "doc" ? (
            <DocStep documentId={step.documentId} />
          ) : null}
        </div>

        <Footer onClose={() => ui.closeExplorer()} />
      </div>
    </div>
  );
}

function Header({
  step,
  onBack,
}: {
  step: Step;
  onBack: (s: Step) => void;
}) {
  let title = "MEMORY EXPLORER";
  let crumb: string | null = null;
  let backTo: Step | null = null;

  if (step.kind === "docs") {
    title = step.label.name.toUpperCase();
    crumb = "labels";
    backTo = { kind: "labels" };
  } else if (step.kind === "doc") {
    title = "DOCUMENT";
    crumb = step.label.name;
    backTo = { kind: "docs", label: step.label };
  }

  return (
    <div className="flex items-center gap-3 border-b-2 border-black px-5 py-3">
      {backTo ? (
        <button
          type="button"
          onClick={() => onBack(backTo!)}
          className="text-xs font-semibold uppercase text-[#1a1d22] opacity-60 hover:opacity-100"
        >
          ← {crumb}
        </button>
      ) : null}
      <div className="text-base font-black tracking-wide text-[#1a1d22]">
        {title}
      </div>
    </div>
  );
}

function Footer({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex items-center justify-between border-t-2 border-black px-4 py-2">
      <span className="text-[10px] font-medium uppercase text-[#1a1d22] opacity-50">
        ESC to go back · click outside to close
      </span>
      <button
        type="button"
        onClick={onClose}
        className="text-xs font-medium uppercase text-[#1a1d22] opacity-60 hover:opacity-100"
      >
        Close
      </button>
    </div>
  );
}

// ===========================================================================
// Step 1 — Labels
// ===========================================================================

function LabelsStep({ onPick }: { onPick: (l: Label) => void }) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounced(query, 250);

  const [labels, setLabels] = useState<Label[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    setError(null);
    setLabels(null);
    const qs = new URLSearchParams();
    if (debouncedQuery.trim()) qs.set("search", debouncedQuery.trim());
    fetch(`/api/core/labels?${qs.toString()}`, { signal: ac.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error(await safeBody(r));
        return (await r.json()) as Label[];
      })
      .then((data) => setLabels(Array.isArray(data) ? data : []))
      .catch((e) => {
        if (e.name === "AbortError") return;
        setError(e.message ?? "failed to load labels");
        setLabels([]);
      });
    return () => ac.abort();
  }, [debouncedQuery]);

  return (
    <div className="flex h-full flex-col">
      <SearchInput
        placeholder="Search labels…"
        value={query}
        onChange={setQuery}
      />
      <VirtualList
        items={labels}
        empty="No labels found."
        error={error}
        rowHeight={56}
        renderRow={(label) => (
          <button
            key={label.id}
            type="button"
            onClick={() => onPick(label)}
            className="flex h-full w-full items-center gap-3 border-b border-black/10 px-4 text-left hover:bg-black/[0.04]"
          >
            <span
              aria-hidden
              className="h-3 w-3 shrink-0 rounded-full border border-black/30"
              style={{ background: label.color || "#999" }}
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold text-[#1a1d22]">
                {label.name}
              </div>
              {label.description ? (
                <div className="truncate text-[11px] text-[#1a1d22] opacity-60">
                  {label.description}
                </div>
              ) : null}
            </div>
            <span className="text-[11px] uppercase text-[#1a1d22] opacity-40">
              open →
            </span>
          </button>
        )}
      />
    </div>
  );
}

// ===========================================================================
// Step 2 — Documents (paginated browse + full-text search)
// ===========================================================================

type ListResponse = {
  documents: DocumentRow[];
  hasMore: boolean;
  nextCursor: string | null;
};

function DocsStep({
  label,
  onPick,
}: {
  label: Label;
  onPick: (d: DocumentRow) => void;
}) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounced(query, 250);

  const [docs, setDocs] = useState<DocumentRow[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch first page (or run search) whenever the label or query changes.
  useEffect(() => {
    const ac = new AbortController();
    setDocs(null);
    setCursor(null);
    setHasMore(false);
    setError(null);

    const q = debouncedQuery.trim();
    const run = async () => {
      try {
        if (q) {
          const url = `/api/core/documents/search?q=${encodeURIComponent(q)}&labelIds=${encodeURIComponent(label.id)}&limit=50`;
          const r = await fetch(url, { signal: ac.signal });
          if (!r.ok) throw new Error(await safeBody(r));
          const body = (await r.json()) as { documents: DocumentRow[] };
          setDocs(body.documents ?? []);
          setHasMore(false);
        } else {
          const url = `/api/core/documents?label=${encodeURIComponent(label.id)}&limit=25`;
          const r = await fetch(url, { signal: ac.signal });
          if (!r.ok) throw new Error(await safeBody(r));
          const body = (await r.json()) as ListResponse;
          setDocs(body.documents ?? []);
          setHasMore(!!body.hasMore);
          setCursor(body.nextCursor ?? null);
        }
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setError(e?.message ?? "failed to load documents");
        setDocs([]);
      }
    };
    void run();
    return () => ac.abort();
  }, [label.id, debouncedQuery]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !cursor) return;
    setLoadingMore(true);
    try {
      const url = `/api/core/documents?label=${encodeURIComponent(label.id)}&cursor=${encodeURIComponent(cursor)}&limit=25`;
      const r = await fetch(url);
      if (!r.ok) throw new Error(await safeBody(r));
      const body = (await r.json()) as ListResponse;
      setDocs((prev) => [...(prev ?? []), ...(body.documents ?? [])]);
      setHasMore(!!body.hasMore);
      setCursor(body.nextCursor ?? null);
    } catch (e: any) {
      setError(e?.message ?? "failed to load more");
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [cursor, hasMore, label.id, loadingMore]);

  return (
    <div className="flex h-full flex-col">
      <SearchInput
        placeholder={`Search in ${label.name}…`}
        value={query}
        onChange={setQuery}
      />
      <VirtualList
        items={docs}
        empty={
          debouncedQuery
            ? "No matches in this label."
            : "No documents in this label yet."
        }
        error={error}
        rowHeight={64}
        onEndReached={debouncedQuery ? undefined : loadMore}
        footer={
          hasMore && !debouncedQuery ? (
            <div className="px-4 py-2 text-center text-[11px] uppercase text-[#1a1d22] opacity-50">
              {loadingMore ? "loading…" : "scroll for more"}
            </div>
          ) : null
        }
        renderRow={(doc) => (
          <button
            key={doc.id}
            type="button"
            onClick={() => onPick(doc)}
            className="flex h-full w-full flex-col justify-center border-b border-black/10 px-4 text-left hover:bg-black/[0.04]"
          >
            <div className="truncate text-sm font-bold text-[#1a1d22]">
              {doc.title || "(untitled)"}
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-[11px] text-[#1a1d22] opacity-60">
              <span className="truncate">{doc.source || "core"}</span>
              <span aria-hidden>·</span>
              <span className="shrink-0">{formatDate(doc.createdAt)}</span>
            </div>
          </button>
        )}
      />
    </div>
  );
}

// ===========================================================================
// Step 3 — Document detail
// ===========================================================================

function DocStep({ documentId }: { documentId: string }) {
  const [doc, setDoc] = useState<DocumentFull | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    setDoc(null);
    setError(null);
    fetch(`/api/core/documents/${encodeURIComponent(documentId)}`, {
      signal: ac.signal,
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(await safeBody(r));
        return (await r.json()) as { document: DocumentFull | null };
      })
      .then((body) => {
        if (!body.document) {
          setError("Document not found.");
          return;
        }
        setDoc(body.document);
      })
      .catch((e) => {
        if (e.name === "AbortError") return;
        setError(e.message ?? "failed to load document");
      });
    return () => ac.abort();
  }, [documentId]);

  if (error) {
    return <Empty message={error} tone="error" />;
  }
  if (!doc) {
    return <Empty message="loading…" />;
  }
  return (
    <div className="h-full overflow-y-auto px-5 py-4">
      <div className="text-lg font-black text-[#1a1d22]">
        {doc.title || "(untitled)"}
      </div>
      <div className="mt-1 flex items-center gap-2 text-[11px] text-[#1a1d22] opacity-60">
        <span>{doc.source || "core"}</span>
        <span aria-hidden>·</span>
        <span>{formatDate(doc.createdAt)}</span>
        {doc.type ? (
          <>
            <span aria-hidden>·</span>
            <span className="uppercase">{doc.type}</span>
          </>
        ) : null}
      </div>
      <pre className="mt-4 whitespace-pre-wrap break-words font-mono text-[13px] leading-relaxed text-[#1a1d22]">
        {doc.content || "(empty document)"}
      </pre>
    </div>
  );
}

// ===========================================================================
// Shared bits
// ===========================================================================

function SearchInput({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="border-b-2 border-black px-4 py-3">
      <input
        autoFocus
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="nb-input w-full px-3 py-1.5 text-sm"
      />
    </div>
  );
}

type VirtualListProps<T> = {
  items: T[] | null;       // null = loading
  empty: string;
  error: string | null;
  rowHeight: number;
  renderRow: (item: T, index: number) => React.ReactNode;
  onEndReached?: () => void;
  footer?: React.ReactNode;
};

function VirtualList<T>({
  items,
  empty,
  error,
  rowHeight,
  renderRow,
  onEndReached,
  footer,
}: VirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items?.length ?? 0,
    estimateSize: () => rowHeight,
    getScrollElement: () => parentRef.current,
    overscan: 8,
  });

  // Infinite-scroll trigger: fire onEndReached when the last visible row is
  // within ~5 rows of the end of the list.
  const onEndRef = useRef(onEndReached);
  onEndRef.current = onEndReached;
  const virtualItems = virtualizer.getVirtualItems();
  const lastVisible = virtualItems[virtualItems.length - 1];
  useEffect(() => {
    if (!items || !onEndRef.current) return;
    if (!lastVisible) return;
    if (lastVisible.index >= items.length - 5) {
      onEndRef.current();
    }
  }, [items, lastVisible]);

  if (error) return <Empty message={error} tone="error" />;
  if (items === null) return <Empty message="loading…" />;
  if (items.length === 0) return <Empty message={empty} />;

  const totalHeight = virtualizer.getTotalSize();

  return (
    <div ref={parentRef} className="h-full overflow-y-auto">
      <div
        style={{ height: totalHeight, position: "relative", width: "100%" }}
      >
        {virtualItems.map((vRow) => {
          const item = items[vRow.index];
          return (
            <div
              key={vRow.key}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: rowHeight,
                transform: `translateY(${vRow.start}px)`,
              }}
            >
              {renderRow(item, vRow.index)}
            </div>
          );
        })}
      </div>
      {footer}
    </div>
  );
}

function Empty({
  message,
  tone,
}: {
  message: string;
  tone?: "error";
}) {
  return (
    <div className="flex h-full items-center justify-center px-6 text-center">
      <p
        className={
          tone === "error"
            ? "text-sm text-[#b34242]"
            : "text-sm text-[#1a1d22] opacity-60"
        }
      >
        {message}
      </p>
    </div>
  );
}

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

async function safeBody(r: Response): Promise<string> {
  try {
    const text = await r.text();
    try {
      const j = JSON.parse(text);
      return j.error ?? `HTTP ${r.status}`;
    } catch {
      return text.slice(0, 200) || `HTTP ${r.status}`;
    }
  } catch {
    return `HTTP ${r.status}`;
  }
}

