import { MockProvider } from "./providers/mock";
import { OpenAIProvider } from "./providers/openai";
import type { LLMProvider } from "./types";

let cached: LLMProvider | null = null;

export function getProvider(): LLMProvider {
  if (cached) return cached;
  const apiKey = process.env.OPENAI_API_KEY;
  cached = apiKey ? new OpenAIProvider(apiKey) : new MockProvider();
  return cached;
}

export function providerName(): string {
  return getProvider().name;
}
