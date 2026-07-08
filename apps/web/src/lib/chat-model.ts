// Pick the chat model for /api/npc-chat. Reads LLM_PROVIDER (same env
// the structured-output router uses) but also auto-picks the one whose
// API key is actually set so a deploy with only OPENAI_API_KEY doesn't
// crash trying to call Anthropic.

import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";
import { hasOllama, ollamaModel } from "@/lib/ollama";

const ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";
const OPENAI_MODEL = "gpt-4o-mini";

export function getChatModel(): LanguageModel {
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const explicit = (process.env.LLM_PROVIDER ?? "").toLowerCase().trim();

  // Explicit override wins, as long as the matching key is present.
  if (explicit === "openai" && hasOpenAI) return openai(OPENAI_MODEL);
  if (explicit === "anthropic" && hasAnthropic) return anthropic(ANTHROPIC_MODEL);
  if (explicit === "ollama" && hasOllama()) return ollamaModel();

  // Otherwise pick whichever key is set; prefer Anthropic by tradition.
  // Ollama goes last so adding OLLAMA_API_KEY never changes a deploy that already runs on Anthropic or OpenAI.
  if (hasAnthropic) return anthropic(ANTHROPIC_MODEL);
  if (hasOpenAI) return openai(OPENAI_MODEL);
  if (hasOllama()) return ollamaModel();
  
  throw new Error(
    "No LLM key configured. Set ANTHROPIC_API_KEY, OPENAI_API_KEY, or " +
      "OLLAMA_API_KEY (optionally LLM_PROVIDER=anthropic|openai|ollama " +
      "to force).",
  );
}
