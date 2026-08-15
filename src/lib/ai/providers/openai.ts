import type { AIRequest, LLMProvider } from "../types";

export class OpenAIProvider implements LLMProvider {
  readonly name = "openai";

  constructor(
    private readonly apiKey: string,
    private readonly baseUrl = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
    private readonly model = process.env.OPENAI_MODEL ?? "gpt-4o-mini",
  ) {}

  async run(request: AIRequest): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        temperature: 0.8,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: request.system },
          {
            role: "user",
            content: `${request.user}\n\nPROJECT CONTEXT (authoritative project memory):\n${JSON.stringify(
              request.context,
            )}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`LLM request failed (${response.status}): ${detail.slice(0, 500)}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("LLM returned an empty response");

    try {
      return JSON.parse(content);
    } catch {
      throw new Error("LLM returned invalid JSON");
    }
  }
}
