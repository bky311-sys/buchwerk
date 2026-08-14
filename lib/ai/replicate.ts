// Cover image generation via Replicate (Flux). Called with fetch — same reason
// as the Anthropic wrapper: no SDK dependency, so the lockfile stays untouched.

const MODELS = {
  schnell: "black-forest-labs/flux-schnell", // ~$0.003, fast drafts
  pro: "black-forest-labs/flux-1.1-pro", // ~$0.04, photorealistic finals
  // Flat-/Design-Illustration (Cover 2.0). Ideogram statt Recraft: liefert PNG
  // (Recraft nur WebP — pdf-lib kann WebP nicht in die Full-Wrap-PDF einbetten;
  // real getestet 14.08.).
  illustration: "ideogram-ai/ideogram-v3-turbo", // ~$0.03
} as const;

export type CoverModel = keyof typeof MODELS;

type Prediction = {
  status: string;
  output?: string | string[];
  detail?: string;
  title?: string;
  urls?: { get?: string };
};

export async function generateCoverImage(
  prompt: string,
  model: CoverModel,
): Promise<string> {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) throw new Error("REPLICATE_API_TOKEN ist nicht gesetzt.");

  // Ideogram: Design-Stil, Magic Prompt aus (unser Prompt ist bereits von
  // Claude ausformuliert — Umschreiben würde die Stil-Richtung verwässern).
  const input: Record<string, unknown> =
    model === "illustration"
      ? {
          prompt,
          aspect_ratio: "2:3", // portrait book cover
          style_type: "Design",
          magic_prompt_option: "Off",
        }
      : {
          prompt,
          aspect_ratio: "2:3", // portrait book cover
          output_format: "png", // PNG embeds reliably into the cover PDF (pdf-lib)
        };
  if (model === "schnell") {
    input.num_outputs = 1;
    input.go_fast = true;
  }

  const response = await fetch(
    `https://api.replicate.com/v1/models/${MODELS[model]}/predictions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Prefer: "wait",
      },
      body: JSON.stringify({ input }),
    },
  );

  let prediction = (await response.json()) as Prediction;
  if (!response.ok) {
    const message = prediction.detail ?? prediction.title ?? "Fehler";
    throw new Error(`Replicate ${response.status}: ${message}`);
  }

  // With "Prefer: wait" the prediction is usually terminal already; poll as a
  // fallback if it's still running.
  let tries = 0;
  const terminal = ["succeeded", "failed", "canceled"];
  while (!terminal.includes(prediction.status) && tries < 40) {
    const getUrl = prediction.urls?.get;
    if (!getUrl) break;
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const poll = await fetch(getUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    prediction = (await poll.json()) as Prediction;
    tries++;
  }

  if (prediction.status !== "succeeded") {
    throw new Error(`Bildgenerierung fehlgeschlagen (${prediction.status}).`);
  }

  const output = prediction.output;
  const url = Array.isArray(output) ? output[0] : output;
  if (typeof url !== "string") throw new Error("Kein Bild erhalten.");
  return url;
}
