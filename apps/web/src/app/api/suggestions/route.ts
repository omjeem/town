// /api/suggestions
//
//   GET                       → { suggestions, count } for the signed-in user.
//                               Pending only; newest first.
//   GET ?probe=1              → cheap polling: just { count } of pending.

import { NextResponse } from "next/server";

import { resolveUser } from "@/lib/auth-bearer";
import {
  countPendingSuggestions,
  listPendingSuggestions,
} from "@/lib/town/suggestions";

export async function GET(req: Request) {
  const resolved = await resolveUser(req);
  if (!resolved) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const userId = resolved.user.id;
  const url = new URL(req.url);
  if (url.searchParams.has("probe")) {
    const count = await countPendingSuggestions(userId);
    return NextResponse.json({ count });
  }
  const suggestions = await listPendingSuggestions(userId);
  return NextResponse.json({
    suggestions,
    count: suggestions.length,
  });
}
