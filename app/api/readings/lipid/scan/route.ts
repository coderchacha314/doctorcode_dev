import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { extractFromReport } from "@/lib/scan-report";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { error } = await requireRole("PATIENT");
  if (error) return error;

  let body: { image: string; mimeType: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { image, mimeType } = body;
  if (!image || !mimeType) return NextResponse.json({ error: "image and mimeType are required" }, { status: 400 });

  try {
    const extracted = await extractFromReport(image, mimeType, `This is a medical lab report. Extract lipid profile / cholesterol test values if present.
Respond ONLY with a JSON object (use null for missing values):
{
  "totalCholesterol": <number mg/dL or null>,
  "ldl": <number mg/dL or null>,
  "hdl": <number mg/dL or null>,
  "triglycerides": <number mg/dL or null>,
  "vldl": <number mg/dL or null>,
  "reportDate": "<YYYY-MM-DD or null>"
}`);
    return NextResponse.json({ extracted });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 422 });
  }
}
