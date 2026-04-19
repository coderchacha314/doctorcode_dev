import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type ImageMime = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

export async function extractFromReport(
  data: string,
  mimeType: string,
  prompt: string
): Promise<unknown> {
  const isPdf = mimeType === "application/pdf";

  const fileContent = isPdf
    ? ({
        type: "document",
        source: {
          type: "base64",
          media_type: "application/pdf",
          data,
        },
      } as const)
    : ({
        type: "image",
        source: {
          type: "base64",
          media_type: mimeType as ImageMime,
          data,
        },
      } as const);

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: [fileContent, { type: "text", text: prompt }],
      },
    ],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text : "";
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No values found in report");
  return JSON.parse(jsonMatch[0]);
}
