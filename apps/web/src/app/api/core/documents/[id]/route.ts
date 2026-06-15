// GET /api/core/documents/[id]
// Forwards to CORE's GET /api/v1/documents/:documentId for full content.

import { type NextRequest } from "next/server";
import { coreFetch } from "@/lib/coreClient";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  return coreFetch(`/api/v1/documents/${encodeURIComponent(id)}`);
}
