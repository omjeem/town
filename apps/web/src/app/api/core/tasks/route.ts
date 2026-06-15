// GET /api/core/tasks?search=<q>&status=<TaskStatus>
// Forwards to CORE's GET /api/v1/tasks. Returns Task[] (with subtasks +
// parentTask relations) per the upstream contract.

import { type NextRequest } from "next/server";
import { coreFetch } from "@/lib/coreClient";

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  return coreFetch("/api/v1/tasks", {
    search: {
      search: sp.get("search") ?? undefined,
      status: sp.get("status") ?? undefined,
    },
  });
}
