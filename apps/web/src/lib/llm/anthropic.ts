// Anthropic provider for the LLM router.
//
// This is the ONLY file in apps/web that imports `@anthropic-ai/sdk`.
// Everything else goes through the router. Keeping the SDK boxed in here
// means swapping models / providers stays a one-file change.
//
// Model constraints on Opus 4.7 (don't change without re-reading the
// migration guide):
//   - `model` must be exactly "claude-opus-4-7" (no date suffix)
//   - `thinking` must be `{ type: "adaptive" }`
//   - no `temperature` / `top_p` / `top_k` / `budget_tokens`
//   - `effort` goes inside `output_config`, not top-level
//
// We use `client.messages.parse()` so the SDK handles the JSON schema
// round-trip. Throws on `parsed_output === null` — the caller decides
// whether to degrade or surface the failure.

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { RunStructuredArgs, RunStructuredResult } from "./types";

// Truly lazy. The SDK reads ANTHROPIC_API_KEY automatically, but Next.js
// page-data collection imports server modules at build time even when no
// request has run, so deferring the constructor avoids spurious build
// failures on deploys that ship without ANTHROPIC_API_KEY (e.g.
// LLM_PROVIDER=openai-only deployments).
let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (_client === null) {
    _client = new Anthropic();
  }
  return _client;
}

export async function runStructuredAnthropic<T>(
  args: RunStructuredArgs<T>,
  model: string,
): Promise<RunStructuredResult<T>> {
  const response = await getClient().messages.parse({
    model,
    max_tokens: 2048,
    thinking: { type: "adaptive" },
    output_config: {
      effort: "medium",
      // zodOutputFormat handles the JSON-schema conversion. We pass the
      // schema in as `any` because the SDK's helper is pinned to its own
      // zod surface and there's no clean way to thread the generic
      // through without a cast.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      format: zodOutputFormat(args.zodSchema as any),
    },
    // Array-form system block with an ephemeral cache breakpoint on the
    // long, stable prompt. The volatile per-call payload sits in the
    // user message below, AFTER the breakpoint — that's the whole point
    // of caching the system prefix.
    system: [
      {
        type: "text",
        text: args.system,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: args.user,
      },
    ],
  });

  const parsed = response.parsed_output as T | null;
  if (parsed === null || parsed === undefined) {
    throw new Error("Anthropic returned no parsed output");
  }

  return {
    parsed,
    usage: response.usage,
    providerUsed: "anthropic",
  };
}
