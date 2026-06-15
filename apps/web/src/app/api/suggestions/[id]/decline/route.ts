// POST /api/suggestions/[id]/decline
//
// Mark the suggestion declined. No plot mutation, no apology — the
// player said no.

import { NextResponse } from "next/server";

import { resolveUser } from "@/lib/auth-bearer";
import { declineSuggestion } from "@/lib/town/suggestions";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const resolved = await resolveUser(req);
  if (!resolved) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const result = await declineSuggestion(resolved.user.id, id);
  if (!result.ok) {
    const status =
      result.error === "not-found"
        ? 404
        : result.error === "already-resolved"
          ? 409
          : 500;
    return NextResponse.json({ error: result.error }, { status });
  }
  return NextResponse.json({ ok: true, suggestion: result.row });
}
