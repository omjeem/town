"use client";

// Tasks overlay — OFFICE → task board interaction.
//
// Mirrors CORE's task layout: search input on top, then status sections
// (Waiting / Review / Ready / Working / Todo). Each row shows a tinted
// status circle, title, and metadata pills (source, schedule, recurring).
// Hits /api/core/tasks server-side (token never leaves the server).

import { useEffect, useMemo, useState } from "react";
import { ui } from "./store";
import { PALETTE } from "../game/config";

type TaskStatus =
  | "Todo"
  | "Waiting"
  | "Ready"
  | "Working"
  | "Review"
  | "Done";

type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  source: string | null;
  schedule: string | null;
  nextRunAt: string | null;
  isActive: boolean;
  maxOccurrences: number | null;
  createdAt: string;
  updatedAt: string;
};

// Section order matches the user's reference. Done is excluded — the
// office board is for live work.
const SECTIONS: TaskStatus[] = ["Waiting", "Review", "Ready", "Working", "Todo"];

// Pill + circle colors per status. Pill uses a tinted bg + dark text;
// circle ring uses the saturated accent.
const STATUS_STYLES: Record<
  TaskStatus,
  { ring: string; pillBg: string; pillFg: string }
> = {
  Waiting: { ring: "#e67333", pillBg: "#fbe2d2", pillFg: "#7a3614" },
  Review:  { ring: "#886dbc", pillBg: "#ece4f5", pillFg: "#3f2b66" },
  Ready:   { ring: "#0381e9", pillBg: "#dceaf6", pillFg: "#143d63" },
  Working: { ring: "#dcb016", pillBg: "#f7eccb", pillFg: "#5a4408" },
  Todo:    { ring: "#8c93a0", pillBg: "#e3e6eb", pillFg: "#2a2f3a" },
  Done:    { ring: "#54935b", pillBg: "#dbe9dd", pillFg: "#1f3a25" },
};

const OFFICE_ACCENT = PALETTE.h240;

export function Tasks() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounced(query, 250);
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        ui.closeTasks();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    setTasks(null);
    setError(null);
    const qs = new URLSearchParams();
    if (debouncedQuery.trim()) qs.set("search", debouncedQuery.trim());
    fetch(`/api/core/tasks?${qs.toString()}`, { signal: ac.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error(await safeBody(r));
        return (await r.json()) as Task[];
      })
      .then((data) => setTasks(Array.isArray(data) ? data : []))
      .catch((e) => {
        if (e.name === "AbortError") return;
        setError(e.message ?? "failed to load tasks");
        setTasks([]);
      });
    return () => ac.abort();
  }, [debouncedQuery]);

  const grouped = useMemo(() => groupByStatus(tasks ?? []), [tasks]);

  return (
    <div
      className="nb-modal-backdrop fixed inset-0 z-[55] flex items-center justify-center"
      style={{ background: "rgba(14, 17, 22, 0.7)" }}
      onClick={() => ui.closeTasks()}
    >
      <div
        className="nb-card nb-modal-card relative flex h-[80vh] w-[min(720px,92vw)] flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1.5 w-full" style={{ background: OFFICE_ACCENT }} />

        <div className="flex items-center gap-3 border-b-2 border-black px-5 py-3">
          <div className="text-base font-black tracking-wide text-[#1a1d22]">
            TASKS
          </div>
          {tasks ? (
            <span className="text-[11px] uppercase text-[#1a1d22] opacity-50">
              {tasks.length} total
            </span>
          ) : null}
        </div>

        <div className="border-b-2 border-black px-4 py-3">
          <input
            autoFocus
            type="search"
            placeholder="Search tasks…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="nb-input w-full px-3 py-1.5 text-sm"
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {renderBody({ tasks, error, grouped })}
        </div>

        <div className="flex items-center justify-between border-t-2 border-black px-4 py-2">
          <span className="text-[10px] font-medium uppercase text-[#1a1d22] opacity-50">
            ESC to close · click outside to dismiss
          </span>
          <button
            type="button"
            onClick={() => ui.closeTasks()}
            className="text-xs font-medium uppercase text-[#1a1d22] opacity-60 hover:opacity-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function renderBody({
  tasks,
  error,
  grouped,
}: {
  tasks: Task[] | null;
  error: string | null;
  grouped: Record<TaskStatus, Task[]>;
}) {
  if (error) {
    return (
      <Empty
        message={error}
        tone="error"
      />
    );
  }
  if (tasks === null) return <Empty message="loading…" />;
  if (tasks.length === 0) {
    return <Empty message="No tasks yet. Create one in CORE." />;
  }

  const sectionsWithContent = SECTIONS.filter((s) => grouped[s].length > 0);
  if (sectionsWithContent.length === 0) {
    return <Empty message="No active tasks (all Done)." />;
  }

  return (
    <div className="py-2">
      {sectionsWithContent.map((status) => (
        <Section key={status} status={status} tasks={grouped[status]} />
      ))}
    </div>
  );
}

function Section({ status, tasks }: { status: TaskStatus; tasks: Task[] }) {
  const style = STATUS_STYLES[status];
  return (
    <div className="mb-3">
      <div className="flex items-center px-5 py-1.5">
        <div
          className="flex items-center gap-2 rounded-full px-2.5 py-1"
          style={{ background: style.pillBg, color: style.pillFg }}
        >
          <StatusCircle status={status} size={14} />
          <span className="text-[12px] font-semibold leading-none">
            {status}
          </span>
        </div>
        <span className="ml-auto text-[10px] uppercase text-[#1a1d22] opacity-40">
          {tasks.length}
        </span>
      </div>
      <ul className="px-5">
        {tasks.map((t) => (
          <TaskRow key={t.id} task={t} />
        ))}
      </ul>
    </div>
  );
}

function TaskRow({ task }: { task: Task }) {
  const isRecurring = !!task.schedule;
  const isOneShotScheduled = !task.schedule && !!task.nextRunAt;
  const showButlerPill = isRecurring || isOneShotScheduled;

  return (
    <li className="flex items-start gap-3 border-b border-black/10 py-2 last:border-b-0">
      <div className="pt-0.5">
        <StatusCircle status={task.status} size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm leading-snug text-[#1a1d22]">
            {task.title || "(untitled)"}
          </span>
          {isRecurring ? <RecurringGlyph /> : null}
          {showButlerPill ? (
            <ButlerPill
              schedule={task.schedule}
              nextRunAt={task.nextRunAt}
              isRecurring={isRecurring}
            />
          ) : null}
        </div>
      </div>
    </li>
  );
}

function StatusCircle({ status, size }: { status: TaskStatus; size: number }) {
  const style = STATUS_STYLES[status];
  const filled = status === "Review" || status === "Working" || status === "Done";
  // Match the reference: Waiting/Todo show an open circle (sometimes with a
  // slash for Waiting); Review/Working/Done are filled.
  return (
    <span
      aria-hidden
      className="inline-block shrink-0 rounded-full"
      style={{
        width: size,
        height: size,
        border: `2px solid ${style.ring}`,
        background: filled ? style.ring : "transparent",
      }}
    />
  );
}

function RecurringGlyph() {
  // Tiny refresh-style glyph next to the title for recurring tasks.
  return (
    <span
      aria-label="recurring"
      title="Recurring"
      className="inline-flex h-3.5 w-3.5 items-center justify-center text-[#1a1d22] opacity-50"
    >
      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12a9 9 0 0 1 15.5-6.36L21 8" />
        <path d="M21 3v5h-5" />
        <path d="M21 12a9 9 0 0 1-15.5 6.36L3 16" />
        <path d="M3 21v-5h5" />
      </svg>
    </span>
  );
}

function ButlerPill({
  schedule,
  nextRunAt,
  isRecurring,
}: {
  schedule: string | null;
  nextRunAt: string | null;
  isRecurring: boolean;
}) {
  const when = formatNextRun(nextRunAt);
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-black/15 bg-black/[0.04] px-1.5 py-0.5 text-[11px] text-[#1a1d22]">
      <BotGlyph />
      <span className="font-medium">Butler</span>
      {when ? (
        <>
          <Dot />
          <span>{when}</span>
        </>
      ) : null}
      {isRecurring ? (
        <>
          <Dot />
          <span>recurring</span>
        </>
      ) : null}
    </span>
  );
}

function BotGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#1a1d22] opacity-70">
      <rect x="4" y="7" width="16" height="13" rx="2" />
      <path d="M12 7V3" />
      <circle cx="9" cy="13" r="1" />
      <circle cx="15" cy="13" r="1" />
      <path d="M9 17h6" />
    </svg>
  );
}

function Dot() {
  return <span aria-hidden className="opacity-40">·</span>;
}

function Empty({ message, tone }: { message: string; tone?: "error" }) {
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

function groupByStatus(tasks: Task[]): Record<TaskStatus, Task[]> {
  const acc: Record<TaskStatus, Task[]> = {
    Todo: [],
    Waiting: [],
    Ready: [],
    Working: [],
    Review: [],
    Done: [],
  };
  for (const t of tasks) {
    if (!acc[t.status]) acc[t.status] = [];
    acc[t.status].push(t);
  }
  // Newest first within each group for ergonomic reading.
  for (const k of Object.keys(acc) as TaskStatus[]) {
    acc[k].sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }
  return acc;
}

// Convert an ISO timestamp into a compact "in 9h" / "Jun 15" style label
// that mirrors CORE's task board. Past times collapse to "overdue".
function formatNextRun(nextRunAt: string | null): string | null {
  if (!nextRunAt) return null;
  const target = new Date(nextRunAt);
  if (Number.isNaN(target.getTime())) return null;
  const now = Date.now();
  const delta = target.getTime() - now;
  if (delta < 0) return "overdue";

  const minutes = Math.round(delta / 60_000);
  const hours = Math.round(delta / 3_600_000);
  const days = Math.round(delta / 86_400_000);

  if (minutes < 1) return "in <1m";
  if (minutes < 60) return `in ${minutes}m`;
  if (hours < 24) return `in ${hours}h`;
  if (days < 7) return `in ${days}d`;
  // Far out: show a calendar date.
  return target.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
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
