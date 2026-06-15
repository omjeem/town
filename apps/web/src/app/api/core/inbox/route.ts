// GET /api/core/inbox?limit=20
// Forwards to CORE's GET /api/v1/inbox. Returns
//   { count, items: [{ id, message, taskId, channelType, createdAt }] }
// where `count` is the number of unread (checked IS NULL) VoiceInboxMessage
// rows for the signed-in user's workspace.

import { type NextRequest } from "next/server";
import { coreFetch } from "@/lib/coreClient";

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  return coreFetch("/api/v1/inbox", {
    search: { limit: sp.get("limit") ?? "20" },
  });
}
