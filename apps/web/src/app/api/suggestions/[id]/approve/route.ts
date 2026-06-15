// POST /api/suggestions/[id]/approve
//
// Apply the suggestion's effect to the user's town and stamp the row
// "approved". Idempotent — if the underlying world already moved on
// (e.g. the building was added some other way), the row still flips to
// approved but `applied: false` comes back in the response.

import { NextResponse } from "next/server";

import { resolveUser } from "@/lib/auth-bearer";
import { approveSuggestion } from "@/lib/town/suggestions";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const resolved = await resolveUser(req);
  if (!resolved) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const result = await approveSuggestion(resolved.user.id, id);
  if (!result.ok) {
    const status =
      result.error === "not-found"
        ? 404
        : result.error === "already-resolved"
          ? 409
          : 500;
    return NextResponse.json(
      { error: result.error, detail: result.detail },
      { status },
    );
  }
  return NextResponse.json({
    ok: true,
    applied: result.applied,
    reason: result.reason,
    suggestion: result.row,
  });
}
