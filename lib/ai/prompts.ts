import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Loads a prompt from /prompts/<name>.md and fills {{placeholder}} tokens.
 *
 * Prompts live as Markdown so they can be edited without touching code
 * (CLAUDE.md convention). next.config.ts bundles /prompts into the serverless
 * function via outputFileTracingIncludes so this read works in production.
 */
export async function loadPrompt(
  name: string,
  vars: Record<string, string> = {},
): Promise<string> {
  const file = path.join(process.cwd(), "prompts", `${name}.md`);
  let text = await fs.readFile(file, "utf8");
  for (const [key, value] of Object.entries(vars)) {
    text = text.replaceAll(`{{${key}}}`, value);
  }
  return text;
}
