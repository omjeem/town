// Tiny helper for Route Handlers that proxy through to CORE.
//
// Pulls the session id off the cookie, resolves a fresh CORE access token
// (refreshing it transparently if needed), and fetches the upstream path.
// Returns the upstream Response unchanged so the caller can stream JSON
// back to the browser without parse/re-serialize.

import { cookies } from "next/headers";
import { getOAuthConfig } from "./oauth";
import { SESSION_COOKIE, getAccessTokenForSession } from "./session";

export type CoreFetchInit = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  search?: Record<string, string | number | undefined | null>;
  body?: unknown;
  signal?: AbortSignal;
};

export async function coreFetch(path: string, init: CoreFetchInit = {}) {
  const jar = await cookies();
  const sid = jar.get(SESSION_COOKIE)?.value;
  if (!sid) {
    return jsonError(401, "not authenticated");
  }

  let token: string;
  try {
    token = await getAccessTokenForSession(sid);
  } catch (e) {
    return jsonError(401, e instanceof Error ? e.message : "session invalid");
  }

  const cfg = getOAuthConfig();
  const url = new URL(`${cfg.base}${path.startsWith("/") ? path : `/${path}`}`);
  if (init.search) {
    for (const [k, v] of Object.entries(init.search)) {
      if (v === undefined || v === null || v === "") continue;
      url.searchParams.set(k, String(v));
    }
  }

  const headers: Record<string, string> = {
    authorization: `Bearer ${token}`,
    accept: "application/json",
  };
  let body: BodyInit | undefined;
  if (init.body !== undefined) {
    headers["content-type"] = "application/json";
    body = JSON.stringify(init.body);
  }

  const upstream = await fetch(url, {
    method: init.method ?? "GET",
    headers,
    body,
    signal: init.signal,
    // Never cache — these are user-scoped and change frequently.
    cache: "no-store",
  });

  // Re-emit the body with a clean header set. Node's fetch auto-decompresses
  // gzip/br bodies, but the upstream response object still advertises
  // `content-encoding: gzip` (and a stale `content-length`). Forwarding the
  // raw Response to the browser makes Chrome try to gunzip plain bytes and
  // fail with ERR_CONTENT_DECODING_FAILED. Reading once and rebuilding the
  // Response strips those hop-by-hop headers.
  const text = await upstream.text();
  const contentType =
    upstream.headers.get("content-type") ?? "application/json";
  return new Response(text, {
    status: upstream.status,
    headers: { "content-type": contentType },
  });
}

function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "content-type": "application/json" },
  });
}
