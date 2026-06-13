// Thin wrapper around the Anthropic Messages API via fetch.
//
// We call the REST endpoint directly instead of pulling in @anthropic-ai/sdk:
// the project is edited through the GitHub API without a local checkout, so we
// can't regenerate pnpm-lock.yaml — adding a dependency would break the build.
// fetch keeps the dependency surface unchanged.

const ANTHROPIC_MESSAGES_URL = "https://api.anthropic.com/v1/messages";

// Manuscript model per CLAUDE.md (Sonnet for cost on token-heavy book text).
const MODEL = "claude-sonnet-4-6";

type Message = { role: "user" | "assistant"; content: string };

type ClaudeOptions = {
  system?: string;
  messages: Message[];
  maxTokens: number;
  // When set, the response is constrained to this JSON schema.
  jsonSchema?: Record<string, unknown>;
};

type MessagesResponse = {
  content: Array<{ type: string; text?: string }>;
  stop_reason: string;
};

export async function claudeText(opts: ClaudeOptions): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY ist nicht gesetzt.");
  }

  const body: Record<string, unknown> = {
    model: MODEL,
    max_tokens: opts.maxTokens,
    messages: opts.messages,
  };
  if (opts.system) body.system = opts.system;
  if (opts.jsonSchema) {
    body.output_config = {
      format: { type: "json_schema", schema: opts.jsonSchema },
    };
  }

  const response = await fetch(ANTHROPIC_MESSAGES_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Claude API ${response.status}: ${detail.slice(0, 500)}`);
  }

  const data = (await response.json()) as MessagesResponse;
  if (data.stop_reason === "refusal") {
    throw new Error("Die Anfrage wurde vom Modell abgelehnt.");
  }
  return data.content
    .filter((block) => block.type === "text")
    .map((block) => block.text ?? "")
    .join("");
}

// Same call but parses the (schema-constrained) JSON response.
export async function claudeJson(opts: ClaudeOptions): Promise<unknown> {
  const text = await claudeText(opts);
  return JSON.parse(text);
}
