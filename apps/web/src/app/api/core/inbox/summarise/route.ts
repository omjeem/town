// POST /api/core/inbox/summarise
// Forwards to CORE's POST /api/v1/inbox/summarise. Body defaults to
// { mode: "voice" } — the same shape the desktop inbox pill uses.
// Returns { summary, count } and atomically marks the inbox rows checked
// on CORE's side so subsequent polls see count=0.

import { type NextRequest } from "next/server";
import { coreFetch } from "@/lib/coreClient";

export async function POST(req: NextRequest) {
  let body: unknown = { mode: "voice" };
  try {
    body = await req.json();
  } catch {
    // Empty body is fine — fall through to the default.
  }
  return coreFetch("/api/v1/inbox/summarise", {
    method: "POST",
    body,
  });
}
