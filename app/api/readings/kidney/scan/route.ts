import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { error } = await requireRole("PATIENT");
  if (error) return error;

  let body: { image: string; mimeType: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { image, mimeType } = body;
  if (!image || !mimeType) {
    return NextResponse.json({ error: "image and mimeType are required" }, { status: 400 });
  }

  const validMimeTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!validMimeTypes.includes(mimeType)) {
    return NextResponse.json({ error: "Unsupported image type" }, { status: 400 });
  }

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
              data: image,
            },
          },
          {
            type: "text",
            text: `This is a medical lab report. Extract the following kidney function test values if present:
- Creatinine (mg/dL)
- BUN / Blood Urea Nitrogen (mg/dL)
- eGFR / Estimated Glomerular Filtration Rate (mL/min)
- Uric Acid (mg/dL)
- Report date (if visible)

Respond ONLY with a JSON object in this exact format (use null for any value not found):
{
  "creatinine": <number or null>,
  "bun": <number or null>,
  "egfr": <number or null>,
  "uricAcid": <number or null>,
  "reportDate": "<YYYY-MM-DD or null>"
}`,
          },
        ],
      },
    ],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text : "";

  // Extract JSON from the response
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return NextResponse.json({ error: "Could not parse values from report" }, { status: 422 });
  }

  let extracted: {
    creatinine: number | null;
    bun: number | null;
    egfr: number | null;
    uricAcid: number | null;
    reportDate: string | null;
  };

  try {
    extracted = JSON.parse(jsonMatch[0]);
  } catch {
    return NextResponse.json({ error: "Could not parse values from report" }, { status: 422 });
  }

  return NextResponse.json({ extracted });
}
