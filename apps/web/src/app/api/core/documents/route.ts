// GET /api/core/documents?label=<id>&cursor=<isoTs>&limit=25
// Paginated listing of documents in a single label (or all if no label).
// Forwards to CORE's GET /api/v1/documents.

import { type NextRequest } from "next/server";
import { coreFetch } from "@/lib/coreClient";

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  return coreFetch("/api/v1/documents", {
    search: {
      label: sp.get("label") ?? undefined,
      cursor: sp.get("cursor") ?? undefined,
      limit: sp.get("limit") ?? "25",
    },
  });
}
