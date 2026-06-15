// GET /api/core/documents/search?q=<query>&labelIds=<csv>&limit=25
// Forwards to CORE's GET /api/v1/documents/search.

import { type NextRequest } from "next/server";
import { coreFetch } from "@/lib/coreClient";

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  return coreFetch("/api/v1/documents/search", {
    search: {
      q: sp.get("q") ?? undefined,
      labelIds: sp.get("labelIds") ?? undefined,
      limit: sp.get("limit") ?? "25",
    },
  });
}
