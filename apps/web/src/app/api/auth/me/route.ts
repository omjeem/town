// Returns the current signed-in user, or `null`.
// The browser hits this on app mount and after a login round-trip.

import { NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/session";

export async function GET() {
  const row = await getSessionFromCookie();
  if (!row) return NextResponse.json({ user: null });
  return NextResponse.json({
    user: {
      id: row.user.id,
      name: row.user.name,
      email: row.user.email,
      workspaceId: row.user.workspaceId,
    },
  });
}
