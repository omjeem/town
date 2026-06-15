// GET /api/core/labels?search=<q>
// Forwards to CORE's GET /api/v1/labels and returns the raw Label[] payload.

import { type NextRequest } from "next/server";
import { coreFetch } from "@/lib/coreClient";

export async function GET(req: NextRequest) {
  const search = new URL(req.url).searchParams.get("search") ?? undefined;
  return coreFetch("/api/v1/labels", { search: { search } });
}
