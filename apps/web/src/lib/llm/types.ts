// Multi-provider LLM contract.
//
// One task per LLM call today (the curator), but the type is open so we can
// add more (judge, summarizer, etc.) without rewiring the router. Per-task
// provider overrides layer in later — v2 just keys off the global
// LLM_PROVIDER env var.
//
// Provider impls (`./anthropic.ts`, `./openai.ts`) export a single
// `runStructured` function with this exact shape, and the router dispatches
// based on `getProviderForTask`.

import type { z } from "zod/v4";

/** Distinct LLM call sites. Extend (don't replace) when new task kinds land. */
export type LLMTask = "curator";

/** Provider id. Must match the values accepted by the LLM_PROVIDER env var. */
export type LLMProvider = "anthropic" | "openai";

/**
 * Provider-agnostic call args. Each provider impl interprets these against
 * its own SDK shape (Anthropic uses array-form system blocks with cache
 * breakpoints; OpenAI uses `instructions` on the Responses API).
 */
export type RunStructuredArgs<T> = {
  /** Long, stable system text. Providers cache this when they can. */
  system: string;
  /** Volatile per-call user payload. Goes after the cache breakpoint. */
  user: string;
  /** Zod schema for the structured output. Providers convert to JSON schema. */
  zodSchema: z.ZodType<T>;
  /** Which task is calling. Drives model + provider selection. */
  taskKind: LLMTask;
};

export type RunStructuredResult<T> = {
  parsed: T;
  /** Optional usage rollup — we don't standardise the fields, callers can
   *  log whatever the provider returns as-is. */
  usage?: unknown;
  /** Which provider actually served the call (handy for logs). */
  providerUsed: LLMProvider;
};
