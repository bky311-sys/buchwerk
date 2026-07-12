// Thin wrapper around the Anthropic Messages API via fetch.
//
// We call the REST endpoint directly instead of pulling in @anthropic-ai/sdk:
// the project is edited through the GitHub API without a local checkout, so we
// can't regenerate pnpm-lock.yaml — adding a dependency would break the build.
// fetch keeps the dependency surface unchanged.

const ANTHROPIC_MESSAGES_URL = "https://api.anthropic.com/v1/messages";

// Manuscript model (Sonnet for cost on token-heavy book text). Overridable via
// env so the exact model id can be corrected without a code change — verify the
// id is valid for the Anthropic account before go-live.
const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";

type Message = { role: "user" | "assistant"; content: string };

type ClaudeOptions = {
  system?: string;
  messages: Message[];
  maxTokens: number;
  // When set, the response is constrained to this JSON schema.
  jsonSchema?: Record<string, unknown>;
  // When set, Claude may run web searches (server-side tool) to ground its
  // answer in current, cited sources. `maxUses` caps how many searches it may
  // run — keep it small so a single request stays under the function limit.
  // NOTE: web search must be enabled for the Anthropic organisation.
  webSearch?: { maxUses?: number };
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
  if (opts.webSearch) {
    // Server-side web search tool. Anthropic runs the search loop internally and
    // returns the final message (text blocks + web_search_tool_result blocks);
    // we only keep the text below, so no client-side tool loop is needed.
    body.tools = [
      {
        type: "web_search_20250305",
        name: "web_search",
        max_uses: opts.webSearch.maxUses ?? 5,
      },
    ];
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

// Same call but parses the (schema-constrained) JSON response. Tolerates a model
// that wraps the JSON in ```json fences or surrounding prose.
export async function claudeJson(opts: ClaudeOptions): Promise<unknown> {
  const text = await claudeText(opts);
  return JSON.parse(extractJson(text));
}

// Pulls the JSON payload out of a model response: strips ```json fences, else
// falls back to the outermost {...} / [...] span. Returns the trimmed input if
// neither matches (so JSON.parse throws a meaningful error).
function extractJson(text: string): string {
  const trimmed = text.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fence) return fence[1].trim();
  const firstBrace = trimmed.search(/[[{]/);
  const lastBrace = Math.max(trimmed.lastIndexOf("}"), trimmed.lastIndexOf("]"));
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }
  return trimmed;
}
