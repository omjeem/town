// Provider-agnostic model selection for the creator chat.
//
// Operators flip between Anthropic, OpenAI, and Ollama without touching
// call sites:
//   CREATOR_PROVIDER  "anthropic" (default) | "openai" | "ollama"
//   CREATOR_MODEL     provider-specific model id (optional)
//
// Defaults: anthropic → claude-sonnet-4-5, openai → gpt-4o-mini,
// ollama → gpt-oss:120b-cloud.
// All providers ship via the Vercel AI SDK v6, so the tool-call loop in
// /api/creator stays identical — streamText() abstracts the wire format
// (Anthropic's tool_use blocks vs OpenAI's function_call deltas).

import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";
import { ollamaModel } from "@/lib/ollama";

const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-4-5";
const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";

export type CreatorProvider = "anthropic" | "openai" | "ollama";

export function getCreatorModel(): LanguageModel {
  const raw = (process.env.CREATOR_PROVIDER ?? "anthropic").toLowerCase();
  const provider: CreatorProvider =
    raw === "openai" || raw === "ollama" ? raw : "anthropic";
  if (provider === "ollama") {
    // ollamaModel resolves CREATOR_MODEL ?? OLLAMA_MODEL ?? the default.
    return ollamaModel(process.env.CREATOR_MODEL);
  }
  const modelId =
    process.env.CREATOR_MODEL ??
    (provider === "openai" ? DEFAULT_OPENAI_MODEL : DEFAULT_ANTHROPIC_MODEL);
  return provider === "openai" ? openai(modelId) : anthropic(modelId);
}
