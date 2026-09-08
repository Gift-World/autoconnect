import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

// Server-only OpenAI-compatible provider. No browser code receives this key.
export function createOpenAiProvider(apiKey: string) {
  return createOpenAICompatible({
    name: "openai",
    baseURL: "https://api.openai.com/v1",
    headers: { Authorization: `Bearer ${apiKey}` },
  });
}
