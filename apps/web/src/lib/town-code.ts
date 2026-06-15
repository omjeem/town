// Helpers for town slugs + share codes.
//
// Slug: lowercase, hyphen-separated, no leading/trailing hyphens, 2-32 chars.
// We accept what the user types, normalize, and validate. Slug uniqueness
// is enforced at the DB level (Town.slug @unique).
//
// Share code: 6-char base32 over Crockford's alphabet (no I/L/O/U to avoid
// transcription mistakes). Generated server-side, stored on the Town row,
// and rotated via the Share modal's Reset button.

import { randomBytes } from "node:crypto";

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,30}[a-z0-9])?$/;

export function normalizeSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

export function isValidSlug(slug: string): boolean {
  if (slug.length < 2 || slug.length > 32) return false;
  if (RESERVED_SLUGS.has(slug)) return false;
  return SLUG_RE.test(slug);
}

// These collide with real route segments so we never let a user grab them.
const RESERVED_SLUGS = new Set([
  "api",
  "auth",
  "onboarding",
  "_next",
  "public",
  "favicon.ico",
]);

// Crockford-style base32: 32 chars, no I/L/O/U.
const CODE_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export function generateShareCode(): string {
  // 6 chars = 30 bits of entropy ≈ 1B options. Plenty for a manual share.
  // Reject any collisions with a retry at the caller (Town.shareCode is
  // unique).
  const bytes = randomBytes(6);
  let out = "";
  for (let i = 0; i < 6; i++) {
    out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return out;
}

export function normalizeCode(input: string): string {
  return input.trim().toUpperCase().replace(/[^0-9A-Z]/g, "");
}

// Per-slug visitor cookie. Set after a successful gate; cleared by /logout.
// Value is JSON: { n: displayName }.
export function visitorCookieName(slug: string): string {
  return `town-visit-${slug}`;
}

// Visitor cookie shape — { n: name, c: codeAtEntry }. We re-check `c`
// against the town's current shareCode on every request so a Reset in the
// Share modal kicks existing visitors back to the gate.
export type VisitorCookie = { n: string; c: string };

export function parseVisitorCookie(raw: string | undefined): VisitorCookie | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { n?: unknown; c?: unknown };
    if (typeof parsed.n !== "string" || parsed.n.length === 0) return null;
    if (typeof parsed.c !== "string" || parsed.c.length === 0) return null;
    return { n: parsed.n, c: parsed.c };
  } catch {
    return null;
  }
}
