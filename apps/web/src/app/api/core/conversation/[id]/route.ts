// GET /api/core/conversation/[id]
// Forwards to CORE's GET /api/v1/conversation/$conversationId. Returns the
// conversation metadata + the full ConversationHistory array. We poll this
// after sending a user message to discover the agent's reply.

import { type NextRequest } from "next/server";
import { coreFetch } from "@/lib/coreClient";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  return coreFetch(`/api/v1/conversation/${encodeURIComponent(id)}`);
}
