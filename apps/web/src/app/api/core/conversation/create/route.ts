// POST /api/core/conversation/create
// Forwards to CORE's POST /api/v1/conversation/create. Body shape:
//   { message: string, title?: string, source?: string, incognito?: boolean }
// Response includes `conversationId` we'll poll for the agent's reply.

import { type NextRequest } from "next/server";
import { coreFetch } from "@/lib/coreClient";

export async function POST(req: NextRequest) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  return coreFetch("/api/v1/conversation/create", {
    method: "POST",
    body: {
      ...body,
      source: body.source ?? "core-town",
    },
  });
}
